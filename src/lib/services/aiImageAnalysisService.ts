/**
 * AI Image Analysis Service
 * Analyzes user journey diagram images using OpenAI Vision API
 */

import { generateDiagramToJourneyPrompt } from '../prompts/diagram-to-journey-prompt-optimized'
import { calculateHorizontalJourneyLayout } from './horizontalJourneyLayoutCalculator'
import { calculateVerticalJourneyLayout } from './verticalJourneyLayoutCalculator'
import { supabase } from '../supabase'

export interface JourneyNotification {
  id: string
  type: 'pain-point' | 'warning' | 'info' | 'positive'
  message: string
}

export interface JourneyNode {
  id: string
  type: 'start' | 'process' | 'end'
  position: { x: number; y: number }
  data: {
    label: string
    type: 'start' | 'process' | 'end'
    userRole?: string
    variant?: 'CMS' | 'Legl' | 'End client' | 'Back end' | 'Third party' | ''
    thirdPartyName?: string
    bulletPoints?: string[]
    notifications?: JourneyNotification[]
    customProperties?: Record<string, any>
    journeyLayout?: 'vertical' | 'horizontal'
  }
}

export interface JourneyEdge {
  id: string
  source: string
  target: string
  type?: string
  label?: string
  data?: {
    label?: string
  }
}

export interface JourneyRegion {
  id: string
  type: 'highlightRegion'
  position: { x: number; y: number }
  style: {
    width: number
    height: number
    zIndex: number
  }
  data: {
    label: string
    backgroundColor: string
    borderColor: string
  }
  draggable?: boolean
  selectable?: boolean
}

export interface AnalyzedJourney {
  nodes: JourneyNode[]
  edges: JourneyEdge[]
  regions?: JourneyRegion[]
  name?: string
  description?: string
  layout?: 'vertical' | 'horizontal'
}

/**
 * Analyzes a user journey diagram image using AI via Netlify Background Function (15-min timeout)
 * Uses polling to check status until complete
 * @param imageFile - The image file to analyze
 * @param _apiKey - OpenAI API key (deprecated - kept for backwards compatibility, not used)
 * @param userRoleNames - Array of available user role names from the workspace
 * @param onProgress - Optional callback for progress updates
 */
export async function analyzeJourneyImageWithBackground(
  imageFile: File,
  _apiKey: string,
  userRoleNames: string[] = [],
  onProgress?: (message: string, elapsed: number) => void
): Promise<AnalyzedJourney> {
  try {
    // Check if Supabase is configured
    if (!supabase) {
      throw new Error('Database not configured')
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('User not authenticated')
    }

    console.log(`Original image size: ${(imageFile.size / 1024).toFixed(0)}KB`)
    
    // Compress image
    const compressedImage = await compressImage(imageFile)
    const base64Image = await fileToBase64(compressedImage)
    const prompt = generateDiagramToJourneyPrompt(userRoleNames)
    
    // Trigger background function and capture job ID
    onProgress?.('Starting AI processing...', 0)
    
    // Create a unique timestamp to track this specific upload
    const uploadTimestamp = Date.now()
    
    // Call background function and wait for job ID
    const response = await fetch('/.netlify/functions/diagram-to-journey-background', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        base64Image: `data:${compressedImage.type};base64,${base64Image}`,
        prompt: prompt,
        userId: user.id
      })
    })
    
    if (!response.ok) {
      throw new Error(`Failed to start background processing: ${response.status}`)
    }
    
    const responseData = await response.json()
    const jobId = responseData.jobId
    
    if (!jobId) {
      throw new Error('No job ID returned from background function')
    }
    
    console.log(`Tracking job ID: ${jobId} for upload at ${uploadTimestamp}`)
    
    // Poll database directly for this specific job completion
    const result = await pollDatabaseForJobCompletion(user.id, 'diagram', jobId, uploadTimestamp, onProgress)
    
    return processJourneyData(result)
    
  } catch (error) {
    console.error('Error analyzing journey image:', error)
    throw error
  }
}

/**
 * Poll database directly for job completion
 */
export async function pollDatabaseForJobCompletion(
  userId: string,
  jobType: 'diagram' | 'transcript',
  jobId: string,
  uploadTimestamp: number,
  onProgress?: (message: string, elapsed: number) => void
): Promise<any> {
  if (!supabase) {
    throw new Error('Database not configured')
  }

  const startTime = Date.now()
  const maxWaitTime = 15 * 60 * 1000 // 15 minutes
  const pollInterval = 2000 // 2 seconds

  // Wait a moment for job to be created
  await new Promise(resolve => setTimeout(resolve, 2000))

  while (true) {
    const elapsed = Date.now() - startTime
    
    if (elapsed > maxWaitTime) {
      throw new Error('Processing timeout (15 minutes)')
    }

    const elapsedSeconds = Math.floor(elapsed / 1000)
    
    // Query the specific job by ID to ensure we're tracking the right one
    const { data: job, error } = await supabase
      .from('ai_processing_jobs')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', userId)
      .eq('job_type', jobType)
      .single()

    if (error) {
      // If job not found, it might not be created yet - keep waiting
      if (error.code === 'PGRST116') {
        if (onProgress) {
          onProgress(`Initializing... (${elapsedSeconds}s)`, elapsedSeconds)
        }
        await new Promise(resolve => setTimeout(resolve, pollInterval))
        continue
      }
      console.error('Error querying job:', error)
      await new Promise(resolve => setTimeout(resolve, pollInterval))
      continue
    }

    if (!job) {
      // Job not found yet, keep waiting
      if (onProgress) {
        onProgress(`Initializing... (${elapsedSeconds}s)`, elapsedSeconds)
      }
      await new Promise(resolve => setTimeout(resolve, pollInterval))
      continue
    }
    
    // Verify this job was created after our upload timestamp (safety check)
    const jobCreatedAt = new Date(job.created_at).getTime()
    if (jobCreatedAt < uploadTimestamp - 5000) { // Allow 5 second buffer
      throw new Error('Job timestamp mismatch - this appears to be a different upload')
    }
    
    if (job.status === 'completed') {
      console.log(`Job ${jobId} completed in ${elapsedSeconds}s`)
      return job.result_data
    }
    
    if (job.status === 'failed') {
      throw new Error(job.error_message || 'Processing failed')
    }
    
    // Still processing
    if (onProgress) {
      const label = jobType === 'transcript' ? 'transcript' : 'diagram'
      onProgress(`Processing ${label}... (${elapsedSeconds}s)`, elapsedSeconds)
    }
    
    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, pollInterval))
  }
}

/**
 * Analyzes a user journey diagram image using AI via Netlify Function
 * Uses optimized prompt for faster processing (typically 10-20 seconds)
 * @param imageFile - The image file to analyze
 * @param _apiKey - OpenAI API key (deprecated - handled server-side)
 * @param userRoleNames - Array of available user role names from the workspace
 */
export async function analyzeJourneyImage(
  imageFile: File,
  _apiKey: string,
  userRoleNames: string[] = []
): Promise<AnalyzedJourney> {
  try {
    console.log(`Original image size: ${(imageFile.size / 1024).toFixed(0)}KB`)
    
    // Compress image to reduce processing time and payload size
    const compressedImage = await compressImage(imageFile)
    
    // Convert image to base64
    const base64Image = await fileToBase64(compressedImage)
    
    // Generate prompt with user roles
    const prompt = generateDiagramToJourneyPrompt(userRoleNames)
    
    // Call regular function with optimized prompt
    const response = await fetch('/.netlify/functions/diagram-to-journey', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        base64Image: `data:${compressedImage.type};base64,${base64Image}`,
        prompt: prompt
      })
    })

    if (!response.ok) {
      let errorMessage = `Server error: ${response.status} ${response.statusText}`
      try {
        // Read as text first (you can only read the body once)
        const text = await response.text()
        if (text) {
          // Try to parse as JSON
          try {
            const errorData = JSON.parse(text)
            errorMessage = errorData.error || errorData.message || text
          } catch {
            // If not JSON, use the text directly
            errorMessage = text
          }
        }
      } catch (e) {
        // If we can't read the response at all, use the status text
        console.error('Error reading response:', e)
      }
      throw new Error(errorMessage)
    }

    const result = await response.json()
    
    if (!result.success || !result.journey) {
      throw new Error('Invalid response from AI service')
    }

    const journeyData = result.journey
    
    if (!journeyData) {
      throw new Error('No journey data received from AI')
    }

    console.log('✓ Image analysis completed successfully')

    // Validate and process the response (data is already parsed JSON object)
    return processJourneyData(journeyData)
  } catch (error) {
    console.error('Error analyzing journey image:', error)
    throw error
  }
}

/**
 * Convert file to base64 string
 */
/**
 * Compress and resize image to reduce processing time and payload size
 */
async function compressImage(file: File, maxWidth = 1600, maxHeight = 1600, quality = 0.7): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    
    img.onload = () => {
      URL.revokeObjectURL(url)
      
      // Calculate new dimensions
      let width = img.width
      let height = img.height
      
      // Only compress if image is large
      const needsResize = width > maxWidth || height > maxHeight
      
      if (!needsResize && file.size < 500 * 1024) {
        // Image is small enough and dimensions are good - skip compression
        console.log(`Image already optimized: ${(file.size / 1024).toFixed(0)}KB (${width}x${height}px)`)
        resolve(file)
        return
      }
      
      if (needsResize) {
        const ratio = Math.min(maxWidth / width, maxHeight / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }
      
      // Create canvas and draw resized image
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        reject(new Error('Failed to get canvas context'))
        return
      }
      
      ctx.drawImage(img, 0, 0, width, height)
      
      // Convert to blob - always use JPEG for better compression
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to compress image'))
            return
          }
          
          // Only use compressed version if it's actually smaller
          if (blob.size < file.size) {
            const compressedFile = new File([blob], file.name.replace(/\.\w+$/, '.jpg'), {
              type: 'image/jpeg',
              lastModified: Date.now(),
            })
            console.log(`Image compressed: ${(file.size / 1024).toFixed(0)}KB → ${(compressedFile.size / 1024).toFixed(0)}KB (${width}x${height}px)`)
            resolve(compressedFile)
          } else {
            console.log(`Image already optimized: ${(file.size / 1024).toFixed(0)}KB (${width}x${height}px)`)
            resolve(file)
          }
        },
        'image/jpeg',
        quality
      )
    }
    
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }
    
    img.src = url
  })
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result as string
      // Remove data URL prefix
      const base64Data = base64.split(',')[1]
      resolve(base64Data)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}


/**
 * Process and validate the journey data
 * 
 * SEPARATION OF CONCERNS:
 * - AI Prompt: Extracts CONTENT (labels, types, roles, platforms, lanes, edges, notifications) + LAYOUT TYPE
 * - Layout Calculator: Computes POSITIONS (x, y coordinates based on edges and detected layout)
 * - This Function: Combines both to create the final journey structure
 */
function processJourneyData(data: any): AnalyzedJourney {
  const detectedLayout = data.layout || 'horizontal'
  
  console.log('Detected layout from AI:', detectedLayout)
  
  // --- Step 1: Extract content from AI (NO POSITIONS) ---
  // Only extract swim lane data for horizontal layouts
  const rawNodes = (data.nodes || []).map((node: any) => {
    const baseNode: any = {
      id: node.id,
      label: node.label,
      type: node.type,
      userRole: node.userRole,
      platform: node.platform,
      thirdPartyName: node.thirdPartyName,
      bulletPoints: node.bulletPoints || [],
      notifications: node.notifications || []
    }
    
    // Only include swim lane properties for horizontal layouts
    if (detectedLayout === 'horizontal') {
      baseNode.swimLane = node.laneName // Use laneName from AI as swimLane identifier
      baseNode.laneIndex = node.laneIndex
      baseNode.laneName = node.laneName
    }
    
    return baseNode
  })

  // --- Step 2: Calculate positions using the appropriate layout calculator ---
  // The AI detects layout type, and we use the corresponding calculator
  const layoutResult = detectedLayout === 'horizontal'
    ? calculateHorizontalJourneyLayout(rawNodes, data.edges || [])
    : calculateVerticalJourneyLayout(rawNodes, data.edges || [])

  // --- Step 3: Process lanes into regions (only for horizontal layouts) ---
  let regions: JourneyRegion[] = []
  
  if (detectedLayout === 'horizontal' && (data.lanes || []).length > 0) {
    // Constants must match horizontalJourneyLayoutCalculator.ts
    const VERTICAL_GAP_BETWEEN_LANES = 24
    const START_Y = 40
    // Horizontal layout result includes swim lane dimensions
    const calculatedSwimLaneHeight = ('swimLaneHeight' in layoutResult && layoutResult.swimLaneHeight) ? layoutResult.swimLaneHeight : 300
    const calculatedSwimLaneWidth = ('swimLaneWidth' in layoutResult && layoutResult.swimLaneWidth) ? layoutResult.swimLaneWidth : 2000
    
    regions = (data.lanes || []).map((lane: any) => {
      // Calculate region Y position with gaps (matching layout calculator logic)
      const regionY = START_Y + (lane.index * (calculatedSwimLaneHeight + VERTICAL_GAP_BETWEEN_LANES))
      
      return {
        id: `region-${lane.index}`,
        type: 'highlightRegion' as const,
        position: {
          x: 0,
          y: regionY
        },
        style: {
          width: calculatedSwimLaneWidth,
          height: calculatedSwimLaneHeight,
          zIndex: -1
        },
        data: {
          label: lane.label || `Lane ${lane.index + 1}`,
          backgroundColor: getLaneColor(lane.index).bg,
          borderColor: getLaneColor(lane.index).border
        },
        draggable: true,
        selectable: true
      }
    })
  }

  // --- Step 4: Process nodes with positions from layout calculator ---
  const nodes: JourneyNode[] = layoutResult.nodes.map((node: any) => {
    // Process notifications
    const notifications: JourneyNotification[] = (node.data?.notifications || node.notifications || [])
      .map((notif: any) => ({
        id: notif.id || `notif-${Date.now()}-${Math.random()}`,
        type: normalizeNotificationType(notif.type),
        message: notif.message || ''
      }))
      .filter((notif: JourneyNotification) => notif.message)

    const nodeData: any = {
      label: node.data?.label || node.label || node.id,
      type: normalizeNodeType(node.type || node.data?.type),
      userRole: node.data?.userRole || node.userRole || undefined,
      variant: normalizeVariant(node.data?.variant || node.platform),
      thirdPartyName: node.data?.thirdPartyName || node.thirdPartyName || '',
      bulletPoints: Array.isArray(node.data?.bulletPoints || node.bulletPoints) 
        ? (node.data?.bulletPoints || node.bulletPoints).filter((bp: any) => bp) 
        : [],
      notifications: notifications.length > 0 ? notifications : [],
      customProperties: node.data?.customProperties || {},
      journeyLayout: detectedLayout
    }
    
    // Only include laneName for horizontal layouts
    if (detectedLayout === 'horizontal' && node.laneName) {
      nodeData.laneName = node.laneName
    }

    return {
      id: node.id,
      type: normalizeNodeType(node.type || node.data?.type),
      position: node.position, // Use calculated position from layout calculator
      data: nodeData
    }
  })

  // --- Step 5: Process edges (from AI data, not layout calculator) ---
  const edges: JourneyEdge[] = (data.edges || []).map((edge: any, index: number) => ({
    id: edge.id || `edge-${index + 1}`,
    source: edge.source,
    target: edge.target,
    type: edge.type || 'custom',
    label: edge.label || '',
    data: {
      label: edge.data?.label || edge.label || ''
    }
  }))

  return {
    nodes,
    edges,
    regions: regions.length > 0 ? regions : undefined,
    name: data.name || 'Imported Journey',
    description: data.description || '',
    layout: detectedLayout
  }
}

/**
 * Get lane color based on index (cycle through colors)
 */
function getLaneColor(index: number): { bg: string; border: string } {
  const colors = [
    { bg: '#fef3c7', border: '#f59e0b' }, // Yellow/Amber
    { bg: '#dbeafe', border: '#3b82f6' }, // Blue
    { bg: '#e9d5ff', border: '#a855f7' }, // Purple
    { bg: '#d1fae5', border: '#10b981' }, // Green
    { bg: '#fce7f3', border: '#ec4899' }, // Pink
    { bg: '#e0e7ff', border: '#6366f1' }, // Indigo
  ]
  return colors[index % colors.length]
}

/**
 * Normalize node type to valid values
 */
function normalizeNodeType(type: any): 'start' | 'process' | 'end' {
  const typeStr = String(type || '').toLowerCase()
  if (typeStr.includes('start') || typeStr.includes('begin')) return 'start'
  if (typeStr.includes('end') || typeStr.includes('finish')) return 'end'
  return 'process'
}

/**
 * Normalize variant to valid values
 */
function normalizeVariant(variant: any): 'CMS' | 'Legl' | 'End client' | 'Back end' | 'Third party' | '' {
  const variantStr = String(variant || '').toLowerCase()
  if (variantStr.includes('cms')) return 'CMS'
  if (variantStr.includes('legl')) return 'Legl'
  if (variantStr.includes('end client') || variantStr.includes('frontend') || variantStr.includes('client')) return 'End client'
  if (variantStr.includes('back end') || variantStr.includes('backend') || variantStr.includes('server')) return 'Back end'
  if (variantStr.includes('third party') || variantStr.includes('3rd party') || variantStr.includes('external')) return 'Third party'
  return ''
}

/**
 * Normalize notification type to valid values
 */
function normalizeNotificationType(type: any): 'pain-point' | 'warning' | 'info' | 'positive' {
  const typeStr = String(type || '').toLowerCase()
  if (typeStr.includes('pain') || typeStr.includes('problem') || typeStr.includes('issue')) return 'pain-point'
  if (typeStr.includes('warn')) return 'warning'
  if (typeStr.includes('positive') || typeStr.includes('success') || typeStr.includes('good')) return 'positive'
  return 'info'
}

