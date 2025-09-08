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
    // Verify auth (require a signed-in user)
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Unauthorized' }, 401)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userErr } = await supabase.auth.getUser(token)
    if (userErr || !user) return json({ error: 'Unauthorized' }, 401)

    // Read body
    const { description, options, seedHint } = await req.json()
    if (!description || typeof description !== 'string') return json({ error: 'Missing description' }, 400)
    if (!options || typeof options !== 'object') return json({ error: 'Missing options' }, 400)

    const apiKey = Deno.env.get('OPENAI_API_KEY')
    if (!apiKey) return json({ error: 'OPENAI_API_KEY not configured' }, 500)

    const openai = new OpenAI({ apiKey })

    const system = 'You are a precise UI assistant that selects DiceBear Avataaars options strictly from provided dropdowns. For male descriptions, prioritize masculine features like facial hair (beardLight, beardMedium, beardMajestic, moustacheFancy), shorter hairstyles, and serious expressions. For female descriptions, avoid facial hair and use longer hairstyles. Respond with valid JSON only.'
    const userMsg = JSON.stringify({
      task: 'Map description to options',
      style: 'avataaars',
      seedHint, description,
      allowedOptions: options,
      expectedKeys: ['seed','backgroundType','backgroundColor','backgroundRotation','radius','rotate','scale','flip','clip','translateX','translateY','accessories','accessoriesColor','accessoriesProbability','clothing','clothingColor','clothingGraphic','eyebrows','eyes','facialHair','facialHairColor','facialHairProbability','hairColor','hatColor','mouth','nose','skinColor','top']
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
    const parsed = safeParseJson(raw)
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
