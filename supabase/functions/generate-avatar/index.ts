import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import OpenAI from "npm:openai@^4.57.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Simple auth check - just ensure we have a Bearer token that looks like a JWT
    const authHeader = req.headers.get('Authorization')
    console.log('Auth header received:', authHeader ? 'Bearer token present' : 'none')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No valid authorization header found')
      return json({ error: 'Unauthorized: No authorization header' }, 401)
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Basic JWT validation - check if it has the right structure
    if (!token || token.split('.').length !== 3) {
      console.log('Invalid JWT token structure')
      return json({ error: 'Unauthorized: Invalid token format' }, 401)
    }
    
    console.log('Token validation passed, proceeding with AI generation')

    // Read body
    const { description, options, seedHint } = await req.json()
    if (!description || typeof description !== 'string') return json({ error: 'Missing description' }, 400)
    if (!options || typeof options !== 'object') return json({ error: 'Missing options' }, 400)

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
