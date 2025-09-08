import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import OpenAI from "npm:openai@^4.57.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🚀 Generate Avatar Function Called')
    console.log('Method:', req.method)
    
    // Get authorization header - it should be the user's JWT from Supabase Auth
    const authHeader = req.headers.get('Authorization')
    console.log('Auth header present:', !!authHeader)
    
    if (!authHeader) {
      return json({ error: 'No authorization header' }, 401)
    }

    // Parse request body
    const requestBody = await req.json()
    const { description, options, seedHint } = requestBody
    
    if (!description || typeof description !== 'string') {
      return json({ error: 'Missing or invalid description' }, 400)
    }
    
    if (!options || typeof options !== 'object') {
      return json({ error: 'Missing or invalid options' }, 400)
    }

    // Get OpenAI API key from environment
    const apiKey = Deno.env.get('OPENAI_API_KEY')
    if (!apiKey) {
      console.error('OPENAI_API_KEY not configured')
      return json({ error: 'OpenAI API key not configured' }, 500)
    }

    console.log('Calling OpenAI with description:', description.substring(0, 50) + '...')
    
    // Initialize OpenAI client
    const openai = new OpenAI({ apiKey })

    // Create system prompt for OpenAI
    const system = `You are a precise UI assistant that generates DiceBear Adventurer avatar parameters from text descriptions.

Key instructions:
- Select values ONLY from the provided dropdown options
- For gender hints: "man/male" = masculine seeds and serious expressions, "woman/female" = varied expressions
- Always set probability values: hairProbability=100 for visible hair, featuresProbability=100 for visible features, glassesProbability=100 for glasses if mentioned
- Map colors appropriately: brown hair = "9e5622" or "763900", blonde = "e5d7a3", black = "0e0e0e", red = "cb6820"
- Return valid JSON only with these exact field names

Available options for each field are provided in the user message.`

    const userMsg = JSON.stringify({
      task: 'Generate avatar parameters from description',
      description,
      seedHint: seedHint || 'User',
      allowedOptions: options,
      requiredFields: [
        'seed', 'backgroundType', 'backgroundColor', 'backgroundRotation',
        'radius', 'rotate', 'scale', 'flip', 'clip', 'translateX', 'translateY',
        'eyes', 'mouth', 'eyebrows', 'glasses', 'glassesProbability',
        'earrings', 'earringsProbability', 'features', 'featuresProbability',
        'hair', 'hairColor', 'hairProbability', 'skinColor'
      ]
    })

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userMsg }
      ]
    })

    const responseContent = completion.choices?.[0]?.message?.content || '{}'
    console.log('OpenAI response received, parsing...')
    
    // Parse the response
    let parsed: Record<string, any>
    try {
      // Try to extract JSON from potential markdown code blocks
      const jsonMatch = responseContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
      const jsonString = jsonMatch ? jsonMatch[1] : responseContent
      parsed = JSON.parse(jsonString)
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError)
      return json({ error: 'Failed to parse AI response' }, 500)
    }

    // Filter to only allowed DiceBear fields
    const allowedFields = new Set([
      'seed', 'backgroundType', 'backgroundColor', 'backgroundRotation',
      'radius', 'rotate', 'scale', 'flip', 'clip', 'translateX', 'translateY',
      'eyes', 'mouth', 'eyebrows', 'glasses', 'glassesProbability',
      'earrings', 'earringsProbability', 'features', 'featuresProbability',
      'hair', 'hairColor', 'hairProbability', 'skinColor'
    ])
    
    const cleanedResult: Record<string, any> = {}
    for (const [key, value] of Object.entries(parsed)) {
      if (allowedFields.has(key) && value !== undefined && value !== null && value !== '') {
        cleanedResult[key] = value
      }
    }

    // Ensure we have at least some basic fields
    if (!cleanedResult.seed) {
      cleanedResult.seed = seedHint || 'User'
    }

    console.log('Successfully generated avatar parameters:', Object.keys(cleanedResult).length, 'fields')
    
    return json(cleanedResult)
  } catch (error) {
    console.error('Error in generate-avatar function:', error)
    return json({ 
      error: error instanceof Error ? error.message : 'Internal server error',
      details: String(error)
    }, 500)
  }
})

function json(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}