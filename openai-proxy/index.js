require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const app = express();

// Enable CORS for local development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json());

const OPENAI_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_KEY) {
  console.error('❌ OPENAI_API_KEY environment variable is required');
  console.log('   Set it with: export OPENAI_API_KEY=your_key_here');
  console.log('   Or create a .env file with: OPENAI_API_KEY=your_key_here');
  process.exit(1);
}

console.log('✅ OpenAI API key loaded from environment');

app.post('/extract-complaint', async (req, res) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'missing text field in request body' });
  }

  try {
    console.log('🤖 Extracting complaint details from text length:', text.length);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'system',
          content: `You are an expert medical practice administrator analyzing complaint documents.

Your task is to extract complaint details and classify them appropriately.

Extract and return ONLY valid JSON in this exact format:
{
  "patient_initials": "Patient initials (2-4 letters)",
  "category": "Communication|Clinical Care|Facilities|Staffing|Billing|Access|Other",
  "priority": "low|medium|high",
  "original_complaint": "The patient's complaint text here",
  "response": "The practice's response text here",
  "lessons_learned": "What was learned and improvements made"
}

Guidelines:
- Extract patient initials from the text, use "N/A" if not found
- Choose the most appropriate category from the list above
- Assess priority based on severity and impact (high=serious safety/legal issues)
- Extract the main complaint accurately and completely
- Include specific details about what went wrong
- Capture the practice's response, apology, or corrective actions
- Identify lessons learned and process improvements mentioned
- If information is missing, return an empty string for that field
- For priority, default to "medium" if unclear

Do not include any other text or formatting.`
        },
        {
          role: 'user',
          content: `Please extract the complaint details from this text:\n\n${text}`
        }],
        max_tokens: 1500,
        temperature: 0.1
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      return res.status(response.status).json({ 
        error: `OpenAI API error: ${response.status} ${response.statusText}` 
      });
    }
    
    const data = await response.json();
    
    try {
      // Parse the JSON response from OpenAI
      const extractedContent = JSON.parse(data.choices[0].message.content);
      console.log('✅ Complaint details extracted successfully');
      return res.json({ 
        success: true, 
        data: extractedContent 
      });
    } catch (parseError) {
      console.error('Failed to parse OpenAI JSON response:', parseError);
      return res.status(500).json({ 
        error: 'Failed to parse AI response as JSON',
        raw_response: data.choices[0].message.content
      });
    }
    
  } catch (err) {
    console.error('Proxy error:', err);
    return res.status(500).json({ 
      error: 'Internal proxy error',
      details: err.message 
    });
  }
});

app.post('/summarize', async (req, res) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'missing text field in request body' });
  }

  try {
    console.log('🤖 Generating summary for text length:', text.length);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'user',
          content: `Please provide a concise summary of the following complaint and response, focusing on key issues and lessons learned:\n\n${text}`
        }],
        max_tokens: 400,
        temperature: 0.3
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      return res.status(response.status).json({ 
        error: `OpenAI API error: ${response.status} ${response.statusText}` 
      });
    }
    
    const data = await response.json();
    console.log('✅ Summary generated successfully');
    return res.json(data);
    
  } catch (err) {
    console.error('Proxy error:', err);
    return res.status(500).json({ 
      error: 'Internal proxy error',
      details: err.message 
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    openai_configured: !!OPENAI_KEY 
  });
});

const port = process.env.PORT || 8787;
app.listen(port, () => {
  console.log(`🚀 OpenAI proxy server running on http://localhost:${port}`);
  console.log(`📝 Health check: http://localhost:${port}/health`);
  console.log(`🤖 Summarize endpoint: POST http://localhost:${port}/summarize`);
});
