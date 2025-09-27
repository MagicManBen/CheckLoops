import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import OpenAI from "npm:openai@^4.57.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get signed URL from the request body (we use this different approach for v2)
    const { signedUrl, filename } = await req.json()
    console.log('Processing image file:', filename)

    if (!signedUrl) {
      throw new Error('No signed URL provided')
    }

    // Initialize Supabase client to fetch training types
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials missing')
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Fetch available training types
    const { data: trainingTypes, error: trainingError } = await supabase
      .from('training_types')
      .select('name')
      .eq('active', true)
      .order('name')

    if (trainingError) {
      console.error('Training types fetch error:', trainingError)
      throw new Error('Failed to fetch training types')
    }

    const availableTypes = trainingTypes?.map(t => t.name) || []
    console.log('Available training types:', availableTypes)

    // Download the image file to validate it's an image
    const fileResponse = await fetch(signedUrl)
    if (!fileResponse.ok) {
      throw new Error(`Download failed: ${fileResponse.status}`)
    }

    const arrayBuffer = await fileResponse.arrayBuffer()
    const contentType = fileResponse.headers.get('content-type') || ''
    
    // Ensure it's an image
    const isImage = contentType.includes('image') || filename?.toLowerCase().match(/\.(png|jpg|jpeg|gif|webp)$/i)
    if (!isImage) {
      throw new Error('Only image files supported')
    }

    // Get OpenAI API key from environment
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY') || Deno.env.get('CheckLoopsAI')
    if (!openaiApiKey) {
      return json({ success: false, error: 'OpenAI API key not configured' }, 500)
    }

    console.log('🤖 Extracting certificate details from image using OpenAI Vision')
    console.log('URL preview:', signedUrl.substring(0, 100))

    // Initialize OpenAI client
    const openai = new OpenAI({ apiKey: openaiApiKey })

    // STEP 1: Extract raw certificate data without restrictions
    const extractionPrompt = `Extract ALL information from this training certificate:
PERSON_NAME: [name of certificate holder]
RAW_TRAINING_NAME: [exact course/training name as written on certificate]
COMPLETION_DATE: [YYYY-MM-DD format]
EXPIRY_DATE: [YYYY-MM-DD format or N/A]
TRAINING_PROVIDER: [organization name]
CERTIFICATE_NUMBER: [number/ID or N/A]

Extract exactly what you see - don't try to match to any specific format.`
    
    const extractionResp = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: extractionPrompt
            },
            {
              type: "image_url",
              image_url: { url: signedUrl }
            }
          ]
        }
      ],
      max_tokens: 400
    })

    const extractionText = extractionResp.choices?.[0]?.message?.content ?? ""
    console.log('STEP 1 - Raw extraction:', extractionText)

    // Parse the raw extraction
    const parseField = (text: string, field: string) => {
      const regex = new RegExp(`${field}:\\s*(.+)`, 'i')
      const match = text.match(regex)
      const value = match ? match[1].trim() : 'PARSE_FAILED'
      console.log(`${field}: "${value}"`)
      return value
    }

    const rawTrainingName = parseField(extractionText, 'RAW_TRAINING_NAME')
    console.log('Raw training name extracted:', rawTrainingName)

    // STEP 2: Intelligent fuzzy matching using AI
    let matchedTrainingName = 'NO_MATCH_FOUND'
    let matchConfidence = 0
    let matchReasoning = 'No matching attempted'

    if (rawTrainingName && rawTrainingName !== 'PARSE_FAILED' && availableTypes.length > 0) {
      console.log('STEP 2 - Starting intelligent fuzzy matching...')
      
      const matchingPrompt = `You are an expert at matching training course names. 

EXTRACTED COURSE NAME: "${rawTrainingName}"

AVAILABLE OPTIONS:
${availableTypes.map((type, index) => `${index + 1}. ${type}`).join('\n')}

Analyze the extracted course name and find the BEST MATCH from the available options. Consider:
- Synonyms (e.g., "Data Protection" = "Information Governance")
- Abbreviations (e.g., "IG" = "Information Governance") 
- Alternative phrasings (e.g., "Learning Disability Awareness" = "Oliver McGowan Learning Disability Awareness")
- Common training variations

Respond in this EXACT format:
BEST_MATCH: [exact option name from list, or NONE if no reasonable match]
CONFIDENCE: [0-100 percentage]
REASONING: [why this match makes sense]

Only return NONE if there's truly no reasonable semantic connection.`

      const matchingResp = await openai.chat.completions.create({
        model: "gpt-4o-mini", 
        temperature: 0.1, // Slight creativity for matching
        messages: [
          { role: "user", content: matchingPrompt }
        ],
        max_tokens: 300
      })

      const matchingText = matchingResp.choices?.[0]?.message?.content ?? ""
      console.log('STEP 2 - Matching response:', matchingText)

      // Parse matching results
      const bestMatch = parseField(matchingText, 'BEST_MATCH')
      const confidenceStr = parseField(matchingText, 'CONFIDENCE')
      matchReasoning = parseField(matchingText, 'REASONING')

      // Validate the match
      if (bestMatch && bestMatch !== 'PARSE_FAILED' && bestMatch !== 'NONE' && availableTypes.includes(bestMatch)) {
        matchedTrainingName = bestMatch
        matchConfidence = parseInt(confidenceStr) || 0
        console.log(`✅ MATCH FOUND: "${bestMatch}" (${matchConfidence}% confidence)`)
      } else {
        console.log('❌ No valid match found')
      }
    }

    const trainingName = matchedTrainingName
    const isValidTraining = matchedTrainingName !== 'NO_MATCH_FOUND'

    const data = {
      person_name: parseField(extractionText, 'PERSON_NAME'),
      training_name: trainingName,
      training_name_valid: isValidTraining,
      raw_training_name: rawTrainingName,
      completion_date: parseField(extractionText, 'COMPLETION_DATE'),
      expiry_date: parseField(extractionText, 'EXPIRY_DATE'),
      provider: parseField(extractionText, 'TRAINING_PROVIDER'),
      certificate_id: parseField(extractionText, 'CERTIFICATE_NUMBER')
    }

    console.log('✅ Certificate details extracted successfully')
    
    return json({
      success: true,
      raw_text: extractionText,
      data: data,
      available_training_types: availableTypes,
      training_match_status: {
        raw_extracted_name: rawTrainingName,
        matched_name: trainingName,
        is_valid: isValidTraining,
        confidence: matchConfidence,
        reasoning: matchReasoning,
        message: isValidTraining 
          ? `Training matched with ${matchConfidence}% confidence: ${matchReasoning}`
          : trainingName === 'NO_MATCH_FOUND'
            ? 'AI could not find a reasonable match to available options'
            : 'Training type does not match any available options'
      },
      debug: {
        model: 'gpt-4o-mini',
        approach: 'Two-Step AI: Raw Extraction + Intelligent Fuzzy Matching',
        fileSize: Math.round(arrayBuffer.byteLength / 1024) + ' KB',
        available_types_count: availableTypes.length,
        matching_attempted: rawTrainingName !== 'PARSE_FAILED'
      }
    })

  } catch (error: any) {
    console.error('Edge function error:', error)
    return json({ 
      success: false, 
      error: String(error?.message ?? error) 
    }, 400)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { 
    status, 
    headers: { 
      ...corsHeaders, 
      "Content-Type": "application/json" 
    }
  })
}

function tryParseDateToISOString(dateStr: string): string | null {
  if (!dateStr) return null
  
  try {
    // Try to parse various formats
    let date: Date | null = null
    
    // Check for formats like "26Sep2025"
    const formatMatch = dateStr.match(/(\d{1,2})([A-Za-z]{3})(\d{4})/i)
    if (formatMatch) {
      const day = formatMatch[1].padStart(2, '0')
      const month = formatMatch[2]
      const year = formatMatch[3]
      
      // Convert month abbreviation to number
      const months: {[key: string]: string} = {
        'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
        'may': '05', 'jun': '06', 'jul': '07', 'aug': '08',
        'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
      }
      
      const monthNum = months[month.toLowerCase()]
      if (monthNum) {
        return `${year}-${monthNum}-${day}`
      }
    }
    
    // Try standard Date parsing as fallback
    date = new Date(dateStr)
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0]
    }
    
    return null
  } catch {
    return null
  }
}

function strictParse(s: string) {
  try {
    // Try to extract JSON from code blocks if present
    const match = s.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
    const body = match ? match[1] : s
    return JSON.parse(body)
  } catch {
    // Return comprehensive default structure if parsing fails
    return {
      person_name: null,
      training_name: null,
      completion_date: null,
      expiry_date: null,
      provider: null,
      certificate_id: null,
      additional_details: null
    }
  }
}