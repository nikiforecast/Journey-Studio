import { supabase } from './supabase'

export interface ExtractedExample {
  actor: string
  goal: string
  entry_point: string
  actions: string
  error: string
  outcome: string
}

export interface AIAnalysisResult {
  examples: ExtractedExample[]
  confidence: number
  processingTime: number
}

/**
 * Analyzes a screenshot of a Miro board to extract user journey examples
 * Only extracts data that is actually visible in the screenshot - no hallucination
 * @param base64Image - Base64 encoded image data
 * @returns Promise<AIAnalysisResult> - Extracted examples with confidence score
 */
export const analyzeScreenshot = async (base64Image: string): Promise<AIAnalysisResult> => {
  const startTime = Date.now()
  
  try {
    // For now, we'll use a mock implementation
    // TODO: Integrate with actual AI vision service (OpenAI, Google Vision, etc.)
    const mockExamples = await mockAIAnalysis(base64Image)
    
    const processingTime = Date.now() - startTime
    
    return {
      examples: mockExamples,
      confidence: 0.85, // Mock confidence score
      processingTime
    }
  } catch (error) {
    console.error('Error analyzing screenshot:', error)
    throw new Error('Failed to analyze screenshot. Please try again.')
  }
}

/**
 * Mock AI analysis for development/testing
 * In production, this would be replaced with actual AI vision API calls
 * 
 * NOTE: This mock simulates what would be extracted from an actual Miro screenshot
 * In real implementation, this would analyze the actual image content
 */
const mockAIAnalysis = async (_base64Image: string): Promise<ExtractedExample[]> => {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  // Mock data simulating what would be extracted from a real Miro screenshot
  // This represents actual post-it notes or table rows visible in the image
  return [
    {
      actor: "New User",
      goal: "Sign up for the service",
      entry_point: "Landing page",
      actions: "Click sign up button, fill registration form, verify email address",
      error: "Email verification link expired",
      outcome: "Successfully created account and logged in"
    },
    {
      actor: "New User", // Same actor as above
      goal: "Sign up for the service", // Same goal
      entry_point: "Landing page", // Same entry point
      actions: "Click sign up button, fill registration form, verify email address", // Same actions
      error: "Email already exists", // Different error - this should be allowed
      outcome: "Successfully created account and logged in" // Same outcome
    },
    {
      actor: "Returning User",
      goal: "Access their dashboard",
      entry_point: "Login page",
      actions: "Enter email and password, click login button",
      error: "Forgot password, need to reset",
      outcome: "Reset password and accessed dashboard"
    },
    {
      actor: "Premium User",
      goal: "Upgrade their subscription",
      entry_point: "Account settings",
      actions: "Navigate to billing, select plan, enter payment info",
      error: "Payment method declined",
      outcome: "Updated payment method and upgraded successfully"
    }
  ]
}

/**
 * Real AI implementation using OpenAI Vision API
 * Uncomment and configure when ready to use
 */
/*
export const analyzeScreenshotWithOpenAI = async (base64Image: string): Promise<AIAnalysisResult> => {
  const startTime = Date.now()
  
  try {
    const response = await fetch('/api/ai/analyze-screenshot', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: base64Image,
        prompt: `Analyze this Miro board screenshot containing post-it notes with user journey examples. 
        
        IMPORTANT: Only extract data that is actually visible in the screenshot. Do not create or hallucinate examples that are not present in the image.
        
        Look for post-it notes or table rows that contain user journey examples. Each example should be listed in a row, following the same column order as the example table:
        - Actor: Who is performing the action (look for user roles closely associated with the 'Actor' field, default to user roles previously created)
        - Goal: What they want to achieve  
        - Entry Point: How they start
        - Actions: Steps they take
        - Error: Problems they encounter
        - Outcome: Final result
        
        Extraction guidelines:
        - Read the actual text from each post-it note or table row in the screenshot
        - Do not invent or create examples that are not visible in the image
        - Examples might have the same fields as other examples, with only one field difference. Please allow this.
        - Only examples with all fields identical should be rejected as duplicates.
        - Focus on user roles that are closely associated with the Actor field.
        - If you cannot clearly read text in the image, do not include that example
        
        Return structured JSON data only for examples that are clearly visible and readable in the screenshot.`
      })
    })

    if (!response.ok) {
      throw new Error('AI analysis failed')
    }

    const result = await response.json()
    const processingTime = Date.now() - startTime

    return {
      examples: result.examples,
      confidence: result.confidence,
      processingTime
    }
  } catch (error) {
    console.error('OpenAI analysis error:', error)
    throw error
  }
}
*/

/**
 * Real AI implementation using Google Vision API
 * Uncomment and configure when ready to use
 */
/*
export const analyzeScreenshotWithGoogleVision = async (base64Image: string): Promise<AIAnalysisResult> => {
  const startTime = Date.now()
  
  try {
    const response = await fetch('/api/ai/google-vision', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: base64Image
      })
    })

    if (!response.ok) {
      throw new Error('Google Vision analysis failed')
    }

    const result = await response.json()
    const processingTime = Date.now() - startTime

    return {
      examples: result.examples,
      confidence: result.confidence,
      processingTime
    }
  } catch (error) {
    console.error('Google Vision analysis error:', error)
    throw error
  }
}
*/

/**
 * Validates extracted examples to ensure they have required fields and removes exact duplicates
 */
export const validateExtractedExamples = (examples: ExtractedExample[]): { valid: ExtractedExample[], invalid: ExtractedExample[] } => {
  const valid: ExtractedExample[] = []
  const invalid: ExtractedExample[] = []
  const seenExamples = new Set<string>()

  examples.forEach(example => {
    const hasRequiredFields = example.actor && example.goal && example.entry_point && 
                             example.actions && example.error && example.outcome
    
    if (!hasRequiredFields) {
      invalid.push(example)
      return
    }

    // Create a unique key for exact duplicate detection
    const exampleKey = `${example.actor}|${example.goal}|${example.entry_point}|${example.actions}|${example.error}|${example.outcome}`
    
    if (seenExamples.has(exampleKey)) {
      // This is an exact duplicate, mark as invalid
      invalid.push(example)
    } else {
      // This is a new example (even if similar to others)
      seenExamples.add(exampleKey)
      valid.push(example)
    }
  })

  return { valid, invalid }
}

/**
 * Enhances extracted examples with additional processing
 */
export const enhanceExtractedExamples = (examples: ExtractedExample[]): ExtractedExample[] => {
  return examples.map(example => ({
    ...example,
    // Clean up text formatting
    actor: example.actor.trim(),
    goal: example.goal.trim(),
    entry_point: example.entry_point.trim(),
    actions: example.actions.trim(),
    error: example.error.trim(),
    outcome: example.outcome.trim(),
  }))
}

/**
 * Converts a phone call transcript to a user journey JSON using OpenAI
 * @param transcript - The raw transcript text
 * @param customPrompt - The prompt to use (should be generated with user roles)
 * @param userRoleNames - Optional array of user role names to include in error messages
 * @returns Promise with the user journey JSON
 */
export const convertTranscriptToJourney = async (
  transcript: string,
  customPrompt: string,
  _userRoleNames?: string[],
  onProgress?: (message: string) => void
): Promise<any> => {
  try {
    console.log('Converting transcript with AI (background processing)...')
    
    // Get current user
    if (!supabase) {
      throw new Error('Database not configured')
    }
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('User not authenticated')
    }

    // Trigger background function (fire and forget - Netlify returns 202 immediately)
    onProgress?.('Starting AI processing...')

    const triggerUrl = '/.netlify/functions/transcript-to-journey-background'
    const importStartedAt = Date.now()

    // #region agent log
    fetch('http://127.0.0.1:7625/ingest/1098fe65-bd20-429c-885f-7ead38295b08',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'353e91'},body:JSON.stringify({sessionId:'353e91',runId:'pre-fix',hypothesisId:'H1',location:'aiService.ts:trigger-start',message:'Transcript import trigger starting',data:{host:typeof window!=='undefined'?window.location.host:'unknown',pathname:typeof window!=='undefined'?window.location.pathname:'unknown',triggerUrl,userId:user.id,transcriptLength:transcript.length},timestamp:Date.now()})}).catch(()=>{});
    // #endregion

    let triggerStatus: number | null = null
    let triggerOk = false
    let triggerContentType = ''
    let triggerBodyPreview = ''
    let triggerJobId: string | null = null
    let triggerFetchError: string | null = null

    try {
      const triggerResponse = await fetch(triggerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript,
          prompt: customPrompt,
          userId: user.id
        }),
      })
      triggerStatus = triggerResponse.status
      triggerOk = triggerResponse.ok
      triggerContentType = triggerResponse.headers.get('content-type') || ''
      const triggerText = await triggerResponse.text()
      triggerBodyPreview = triggerText.slice(0, 120)
      try {
        const parsed = JSON.parse(triggerText)
        triggerJobId = parsed?.jobId ?? null
      } catch {
        // non-JSON response (e.g. SPA HTML fallback)
      }
    } catch (err) {
      triggerFetchError = err instanceof Error ? err.message : 'Unknown fetch error'
      console.error('Failed to trigger background function:', err)
    }

    // #region agent log
    fetch('http://127.0.0.1:7625/ingest/1098fe65-bd20-429c-885f-7ead38295b08',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'353e91'},body:JSON.stringify({sessionId:'353e91',runId:'pre-fix',hypothesisId:'H1,H2',location:'aiService.ts:trigger-result',message:'Transcript import trigger response',data:{triggerStatus,triggerOk,triggerContentType,triggerBodyPreview,triggerJobId,triggerFetchError},timestamp:Date.now()})}).catch(()=>{});
    // #endregion

    // Poll database directly for job completion
    const startTime = Date.now()
    const maxWaitTime = 15 * 60 * 1000 // 15 minutes
    const pollInterval = 5000 // 5 seconds
    
    // Wait a moment for job to be created
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    while (true) {
      const elapsed = Date.now() - startTime
      
      if (elapsed > maxWaitTime) {
        // #region agent log
        fetch('http://127.0.0.1:7625/ingest/1098fe65-bd20-429c-885f-7ead38295b08',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'353e91'},body:JSON.stringify({sessionId:'353e91',runId:'pre-fix',hypothesisId:'H1,H2,H3,H4,H5',location:'aiService.ts:timeout',message:'Transcript import timed out',data:{elapsedSeconds:Math.floor(elapsed/1000),triggerStatus,triggerOk,triggerContentType,triggerJobId,triggerFetchError},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
        throw new Error('Processing timeout after 15 minutes')
      }

      const elapsedSeconds = Math.floor(elapsed / 1000)
      onProgress?.(`Processing... ${elapsedSeconds}s elapsed`)
      
      // Query latest job for this user of type 'transcript'
      const { data: jobs, error: queryError } = await supabase
        .from('ai_processing_jobs')
        .select('*')
        .eq('user_id', user.id)
        .eq('job_type', 'transcript')
        .order('created_at', { ascending: false })
        .limit(1)
      
      if (queryError) {
        console.error('Error querying job:', queryError)
        // #region agent log
        fetch('http://127.0.0.1:7625/ingest/1098fe65-bd20-429c-885f-7ead38295b08',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'353e91'},body:JSON.stringify({sessionId:'353e91',runId:'pre-fix',hypothesisId:'H3',location:'aiService.ts:poll-query-error',message:'Supabase poll query error',data:{elapsedSeconds,code:queryError.code,message:queryError.message,details:queryError.details},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
        await new Promise(resolve => setTimeout(resolve, pollInterval))
        continue
      }
      
      const job = jobs?.[0]
      if (!job) {
        // Job not created yet, keep waiting
        if (elapsedSeconds === 5 || elapsedSeconds === 15 || elapsedSeconds % 30 === 0) {
          // #region agent log
          fetch('http://127.0.0.1:7625/ingest/1098fe65-bd20-429c-885f-7ead38295b08',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'353e91'},body:JSON.stringify({sessionId:'353e91',runId:'pre-fix',hypothesisId:'H2,H3',location:'aiService.ts:poll-no-job',message:'No transcript job found yet',data:{elapsedSeconds,triggerStatus,triggerOk,triggerJobId,importStartedAt},timestamp:Date.now()})}).catch(()=>{});
          // #endregion
        }
        await new Promise(resolve => setTimeout(resolve, pollInterval))
        continue
      }

      if (elapsedSeconds === 5 || elapsedSeconds === 15 || elapsedSeconds % 30 === 0 || job.status === 'completed' || job.status === 'failed') {
        const jobCreatedAt = job.created_at ? new Date(job.created_at).getTime() : null
        // #region agent log
        fetch('http://127.0.0.1:7625/ingest/1098fe65-bd20-429c-885f-7ead38295b08',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'353e91'},body:JSON.stringify({sessionId:'353e91',runId:'pre-fix',hypothesisId:'H4,H5',location:'aiService.ts:poll-job-state',message:'Transcript job poll state',data:{elapsedSeconds,jobId:job.id,jobStatus:job.status,jobCreatedAt,importStartedAt,isStaleJob:jobCreatedAt?jobCreatedAt<importStartedAt-5000:null,errorMessage:job.error_message??null,hasResultData:!!job.result_data},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
      }
      
      if (job.status === 'completed') {
        console.log('✓ Transcript conversion successful!')
        console.log('Nodes extracted:', job.result_data?.nodes?.length || 0)
        return job.result_data
      }
      
      if (job.status === 'failed') {
        throw new Error(job.error_message || 'Processing failed')
      }
      
      // Still processing, wait and poll again
      await new Promise(resolve => setTimeout(resolve, pollInterval))
    }
    
  } catch (error) {
    console.error('Error converting transcript to journey:', error)
    throw error
  }
}

/**
 * Edits an existing user journey using natural language instructions via OpenAI
 * @param currentJourney - The current journey JSON (with nodes and edges)
 * @param instruction - Natural language instruction (e.g., "Replace Amicus with ThirdFort")
 * @param onProgress - Optional callback for progress updates
 * @returns Promise with the updated journey JSON
 */
export const editJourneyWithAI = async (
  currentJourney: any,
  instruction: string,
  onProgress?: (message: string) => void
): Promise<any> => {
  try {
    console.log('Editing journey with AI (background processing)...')
    console.log('Instruction:', instruction)
    console.log('Current nodes:', currentJourney.nodes?.length || 0)
    
    // Get current user
    if (!supabase) {
      throw new Error('Database not configured')
    }
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('User not authenticated')
    }

    // Trigger background function (fire and forget - Netlify returns 202 immediately)
    onProgress?.('Starting AI processing...')
    
    console.log('Triggering edit-journey-background function...')
    
    // Don't wait for this to complete - it will run in background for up to 15 minutes
    fetch('/.netlify/functions/edit-journey-background', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentJourney,
        instruction,
        userId: user.id
      }),
    }).then(res => {
      console.log('Background function trigger response:', res.status, res.statusText)
    }).catch(err => {
      console.error('Failed to trigger background function:', err)
    })

    // Poll database directly for job completion
    const startTime = Date.now()
    const maxWaitTime = 15 * 60 * 1000 // 15 minutes
    const pollInterval = 5000 // 5 seconds
    const jobCreationTimeout = 30000 // 30 seconds to wait for job creation
    
    // Wait a moment for job to be created
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    while (true) {
      const elapsed = Date.now() - startTime
      
      if (elapsed > maxWaitTime) {
        throw new Error('Processing timeout after 15 minutes')
      }

      const elapsedSeconds = Math.floor(elapsed / 1000)
      onProgress?.(`Processing... ${elapsedSeconds}s elapsed`)
      
      // Query latest job for this user of type 'edit-journey'
      const { data: jobs, error: queryError } = await supabase
        .from('ai_processing_jobs')
        .select('*')
        .eq('user_id', user.id)
        .eq('job_type', 'edit-journey')
        .order('created_at', { ascending: false })
        .limit(1)
      
      if (queryError) {
        console.error('Error querying job:', queryError)
        await new Promise(resolve => setTimeout(resolve, pollInterval))
        continue
      }
      
      const job = jobs?.[0]
      if (!job) {
        // Job not created yet, keep waiting
        if (elapsed > jobCreationTimeout) {
          throw new Error(
            'Background job was not created within 30 seconds. ' +
            'This might indicate the background function failed to start. ' +
            'Please check that edit-journey-background function is deployed.'
          )
        }
        console.log('No job found yet, waiting...')
        await new Promise(resolve => setTimeout(resolve, pollInterval))
        continue
      }
      
      console.log(`Job status: ${job.status}, created: ${job.created_at}`)
      
      if (job.status === 'completed') {
        console.log('✓ Journey editing successful!')
        console.log('Nodes in result:', job.result_data?.nodes?.length || 0)
        
        if (!job.result_data) {
          throw new Error('Job completed but no result data returned')
        }
        
        return job.result_data
      }
      
      if (job.status === 'failed') {
        console.error('Job failed:', job.error_message)
        throw new Error(job.error_message || 'Processing failed')
      }
      
      // Still processing, wait and poll again
      await new Promise(resolve => setTimeout(resolve, pollInterval))
    }
    
  } catch (error) {
    console.error('Error editing journey with AI:', error)
    throw error
  }
}
