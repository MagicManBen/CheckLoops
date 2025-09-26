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
    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    console.log('Auth header present:', !!authHeader)
    
    if (!authHeader) {
      return json({ success: false, error: 'Unauthorized - No auth header' }, 401)
    }

    // For local development, skip user verification if environment variables aren't available
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const secretKey = Deno.env.get('SECRET_KEY')
    
    console.log('Environment check - SUPABASE_URL:', !!supabaseUrl, 'SECRET_KEY:', !!secretKey)
    
    if (supabaseUrl && secretKey) {
      console.log('Using production authentication')
      // Production: Verify user token
      const supabaseClient = createClient(
        supabaseUrl,
        secretKey,
        { auth: { persistSession: false } }
      )

      const token = authHeader.replace('Bearer ', '')
      const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
      
      console.log('User verification result - user:', !!user, 'error:', !!userError)
      
      if (userError || !user) {
        return json({ success: false, error: `Unauthorized - ${userError?.message || 'No user'}` }, 401)
      }
    } else {
      console.log('Skipping user verification for local development')
    }

    // Get request body - support both { text } and { signedUrl }
    const { text, signedUrl } = await req.json()
    let contentText = (text ?? "").toString().trim()

    // If signedUrl provided, fetch bytes server-side for future PDF/DOCX/image processing
    if (!contentText && signedUrl) {
      try {
        const r = await fetch(signedUrl)
        if (!r.ok) throw new Error(`Fetch failed: ${r.status}`)
        const buf = new Uint8Array(await r.arrayBuffer())
        // TODO: Route to file processing API or quick OCR; for now return error if no text
        throw new Error("Signed URL ingestion added; text extraction not yet implemented on server.")
      } catch (fetchError) {
        return json({ success: false, error: `Failed to process file: ${fetchError.message}` }, 400)
      }
    }

    if (!contentText || contentText.length < 10) {
      return json({ success: false, error: "Empty or too-short input." }, 400)
    }

    // Get OpenAI API key from environment
    const openaiApiKey = Deno.env.get('CheckLoopsAI')
    if (!openaiApiKey) {
      return json({ success: false, error: 'CheckLoopsAI key not configured' }, 500)
    }

    console.log('🤖 Extracting certificate details from text length:', contentText.length)

    // Initialize OpenAI client
    const openai = new OpenAI({ apiKey: openaiApiKey })

    // Call OpenAI API with comprehensive extraction prompt
    const system = `You are a training certificate analysis expert. Extract all possible information from the certificate document and return STRICT JSON only.

REQUIRED JSON KEYS (all must be present):
- person_name: The name of the person who completed the training
- training_name: The name of the training/course that was completed
- completion_date: The date when the training was completed in YYYY-MM-DD format
- expiry_date: The date when the certification expires (if available) in YYYY-MM-DD format, null if not mentioned
- provider: The organization or institution that provided the training
- certificate_id: The ID or reference number of the certificate, null if not available
- additional_details: Any other relevant details about the training

Use the following process to analyze the certificate:
1. First look for an explicitly named "43630_Certificate_26Sep2025102910.pdf" format, which is the standard format.
2. If that format is not found, try to extract the information from any other format of certificate.
3. Always extract dates in YYYY-MM-DD format. Convert from other formats if needed.
4. If a date is clearly invalid (like a future completion date), use reasonable judgment to correct it.
5. Don't invent information - if a field can't be found, return null for that field.

Return only valid JSON with no explanations or additional text.`
    
    const resp = await openai.chat.completions.create({
      model: "gpt-5-nano",
      temperature: 0,
      messages: [
        { role: "system", content: system },
        { role: "user", content: [{ type: "text", text: contentText }] as any },
      ],
    })

    const raw = resp.choices?.[0]?.message?.content ?? "{}"
    const data = strictParse(raw)
    
    // Ensure date formats
    if (data?.completion_date && !data.completion_date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      data.completion_date = tryParseDateToISOString(data.completion_date)
    }
    
    if (data?.expiry_date && !data.expiry_date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      data.expiry_date = tryParseDateToISOString(data.expiry_date)
    }
    
    // If we got nothing useful, try the ChatGPT fallback
    if (!data?.person_name && !data?.training_name && !data?.completion_date) {
      console.log('Initial extraction failed, trying fallback prompt')
      
      const fallbackPrompt = `
Please analyze this training certificate text carefully and extract the following information:

1. Name of the person who completed the training
2. Name of the training/course
3. Completion date
4. Expiry date (if available)
5. Training provider/organization
6. Certificate ID or reference number

Format the output as a JSON object with these keys: person_name, training_name, completion_date (YYYY-MM-DD), 
expiry_date (YYYY-MM-DD or null), provider, certificate_id.

Here is the certificate text:
${contentText}
      `
      
      const fallbackResp = await openai.chat.completions.create({
        model: "gpt-4o",  // Use the more capable model for fallback
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          { role: "user", content: fallbackPrompt }
        ],
      })
      
      const fallbackRaw = fallbackResp.choices?.[0]?.message?.content ?? "{}"
      const fallbackData = strictParse(fallbackRaw)
      
      // Use fallback data if available
      if (fallbackData?.person_name || fallbackData?.training_name || fallbackData?.completion_date) {
        Object.assign(data, fallbackData)
        
        // Ensure date formats again
        if (data?.completion_date && !data.completion_date.match(/^\d{4}-\d{2}-\d{2}$/)) {
          data.completion_date = tryParseDateToISOString(data.completion_date)
        }
        
        if (data?.expiry_date && !data.expiry_date.match(/^\d{4}-\d{2}-\d{2}$/)) {
          data.expiry_date = tryParseDateToISOString(data.expiry_date)
        }
      }
    }

    console.log('✅ Certificate details extracted successfully')
    
    return json({ success: true, data })

  } catch (error) {
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