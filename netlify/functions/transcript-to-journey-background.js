// Background processing for transcript conversion (15-minute timeout)
import { createClient } from '@supabase/supabase-js'

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function getSupabaseClient() {
  const supabaseServiceKey =
    process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!process.env.SUPABASE_URL || !supabaseServiceKey) {
    return null
  }
  return createClient(process.env.SUPABASE_URL, supabaseServiceKey)
}

function formatOpenAIError(status, errorText) {
  if (status === 429) {
    return (
      'OpenAI rate limit or quota exceeded (429). Wait a minute and retry, or check usage and billing at https://platform.openai.com/account/usage'
    )
  }
  if (status === 401) {
    return 'OpenAI API key is invalid or revoked (401). Check OPENAI_API_KEY in .env / Netlify.'
  }
  if (status === 403) {
    return 'OpenAI access denied (403). Your API key may lack access to gpt-4o.'
  }
  try {
    const parsed = JSON.parse(errorText)
    const msg = parsed?.error?.message
    if (msg) return `OpenAI error (${status}): ${msg}`
  } catch {
    // ignore
  }
  return `OpenAI error (${status})`
}

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  let jobId = null
  let supabase = null

  try {
    const body = JSON.parse(event.body || '{}')
    jobId = body.jobId || null
    let transcript = body.transcript
    let prompt = body.prompt
    const userId = body.userId

    supabase = getSupabaseClient()
    if (!supabase) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error:
            'Server misconfigured: set SUPABASE_URL and SUPABASE_SERVICE_KEY (service role).',
        }),
      }
    }

    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured')
    }

    // Preferred path: process existing job created by transcript-to-journey-start
    if (jobId) {
      const { data: job, error: loadError } = await supabase
        .from('ai_processing_jobs')
        .select('id, input_data, status')
        .eq('id', jobId)
        .single()

      if (loadError || !job) {
        throw new Error(loadError?.message || 'Job not found')
      }

      transcript = job.input_data?.transcript
      prompt = job.input_data?.prompt

      if (!transcript || !prompt) {
        throw new Error('Job is missing transcript or prompt in input_data')
      }

      console.log(`[${jobId}] Resuming transcript processing from stored job`)
    } else {
      // Legacy path: create job inline (client may not see jobId when Netlify returns 202)
      if (!transcript || !prompt || !userId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Missing required fields: jobId or transcript, prompt, userId' }),
        }
      }

      const { data: job, error: jobError } = await supabase
        .from('ai_processing_jobs')
        .insert({
          user_id: userId,
          job_type: 'transcript',
          status: 'processing',
          input_data: { transcript, prompt, transcriptLength: transcript.length },
        })
        .select()
        .single()

      if (jobError) {
        console.error('Error creating job:', jobError)
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Failed to create job', details: jobError.message }),
        }
      }

      jobId = job.id
      console.log(`[${jobId}] Starting transcript processing (legacy inline create)`)
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: transcript },
        ],
        temperature: 0.5,
        max_tokens: 16000,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenAI error:', response.status, errorText)
      throw new Error(formatOpenAIError(response.status, errorText))
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      throw new Error('No content in response')
    }

    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Could not find JSON in response')
    }

    const jsonString = jsonMatch[1] || jsonMatch[0]
    const journey = JSON.parse(jsonString)

    const { error: updateError } = await supabase
      .from('ai_processing_jobs')
      .update({
        status: 'completed',
        result_data: journey,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId)

    if (updateError) {
      console.error('Error updating job:', updateError)
    }

    console.log(`[${jobId}] Completed successfully`)

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, jobId }),
    }
  } catch (error) {
    console.error('Processing error:', error)

    if (jobId && supabase) {
      await supabase
        .from('ai_processing_jobs')
        .update({
          status: 'failed',
          error_message: error.message,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', jobId)
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error.message,
        jobId,
      }),
    }
  }
}
