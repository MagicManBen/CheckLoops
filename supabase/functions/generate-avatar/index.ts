import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import OpenAI from "npm:openai@^4.57.0"

// Configure CORS to only allow specific origins
const getAllowedOrigin = (req: Request): string => {
  const origin = req.headers.get('origin') || ''
  
  // Allow any localhost or 127.0.0.1 port for development
  if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
    return origin
  }
  
  // Allow specific production origins
  const allowedOrigins = [
    'https://magicmanben.github.io'
  ]
  
  // Return the origin if it's allowed, otherwise return wildcard for development
  return allowedOrigins.includes(origin) ? origin : '*'
}

const getCorsHeaders = (req: Request) => ({
  'Access-Control-Allow-Origin': getAllowedOrigin(req),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Credentials': 'true'
})

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(req) })
  }

  try {
    // Get authorization header - it should be the user's JWT from Supabase Auth
    const authHeader = req.headers.get('Authorization')
    
    if (!authHeader) {
      return json({ error: 'No authorization header' }, 401, req)
    }

    // Parse request body
    const requestBody = await req.json()
    const { description, options, seedHint } = requestBody
    
    if (!description || typeof description !== 'string') {
      return json({ error: 'Missing or invalid description' }, 400, req)
    }
    
    if (!options || typeof options !== 'object') {
      return json({ error: 'Missing or invalid options' }, 400, req)
    }

    // Get OpenAI API key from environment
    const apiKey = Deno.env.get('CheckLoopsAI')
    if (!apiKey) {
      console.error('CheckLoopsAI not configured')
      return json({ error: 'CheckLoopsAI key not configured' }, 500, req)
    }

    // Call OpenAI with the description
    
    // Initialize OpenAI client
    const openai = new OpenAI({ apiKey })

    // Create system prompt for OpenAI
    const system = `You are a precise UI assistant that generates DiceBear Adventurer avatar parameters from text descriptions.

Strict rules:
- Choose values strictly from the allowedOptions lists provided by the user message. Never invent values outside those lists.
- If a described attribute does not exist in the allowedOptions for that field, pick the closest semantic match from the allowed list; if still ambiguous, omit that key.
- For gender hints: "man/male" = more masculine seeds/expressions; "woman/female" = varied expressions.
- ALWAYS set all probabilities to 100 when available. This ensures features are consistently displayed.
- For colors (hairColor, skinColor, backgroundColor), select strictly from the corresponding allowed options lists (do not invent new hex codes).
- For hair colors, provide specific guidance: "blue" = "3eac2c", "brown" = "6a4e35" or "562306", "red" = "ab2a18" or "9e5622", "blonde" = "e5d7a3" or "b9a05f".
- Return valid JSON only with field names from requiredFields and values from allowedOptions.`

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
    // Parse the OpenAI response
    
    // Parse the response
    let parsed: Record<string, any>
    try {
      // Try to extract JSON from potential markdown code blocks
      const jsonMatch = responseContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
      const jsonString = jsonMatch ? jsonMatch[1] : responseContent
      parsed = JSON.parse(jsonString)
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError)
      return json({ error: 'Failed to parse AI response' }, 500, req)
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

    // Enforce values to be within allowed dropdown options provided by the client
    // Map result keys to their corresponding option list ids from the client
    const optionKeyMap: Record<string, string> = {
      backgroundType: 'opt-backgroundType',
      backgroundColor: 'opt-backgroundColor',
      backgroundRotation: 'opt-backgroundRotation',
      radius: 'opt-radius',
      rotate: 'opt-rotate',
      scale: 'opt-scale',
      flip: 'opt-flip',
      clip: 'opt-clip',
      translateX: 'opt-translateX',
      translateY: 'opt-translateY',
      eyes: 'opt-eyes',
      mouth: 'opt-mouth',
      eyebrows: 'opt-eyebrows',
      glasses: 'opt-glasses',
      glassesProbability: 'opt-glassesProbability',
      earrings: 'opt-earrings',
      earringsProbability: 'opt-earringsProbability',
      features: 'opt-features',
      featuresProbability: 'opt-featuresProbability',
      hair: 'opt-hair',
      hairColor: 'opt-hairColor',
      hairProbability: 'opt-hairProbability',
      skinColor: 'opt-skinColor',
    }

    function coerceToAllowed(key: string, val: any): any {
      const optId = optionKeyMap[key]
      if (!optId) return val
      const allowed = (options && typeof options === 'object') ? (options as any)[optId] : undefined
      if (!Array.isArray(allowed) || allowed.length === 0) return val

      // Special handling for features (array)
      if (key === 'features') {
        const arr = Array.isArray(val) ? val : (val ? [val] : [])
        const filtered = arr.filter((v) => allowed.includes(v))
        return filtered
      }

      // Normalize numbers to strings for comparison if option lists are strings
      const normalizedVal = (typeof val === 'number') ? String(val) : String(val)
      const found = allowed.find((v) => String(v) === normalizedVal)
      return found !== undefined ? (typeof allowed[0] === 'number' ? Number(found) : found) : undefined
    }

    for (const key of Object.keys(cleanedResult)) {
      const coerced = coerceToAllowed(key, cleanedResult[key])
      if (coerced === undefined) {
        // Drop values not present in allowed lists to avoid client-side mismatches
        delete cleanedResult[key]
      } else {
        cleanedResult[key] = coerced
      }
    }

    // Ensure we have at least some basic fields
    if (!cleanedResult.seed) {
      cleanedResult.seed = seedHint || 'User'
    }

    // Return the generated avatar parameters
    
    return json(cleanedResult, 200, req)
  } catch (error) {
    console.error('Error in generate-avatar function:', error)
    return json({ 
      error: error instanceof Error ? error.message : 'Internal server error'
    }, 500, req)
  }
})

function json(body: any, status = 200, req?: Request) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...(req ? getCorsHeaders(req) : {}), 'Content-Type': 'application/json' }
  })
}
