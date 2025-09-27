// SIMPLIFIED SUPABASE EDGE FUNCTION
// /supabase/functions/analyze-certificate-image/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import OpenAI from "npm:openai@^4.57.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { image, filename } = await req.json()

    if (!image) {
      return new Response(
        JSON.stringify({ error: 'No image provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY')
    })

    if (!openai.apiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Processing certificate image: ${filename}`)

    // Analyze certificate image with GPT-4 Vision
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // GPT-4 with vision capabilities
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Please analyze this training certificate image and extract the following information in JSON format:

{
  "person_name": "Full name of the certificate holder",
  "training_name": "Name/title of the training course",
  "completion_date": "Date completed (YYYY-MM-DD format)",
  "expiry_date": "Expiry date if shown (YYYY-MM-DD format, or null)",
  "provider": "Training provider/organization name",
  "certificate_id": "Certificate ID/number if shown",
  "additional_details": "Any other relevant information"
}

Rules:
- Extract exact text as it appears
- For dates, convert to YYYY-MM-DD format (e.g., "26Sep2025" becomes "2025-09-26")
- If information is not clearly visible, use null
- Be precise and don't guess information that's unclear
- Focus on the main certificate content, ignore watermarks/headers`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/png;base64,${image}`
              }
            }
          ]
        }
      ],
      max_tokens: 500,
      temperature: 0.1 // Low temperature for consistent extraction
    })

    const aiContent = response.choices[0]?.message?.content
    if (!aiContent) {
      throw new Error('No response from AI')
    }

    console.log('AI Response:', aiContent)

    // Parse JSON response
    let extractedData
    try {
      // Extract JSON from response (in case AI includes extra text)
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response')
      }
      
      extractedData = JSON.parse(jsonMatch[0])
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to parse AI response',
          raw_response: aiContent 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate and clean extracted data
    const cleanedData = {
      person_name: extractedData.person_name || null,
      training_name: extractedData.training_name || null,
      completion_date: extractedData.completion_date || null,
      expiry_date: extractedData.expiry_date || null,
      provider: extractedData.provider || null,
      certificate_id: extractedData.certificate_id || null,
      additional_details: extractedData.additional_details || null
    }

    console.log('Extracted data:', cleanedData)

    return new Response(
      JSON.stringify({
        success: true,
        data: cleanedData,
        filename: filename
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Certificate analysis error:', error)
    
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to analyze certificate',
        success: false
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})