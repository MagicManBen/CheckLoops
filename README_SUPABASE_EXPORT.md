Supabase export helper
======================

What this does
- Adds a tiny Node script that calls your Supabase RPC `export_everything` and writes the JSON to `supabaseinfo.txt`.

Files added
- `scripts/export_supabase.js` - the script that calls Supabase and writes the file.
- `.env.example` - example env file with variables you must set.

Usage
1. Install dependencies (from repository root):

```bash
npm install
```

2. Provide credentials via environment or `.env` (create `.env` from `.env.example`).

3. Run the export:

```bash
npm run export:supabase
# or for pretty-printed JSON
npm run export:supabase:pretty
```

Security notes
- The script requires a Supabase service role key if your RPC needs elevated privileges. Do NOT commit the key.
- Consider using Supabase Edge functions or CI secrets to run this in automation instead of storing keys locally.

Alternatives
- Use the Supabase CLI or the SQL editor's "Export" button manually.
- Create a serverless function that runs the RPC and stores results in storage.
