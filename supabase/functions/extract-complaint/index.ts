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
    if (!authHeader) {
      return json({ success: false, error: 'Unauthorized' }, 401)
    }

    // Initialize Supabase client with secret key for server-side operations
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SECRET_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    // Verify the user token
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    
    if (userError || !user) {
      return json({ success: false, error: 'Unauthorized' }, 401)
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
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      return json({ success: false, error: 'OpenAI API key not configured' }, 500)
    }

    console.log('🤖 Extracting complaint details from text length:', contentText.length)

    // Initialize OpenAI client
    const openai = new OpenAI({ apiKey: openaiApiKey })

    // Call OpenAI API with comprehensive extraction prompt
    const system = `You are a healthcare complaint analysis expert. Extract all possible information from the complaint document and return STRICT JSON only.

REQUIRED JSON KEYS (all must be present):
- complaint_date: Extract complaint date or use today's date format "YYYY-MM-DD"
- patient_initials: Extract 2-3 character initials (e.g. "J.B.")
- age: Extract age from text or calculate from DOB if mentioned, null if unknown
- complaint_summary: Brief 1-2 sentence summary of the complaint
- original_complaint: Full detailed complaint text (must be different from summary)
- response: Any response or resolution mentioned in the document
- lessons_learned: Extract lessons learned or improvement suggestions
- solution_given: Only if explicitly mentioned in document, null otherwise
- suggestions_prevent_reoccurrence: Suggestions to prevent similar complaints
- actions_to_be_taken: Required actions mentioned in document
- people_involved: Array of staff names explicitly mentioned by patient (e.g. ["Dr. Smith", "Nurse Jones"])
- avenue_used: How complaint was made - choose from: Phone, Email, Letter, In Person, Online Form, Social Media
- status: "closed" if response provided in document, otherwise "pending"
- priority: Always "low" or "medium" (never high unless life-threatening)
- response_sent: true if response is included in document, false otherwise

CATEGORY OPTIONS (choose best match):
- MEDICATION: Medicine errors, prescriptions, pharmacy issues
- COMMUNICATION: Poor communication, information not shared
- ADMIN: Booking, appointments, administration issues
- MEDICAL: Clinical care, diagnosis, treatment concerns
- APPT SYSTEM: Appointment scheduling, delays, cancellations
- OUTSIDE AGENCIES: Third party services, referrals
- GDPR: Data protection, privacy concerns

CATEGORY_TRENDS (choose best match):
- MEDICATION, COMMUNICATION, ADMIN, MEDICAL, APPT SYSTEM, OUTSIDE AGENCIES, GDPR

Extract dates in YYYY-MM-DD format. For people_involved, only include names explicitly mentioned by the patient in their complaint. Never guess or invent information not in the document.

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
    
    // Ensure required fields have proper formats
    if (data?.priority) {
      data.priority = String(data.priority).toLowerCase()
      if (!['low', 'medium'].includes(data.priority)) {
        data.priority = 'medium' // Default to medium if not low/medium
      }
    }
    
    // Ensure status is valid
    if (data?.status && !['pending', 'investigating', 'resolved', 'closed'].includes(data.status)) {
      data.status = 'pending'
    }
    
    // Ensure date format
    if (data?.complaint_date && !data.complaint_date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      data.complaint_date = new Date().toISOString().split('T')[0] // Today's date as fallback
    }
    
    // Ensure people_involved is an array
    if (data?.people_involved && !Array.isArray(data.people_involved)) {
      data.people_involved = []
    }

    console.log('✅ Complaint details extracted successfully')
    
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

function strictParse(s: string) {
  try {
    // Try to extract JSON from code blocks if present
    const match = s.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
    const body = match ? match[1] : s
    return JSON.parse(body)
  } catch {
    // Return comprehensive default structure if parsing fails
    return {
      complaint_date: new Date().toISOString().split('T')[0],
      patient_initials: null,
      age: null,
      complaint_summary: "",
      original_complaint: "",
      response: null,
      lessons_learned: null,
      category: "ADMIN",
      category_trends: "ADMIN", 
      solution_given: null,
      suggestions_prevent_reoccurrence: null,
      actions_to_be_taken: null,
      people_involved: [],
      avenue_used: "Email",
      status: "pending",
      priority: "medium",
      response_sent: false
    }
  }
}
