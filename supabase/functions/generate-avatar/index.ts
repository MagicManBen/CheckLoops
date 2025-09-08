import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import OpenAI from "npm:openai@^4.57.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Log all incoming requests
  console.log('🚀 Generate Avatar Function Called')
  console.log('Method:', req.method)
  console.log('URL:', req.url)
  console.log('Headers:', Object.fromEntries(req.headers.entries()))

  if (req.method === 'OPTIONS') {
    console.log('✅ Responding to OPTIONS request')
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get Supabase environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables')
      return json({ error: 'Server configuration error' }, 500)
    }

    // Create Supabase client for auth verification
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get auth header
    const authHeader = req.headers.get('Authorization')
    console.log('Auth header received:', authHeader ? 'Bearer token present' : 'none')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No valid authorization header found')
      return json({ error: 'Unauthorized: No authorization header' }, 401)
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Verify JWT with Supabase
    console.log('Verifying JWT token with Supabase...')
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser(token)
      
      if (authError || !user) {
        console.log('JWT verification failed:', authError?.message || 'No user found')
        return json({ error: 'Unauthorized: Invalid or expired token' }, 401)
      }
      
      console.log('JWT verification successful for user:', user.email)
    } catch (authErr) {
      console.log('JWT verification exception:', authErr)
      return json({ error: 'Unauthorized: Token validation failed' }, 401)
    }

    // Read body
    console.log('📖 Reading request body...')
    let requestBody
    try {
      requestBody = await req.json()
      console.log('Request body received:', requestBody)
    } catch (bodyError) {
      console.error('❌ Failed to parse request body:', bodyError)
      return json({ error: 'Invalid JSON in request body' }, 400)
    }

    const { description, options, seedHint } = requestBody
    console.log('Extracted fields:', { description: description?.substring(0, 50), hasOptions: !!options, seedHint })
    
    if (!description || typeof description !== 'string') {
      console.error('❌ Missing or invalid description')
      return json({ error: 'Missing description' }, 400)
    }
    if (!options || typeof options !== 'object') {
      console.error('❌ Missing or invalid options')
      return json({ error: 'Missing options' }, 400)
    }

    const apiKey = Deno.env.get('OPENAI_API_KEY')
    if (!apiKey) return json({ error: 'OPENAI_API_KEY not configured' }, 500)

    const openai = new OpenAI({ apiKey })

    const system = 'You are a precise UI assistant that selects DiceBear Adventurer options strictly from provided dropdowns. When "man" or "male" is mentioned, try to use more masculine seeds and serious expressions. When "woman" or "female" is mentioned, use more varied expressions. Always include probability values: hairProbability should be 100 for visible hair, featuresProbability should be 100 for visible features. Respond with valid JSON only.'
    const userMsg = JSON.stringify({
      task: 'Map description to options',
      style: 'adventurer',
      seedHint, description,
      allowedOptions: options,
      expectedKeys: ['seed','backgroundType','backgroundColor','backgroundRotation','radius','rotate','scale','flip','clip','translateX','translateY','eyes','mouth','eyebrows','glasses','glassesProbability','earrings','earringsProbability','features','featuresProbability','hair','hairColor','hairProbability','skinColor']
    })

    const resp = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      response_format: { type: 'json_object' } as any,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userMsg }
      ]
    })

    const raw = resp.choices?.[0]?.message?.content || '{}'
    console.log('OpenAI raw response:', raw)
    
    const parsed = safeParseJson(raw)
    console.log('Parsed response:', parsed)
    
    const allowed = new Set(['seed','backgroundType','backgroundColor','backgroundRotation','radius','rotate','scale','flip','clip','translateX','translateY','eyes','mouth','eyebrows','glasses','glassesProbability','earrings','earringsProbability','features','featuresProbability','hair','hairColor','hairProbability','skinColor'])
    const clean: Record<string, unknown> = {}
    for (const [k,v] of Object.entries(parsed || {})) if (allowed.has(k)) clean[k] = v

    return json(clean)
  } catch (e) {
    console.error('[generate-avatar] error', e)
    return json({ error: String(e?.message ?? e) }, 500)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

function safeParseJson(s: string) {
  try {
    const m = s.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
    const body = m ? m[1] : s
    return JSON.parse(body)
  } catch {
    return {}
  }
}
