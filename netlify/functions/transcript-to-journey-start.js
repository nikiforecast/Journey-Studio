// Synchronous handler: creates ai_processing_jobs row and returns jobId immediately.
// Background processing is triggered separately (202 responses do not return jobId to the client).
import { createClient } from '@supabase/supabase-js'

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function getSupabaseConfig() {
  const supabaseServiceKey =
    process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  return {
    url: process.env.SUPABASE_URL,
    key: supabaseServiceKey,
  }
}

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  try {
    const { transcript, prompt, userId } = JSON.parse(event.body || '{}')

    if (!transcript || !prompt || !userId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields: transcript, prompt, userId' }),
      }
    }

    const { url, key } = getSupabaseConfig()
    if (!url || !key) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error:
            'Server misconfigured: set SUPABASE_URL and SUPABASE_SERVICE_KEY (service role) in .env or Netlify env.',
        }),
      }
    }

    if (!process.env.OPENAI_API_KEY) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Server misconfigured: OPENAI_API_KEY is not set in .env or Netlify env.',
        }),
      }
    }

    const supabase = createClient(url, key)

    const { data: job, error: jobError } = await supabase
      .from('ai_processing_jobs')
      .insert({
        user_id: userId,
        job_type: 'transcript',
        status: 'processing',
        input_data: {
          transcript,
          prompt,
          transcriptLength: transcript.length,
        },
      })
      .select('id')
      .single()

    if (jobError) {
      console.error('Error creating transcript job:', jobError)
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: `Failed to create job: ${jobError.message}`,
          hint: 'Check ai_processing_jobs exists and user_id matches auth.users.',
        }),
      }
    }

    const jobId = job.id
    console.log(`[${jobId}] Transcript job created, enqueueing background processor`)

    const baseUrl =
      process.env.DEPLOY_URL ||
      process.env.URL ||
      process.env.DEPLOY_PRIME_URL ||
      'http://127.0.0.1:8888'

    const backgroundUrl = `${baseUrl}/.netlify/functions/transcript-to-journey-background`

    try {
      const bgResponse = await fetch(backgroundUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      })
      if (!bgResponse.ok && bgResponse.status !== 202) {
        const detail = await bgResponse.text()
        console.error(`Background trigger failed (${bgResponse.status}):`, detail)
        await supabase
          .from('ai_processing_jobs')
          .update({
            status: 'failed',
            error_message: `Failed to start background processor (${bgResponse.status})`,
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', jobId)
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Failed to start background processing', jobId }),
        }
      }
    } catch (enqueueError) {
      console.error('Background enqueue error:', enqueueError)
      await supabase
        .from('ai_processing_jobs')
        .update({
          status: 'failed',
          error_message: enqueueError.message || 'Failed to enqueue background processing',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', jobId)
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Failed to reach background function. Run `npx netlify dev` locally.',
          jobId,
        }),
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ jobId, status: 'processing' }),
    }
  } catch (error) {
    console.error('transcript-to-journey-start error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message || 'Unknown error' }),
    }
  }
}
