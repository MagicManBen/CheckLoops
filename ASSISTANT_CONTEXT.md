# Assistant Context and Presets

Central source of truth for this assistant. Attach/pin this file in chat so instructions are always in context.

## Project facts
- Stack: Single-page app (`index.html`) + Supabase (Auth + Database).
- Project management issues: `public.project_issues`.
- Types: `bug` (Bug fix), `feature` (New idea). Status: `open`, `closed`.
- UX: Right-click any element → Add to Issue Tracker → choose Type + optional Notes.
- Table shows: row number, title, main idea line (Type + Comment/element), meta (element/text/created), and location (page/selector).

## Supabase config (for local/dev usage)
- SUPABASE_URL: `https://unveoqnlqnobufhublyw.supabase.co`
- SUPABASE_ANON_KEY: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMTcyNzYsImV4cCI6MjA3MDU5MzI3Nn0.g93OsXDpO3V9DToU7s-Z3SwBBnB84rBv0JMv-idgSME`
- Optional CLI site scoping: `SITE_ID` environment variable.
- Use `@supabase/supabase-js` v2 in the app and scripts.

## Testing account (UI testing only)
- Email: `ben.howard@stoke.nhs.uk`
- Password: `Hello1!`

Note: Treat this as a test-only account. Rotate/reset if exposed or committed publicly.

## Assistant directives (always)
1) Use Supabase CLI for schema/context tasks
  - Prefer CLI to inspect schema and generate types so the assistant “knows” all tables and relationships.
  - Example commands (requires Supabase CLI):
    - `supabase login`
    - `supabase link --project-ref unveoqnlqnobufhublyw`
    - `supabase db pull`                      # pull the remote schema locally
    - `supabase gen types typescript --linked > supabase.types.ts`
  - If CLI isn’t available, inspect DB via `@supabase/supabase-js` or refer to migrations/config in the repo.

2) Use the Tasks CLI to work tasks by number
  - `npm run tasks:list` — list tasks with numbers
  - `npm run tasks:show -- <num>` — get full JSON (type, page, selector, comment, etc.)
  - `npm run tasks:complete -- <num>` — mark closed
  - `npm run tasks:reopen -- <num>` — mark open
  - `npm run tasks:export` — produce `chat-context-tasks.json` for chat ingestion

3) In the app, always use `@supabase/supabase-js` v2
  - Respect `type` ∈ {`bug`,`feature`} and `status` ∈ {`open`,`closed`}.
  - When creating from UI, append Notes as a `\nNotes: <text>` line in `description`.
  - Use optimistic rendering if `ctx.site_id` is missing.

## How to use this file as chat context
- In VS Code Chat:
  - Add/pin `ASSISTANT_CONTEXT.md` using the “Add file” (+) button or drag-and-drop.
  - Optionally also attach `chat-context-tasks.json` (run `npm run tasks:export` first) so the assistant can reference the latest tasks by number.
  - Keep this file pinned so every message has these instructions available.
- In GitHub/Copilot chat on the web: upload or reference the file path; ask the assistant to read it from the workspace root.

## Environment variables
Create a local `.env` (don’t commit secrets to public repos):

SUPABASE_URL=https://unveoqnlqnobufhublyw.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMTcyNzYsImV4cCI6MjA3MDU5MzI3Nn0.g93OsXDpO3V9DToU7s-Z3SwBBnB84rBv0JMv-idgSME
# Optional scope for CLI
SITE_ID=

## Troubleshooting
- Tasks not appearing? Check RLS on `project_issues` and ensure `SITE_ID` is used consistently in the CLI.
- Right-click add not saving? Confirm Supabase is initialized and there are no network or auth errors.
- Empty table on load? If `ctx.site_id` is missing, the page renders from cache only after a right-click add; otherwise it loads via Supabase.
