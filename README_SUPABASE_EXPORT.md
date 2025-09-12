Supabase export helper
======================

What this does
- Adds a tiny Node script that calls your Supabase RPC `export_everything` and writes the JSON to `supabaseinfo.txt`.

Automation options
- You can schedule the export locally with a cron job calling `npm run export:supabase:pretty`.
- For CI (e.g. GitHub Actions) run the script with repository / Supabase secrets to auto-update `SupabaseInfo.txt` in a protected branch.

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
npm run export:supabase          # minified redacted export
npm run export:supabase:pretty   # pretty redacted export (recommended for diffs)
node scripts/export_supabase.js --no-redact --output SupabaseInfo.unredacted.json
```

Local cron (macOS example)
1. Run `crontab -e` and add:
```
0 2 * * * cd $(pwd) && /usr/bin/env PATH=$PATH:/usr/local/bin npm run export:supabase:pretty >> cron_supabase_export.log 2>&1
```
2. Ensure your `.env` is present (cron uses a minimal environment).

GitHub Actions example (.github/workflows/supabase-export.yml):
```yaml
name: Supabase Export
on:
	schedule:
		- cron: '0 2 * * *'
	workflow_dispatch: {}
jobs:
	export:
		runs-on: ubuntu-latest
		steps:
			- uses: actions/checkout@v4
			- uses: actions/setup-node@v4
				with:
					node-version: 20
			- run: npm ci
			- run: node scripts/export_supabase.js --pretty
				env:
					SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
					SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
			- name: Commit update
				run: |
					if git diff --quiet SupabaseInfo.txt; then
						echo "No changes"
					else
						git config user.name 'automation'
						git config user.email 'actions@users.noreply.github.com'
						git add SupabaseInfo.txt
						git commit -m 'chore: update SupabaseInfo export'
						git push
					fi
```

Security notes
- The script requires a Supabase service role key if your RPC needs elevated privileges. Do NOT commit the key.
- Consider using Supabase Edge functions or CI secrets to run this in automation instead of storing keys locally.
- Redaction is ON by default. Use `--no-redact` only for temporary local diagnostics; add resulting filename to `.gitignore`.

Alternatives
- Use the Supabase CLI or the SQL editor's "Export" button manually.
- Create a serverless function that runs the RPC and stores results in storage.
