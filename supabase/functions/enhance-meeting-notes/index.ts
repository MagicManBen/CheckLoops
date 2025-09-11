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
    const OPENAI_API_KEY = Deno.env.get('CheckLoopsAI')
    
    const { meeting_title, meeting_date, raw_notes, agenda_items, attendees } = await req.json()
    
    if (!raw_notes) {
      return new Response(
        JSON.stringify({ error: 'Notes are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // If OpenAI key is not configured, return formatted notes without AI
    if (!OPENAI_API_KEY) {
      const basicFormatted = formatNotesBasic(meeting_title, meeting_date, raw_notes, agenda_items, attendees)
      return new Response(
        JSON.stringify({ enhanced_notes: basicFormatted }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Use GPT-4 to enhance and format the notes
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
            content: `You are a professional meeting minutes formatter. Your task is to enhance and structure meeting notes into professional minutes of meeting (MoM) format.

Format the output as follows:
1. Meeting header with title, date, and attendees
2. Agenda items discussed (numbered list)
3. Key discussion points (organized by topic)
4. Decisions made (clear bullet points)
5. Action items with owners and deadlines
6. Next steps
7. Any other relevant information

Keep the tone professional but clear. Ensure all important information from the raw notes is preserved while improving clarity and structure.`
          },
          {
            role: 'user',
            content: `Meeting Title: ${meeting_title}
Date: ${new Date(meeting_date).toLocaleString()}
Attendees: ${attendees?.join(', ') || 'Not specified'}

Agenda Items:
${agenda_items?.map((item: any) => `- ${item.title}: ${item.description || ''}`).join('\n') || 'None specified'}

Raw Meeting Notes:
${raw_notes}`
          }
        ],
        max_tokens: 2000,
        temperature: 0.3
      })
    })

    if (!gptResponse.ok) {
      const error = await gptResponse.text()
      console.error('GPT API error:', error)
      // Fallback to basic formatting
      const basicFormatted = formatNotesBasic(meeting_title, meeting_date, raw_notes, agenda_items, attendees)
      return new Response(
        JSON.stringify({ enhanced_notes: basicFormatted }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const gptData = await gptResponse.json()
    const enhancedNotes = gptData.choices[0].message.content

    return new Response(
      JSON.stringify({ 
        enhanced_notes: enhancedNotes,
        success: true 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Enhancement error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        enhanced_notes: req.json().raw_notes || 'Error processing notes'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  }
})

function formatNotesBasic(title: string, date: string, notes: string, agenda: any[], attendees: string[]): string {
  let formatted = `MINUTES OF MEETING\n${'='.repeat(50)}\n\n`
  formatted += `Meeting: ${title}\n`
  formatted += `Date: ${new Date(date).toLocaleString()}\n`
  formatted += `Attendees: ${attendees?.join(', ') || 'Not specified'}\n\n`
  
  if (agenda && agenda.length > 0) {
    formatted += `AGENDA ITEMS\n${'-'.repeat(30)}\n`
    agenda.forEach((item, i) => {
      formatted += `${i + 1}. ${item.title}\n`
      if (item.description) {
        formatted += `   ${item.description}\n`
      }
    })
    formatted += '\n'
  }
  
  formatted += `MEETING NOTES\n${'-'.repeat(30)}\n`
  formatted += notes + '\n\n'
  
  formatted += `NEXT STEPS\n${'-'.repeat(30)}\n`
  formatted += `" Review and distribute these minutes\n`
  formatted += `" Follow up on action items\n`
  formatted += `" Schedule next meeting\n\n`
  
  formatted += `${'-'.repeat(50)}\n`
  formatted += `Generated: ${new Date().toLocaleString()}\n`
  
  return formatted
}