import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import OpenAI from "npm:openai@^4.57.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const slotTypes = body.slotTypes || body.slot_types || body.data || null

    if (!slotTypes || !Array.isArray(slotTypes) || slotTypes.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No slotTypes array provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize OpenAI client using environment var set in Supabase function
    const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY') })
    if (!openai.apiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Build prompt expecting strict JSON output
    const slotListText = slotTypes.join(', ')
    const userPrompt = `Classify the following Slot Types into three categories exactly using only JSON with keys:\n{\n  "on_the_day": [],\n  "within_1_week": [],\n  "within_2_weeks": []\n}\n\nSlot Types:\n${slotListText}\n\nRules: Return ONLY valid JSON using the keys above. Put slot type strings exactly as provided (do not normalize or trim) into the arrays. Do not include any other keys or text.`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 800,
      temperature: 0.0
    })

    const aiContent = response.choices?.[0]?.message?.content
    if (!aiContent) {
      return new Response(
        JSON.stringify({ error: 'No response from OpenAI' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Log prompt and raw AI content for debugging
    try {
      console.log('classify-slot-types: prompt sent to AI:', userPrompt)
      console.log('classify-slot-types: raw AI response:', aiContent)
    } catch (_) {}

    // Try to extract JSON from AI response
    let parsed
    try {
      const m = aiContent.match(/\{[\s\S]*\}/)
      if (!m) throw new Error('No JSON found in AI response')
      parsed = JSON.parse(m[0])
    } catch (parseErr) {
      return new Response(
        JSON.stringify({ error: 'Failed to parse AI JSON response', raw: aiContent }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate keys
    const keys = ['on_the_day', 'within_1_week', 'within_2_weeks']
    for (const k of keys) if (!Array.isArray(parsed[k])) parsed[k] = []

    // Include prompt and raw AI response in debug output so the client can display them
    return new Response(JSON.stringify({ success: true, classification: parsed, debug: { prompt: userPrompt, aiRaw: aiContent } }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err) {
    console.error('classify-slot-types error:', err)
    const message = (err && (err as any).message) ? (err as any).message : String(err)
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
