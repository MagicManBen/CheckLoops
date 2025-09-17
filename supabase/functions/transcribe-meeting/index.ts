import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const OPENAI_API_KEY = Deno.env.get('CheckLoopsAI')
    if (!OPENAI_API_KEY) {
      throw new Error('CheckLoopsAI key not configured')
    }

    const { audio_base64, filename, meeting_id, file_type } = await req.json()
    
    if (!audio_base64 || !filename) {
      return new Response(
        JSON.stringify({ error: 'Audio data and filename are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Convert base64 to blob
    const audioBuffer = Uint8Array.from(atob(audio_base64), c => c.charCodeAt(0))
    const audioBlob = new Blob([audioBuffer], { type: file_type || 'audio/webm' })
    
    // Create form data for OpenAI Whisper API
    const formData = new FormData()
    formData.append('file', audioBlob, filename || 'recording.webm')
    formData.append('model', 'whisper-1')
    formData.append('response_format', 'text')
    formData.append('language', 'en')

    // Call OpenAI Whisper API for transcription
    const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData
    })

    if (!whisperResponse.ok) {
      const error = await whisperResponse.text()
      throw new Error(`Whisper API error: ${error}`)
    }

    const transcript = await whisperResponse.text()

    // Now use GPT-4 to format the transcript into meeting minutes
    const gptResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a professional meeting minutes formatter. Convert the following transcript into well-structured meeting minutes.

IMPORTANT: Include ALL discussion points, decisions, and conversations from the transcript. Do not summarize or shorten - provide the FULL detailed minutes.

Structure the output with:
1. Meeting Title and Date
2. Attendees Present (list all mentioned)
3. Main Discussion Points (include ALL topics discussed with full details)
4. Action Items (with owners and deadlines if mentioned)
5. Key Decisions Made (all decisions, no matter how small)
6. Next Steps

Be thorough and comprehensive. Include every topic discussed, every decision made, and every action item mentioned. The output should be a complete record of the meeting.`
          },
          {
            role: 'user',
            content: `Meeting ID: ${meeting_id}\nFilename: ${filename}\nTranscript:\n${transcript}`
          }
        ],
        max_tokens: 4000,
        temperature: 0.3
      })
    })

    if (!gptResponse.ok) {
      const error = await gptResponse.text()
      throw new Error(`GPT API error: ${error}`)
    }

    const gptData = await gptResponse.json()
    const formattedMinutes = gptData.choices[0].message.content

    return new Response(
      JSON.stringify({ 
        transcript: formattedMinutes,
        rawTranscript: transcript,
        success: true 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})