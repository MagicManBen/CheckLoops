# OpenAI Proxy for CheckLoop Complaints

This Express server provides a secure proxy for OpenAI API calls, preventing API keys from being exposed in client-side code.

## Setup

1. **Install dependencies:**
   ```bash
   cd openai-proxy
   npm install
   ```

2. **Configure API key securely:**
   ```bash
   # Copy the example environment file
   cp .env.example .env
   
   # Edit .env and add your OpenAI API key
   nano .env
   ```
   
   Add this line to `.env`:
   ```
   OPENAI_API_KEY=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
   ```

3. **Start the server:**
   ```bash
   npm start
   ```

## Security Features

- ✅ API key stored in environment variables only
- ✅ `.env` files are gitignored (won't be committed)
- ✅ CORS enabled for local development
- ✅ Error handling and logging
- ✅ Health check endpoint

## Endpoints

- `GET /health` - Server health check
- `POST /summarize` - Summarize complaint text

## Usage from CheckLoop

The complaints UI will automatically call `http://localhost:8787/summarize` when you click the "🤖 AI Summarize" button.

## Important Security Notes

1. **Never commit API keys to git** - The .gitignore prevents this
2. **Use environment variables only** - Never hardcode keys in source
3. **Local development only** - Don't expose this server publicly without authentication
4. **Revoke compromised keys** - If a key is accidentally exposed, revoke it immediately

## Troubleshooting

- If you get CORS errors, make sure the server is running on port 8787
- If authentication fails, check your API key in the `.env` file
- Check the console logs for detailed error messages
