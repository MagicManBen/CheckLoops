import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the CheckLoopsAI key from Supabase secrets
    const apiKey = Deno.env.get('CheckLoopsAI')
    
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'CheckLoopsAI secret not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Super simple OpenAI API call
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: 'Say "Hello from CheckLoopsAI"'
          }
        ],
        max_tokens: 10,
        temperature: 0
      })
    })

    if (!response.ok) {
      const error = await response.text()
      return new Response(
        JSON.stringify({ 
          error: 'OpenAI API error',
          status: response.status,
          details: error
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    const data = await response.json()
    const message = data.choices[0].message.content

    return new Response(
      JSON.stringify({ 
        success: true,
        message: message,
        apiKeyFound: true
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: error.message,
        apiKeyFound: !!Deno.env.get('CheckLoopsAI')
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})