# OpenAI API Integration Guide for CheckLoop Complaints

## Overview

This guide explains how to integrate OpenAI's API into your CheckLoop complaints system to automatically extract complaint details and responses from uploaded documents.

## Security Considerations

**NEVER put your OpenAI API key directly in client-side code!** This would expose your key to anyone viewing the page source. Instead, you need to:

1. Store the API key on your server
2. Create a server-side endpoint that calls OpenAI
3. Call your server endpoint from the client

## Implementation Options

### Option 1: Supabase Edge Functions (Recommended)

Supabase Edge Functions are serverless functions that can securely handle API keys.

#### Step 1: Create an Edge Function

1. Install Supabase CLI: `npm install -g supabase`
2. Login: `supabase login`
3. Link your project: `supabase link --project-ref YOUR_PROJECT_REF`
4. Create the function:

```bash
supabase functions new extract-complaint
```

#### Step 2: Edge Function Code

Create `supabase/functions/extract-complaint/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    // Verify user is authenticated
    const authHeader = req.headers.get('Authorization')!
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )
    
    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    if (userError || !user) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }

    const { files } = await req.json()
    
    if (!files || files.length === 0) {
      return new Response('No files provided', { status: 400, headers: corsHeaders })
    }

    // Process files and extract text (you'll need to implement file processing)
    const extractedText = await processFiles(files)
    
    // Call OpenAI API
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are an expert at extracting information from medical practice complaint documents. 
                     Extract the original complaint and the practice's response from the provided text.
                     Return the result as JSON with keys "original_complaint" and "response".
                     If either is not found, return an empty string for that field.`
          },
          {
            role: 'user',
            content: `Please extract the complaint and response from this text:\n\n${extractedText}`
          }
        ],
        temperature: 0.3,
        max_tokens: 1500
      })
    })

    if (!openAIResponse.ok) {
      throw new Error(`OpenAI API error: ${openAIResponse.statusText}`)
    }

    const aiResult = await openAIResponse.json()
    const extractedContent = JSON.parse(aiResult.choices[0].message.content)

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: extractedContent 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

// Helper function to process files and extract text
async function processFiles(files: any[]): Promise<string> {
  // This is a simplified version - you'll need to implement:
  // 1. PDF text extraction
  // 2. Word document processing
  // 3. Image OCR for scanned documents
  
  let combinedText = ''
  
  for (const file of files) {
    // For now, assume the file content is provided as base64
    // In reality, you'd need to:
    // - Download the file from Supabase Storage
    // - Use appropriate libraries to extract text based on file type
    
    if (file.type.includes('pdf')) {
      // Use a PDF processing library
      combinedText += await extractPdfText(file.content)
    } else if (file.type.includes('word')) {
      // Use a Word processing library
      combinedText += await extractWordText(file.content)
    } else if (file.type.includes('image')) {
      // Use OCR (Optical Character Recognition)
      combinedText += await extractImageText(file.content)
    } else if (file.type.includes('text')) {
      // Plain text
      combinedText += atob(file.content) // Decode base64
    }
    
    combinedText += '\n\n'
  }
  
  return combinedText
}

// Placeholder functions - implement these based on your needs
async function extractPdfText(base64Content: string): Promise<string> {
  // Use a library like 'pdf-parse' or similar
  return "PDF text extraction not implemented"
}

async function extractWordText(base64Content: string): Promise<string> {
  // Use a library for Word document processing
  return "Word text extraction not implemented"
}

async function extractImageText(base64Content: string): Promise<string> {
  // Use OCR service like Google Cloud Vision or Azure Computer Vision
  return "Image OCR not implemented"
}
```

#### Step 3: Set Environment Variables

Set your OpenAI API key in Supabase:

```bash
supabase secrets set OPENAI_API_KEY=your_openai_api_key_here
```

#### Step 4: Deploy the Function

```bash
supabase functions deploy extract-complaint
```

#### Step 5: Update Client Code

Replace the `extractWithAI` function in your HTML:

```javascript
async function extractWithAI() {
  const files = document.getElementById('complaint-ai-files').files;
  if (files.length === 0) {
    alert('Please select files first');
    return;
  }

  const button = document.getElementById('ai-extract-btn');
  const originalText = button.textContent;
  
  // Show loading state
  button.innerHTML = `
    <div class="ai-processing">
      <div class="spinner"></div>
      <span>Processing with AI...</span>
    </div>
  `;
  button.disabled = true;

  try {
    // Convert files to base64 for sending to Edge Function
    const fileData = []
    for (const file of files) {
      const base64 = await fileToBase64(file)
      fileData.push({
        name: file.name,
        type: file.type,
        content: base64
      })
    }

    // Get user session for authentication
    const { data: { session } } = await supabase.auth.getSession()
    
    // Call your Edge Function
    const response = await fetch('/functions/v1/extract-complaint', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ files: fileData })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    
    if (!result.success) {
      throw new Error(result.error)
    }

    // Update the UI with extracted content
    document.getElementById('ai-complaint-text').textContent = result.data.original_complaint
    document.getElementById('ai-response-text').textContent = result.data.response
    document.getElementById('ai-extracted-content').style.display = 'block'
    
    // Auto-populate manual fields
    document.getElementById('complaint-original').value = result.data.original_complaint
    document.getElementById('complaint-response').value = result.data.response
    
  } catch (error) {
    console.error('AI extraction failed:', error)
    document.getElementById('complaint-error').textContent = 'AI extraction failed: ' + error.message
    document.getElementById('complaint-error').style.display = 'block'
  } finally {
    button.textContent = originalText
    button.disabled = false
  }
}

// Helper function to convert file to base64
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result.split(',')[1]) // Remove data:type;base64, prefix
    reader.onerror = error => reject(error)
  })
}
```

### Option 2: Your Own Server Endpoint

If you prefer to use your own server, create an endpoint like:

```javascript
// Node.js with Express example
app.post('/api/extract-complaint', authenticateUser, async (req, res) => {
  try {
    const { files } = req.body
    
    // Process files and extract text
    const extractedText = await processFiles(files)
    
    // Call OpenAI
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'Extract complaint and response from the provided text...'
        },
        {
          role: 'user',
          content: extractedText
        }
      ],
      temperature: 0.3,
      max_tokens: 1500
    })
    
    const extractedContent = JSON.parse(response.choices[0].message.content)
    res.json({ success: true, data: extractedContent })
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})
```

## File Processing Libraries

For extracting text from different file types, you'll need:

### PDF Processing
- **pdf-parse** (Node.js): `npm install pdf-parse`
- **pdf2pic** for image PDFs: `npm install pdf2pic`

### Word Documents
- **mammoth** (Node.js): `npm install mammoth`
- For .doc files: **textract**: `npm install textract`

### Image OCR
- **Google Cloud Vision API**
- **Azure Computer Vision**
- **AWS Textract**
- **Tesseract.js** (client-side): `npm install tesseract.js`

## OpenAI Prompt Engineering

For better results, customize your prompt:

```javascript
const systemPrompt = `You are an expert medical practice administrator analyzing complaint documents.

Your task is to extract:
1. The original patient complaint
2. The practice's response or resolution

Guidelines:
- Extract the main complaint accurately and completely
- Include specific details about what went wrong
- Capture the practice's response, apology, or corrective actions
- If multiple complaints exist, extract the primary one
- If information is missing, return an empty string for that field

Return ONLY valid JSON in this format:
{
  "original_complaint": "The patient's complaint text here",
  "response": "The practice's response text here"
}

Do not include any other text or formatting.`
```

## Cost Considerations

- OpenAI GPT-4: ~$0.03 per 1K input tokens, ~$0.06 per 1K output tokens
- For typical complaint documents (1-2 pages), expect ~$0.10-0.50 per extraction
- Consider using GPT-3.5-turbo for cost savings if accuracy is sufficient

## Testing

Test with various document types:
1. Handwritten complaint letters (scanned)
2. Email threads
3. Word documents
4. PDF reports
5. Mixed format documents

## Security Best Practices

1. ✅ Store API keys server-side only
2. ✅ Authenticate all requests
3. ✅ Validate file types and sizes
4. ✅ Sanitize extracted content
5. ✅ Log API usage for monitoring
6. ✅ Implement rate limiting
7. ✅ Use HTTPS for all communications

## Error Handling

Implement robust error handling for:
- Invalid file formats
- OpenAI API failures
- File processing errors
- Network timeouts
- Rate limiting

## Getting Started

1. Sign up for OpenAI API access at https://platform.openai.com/
2. Get your API key from the API keys section
3. Implement the Edge Function approach above
4. Test with sample documents
5. Monitor usage and costs

Would you like me to help you implement any specific part of this integration?
