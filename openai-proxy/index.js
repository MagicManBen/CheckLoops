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
