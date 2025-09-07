#!/usr/bin/env node
/**
 * Simple Tasks CLI for Project Management issues (project_issues table)
 *
 * Commands:
 *   node scripts/tasks-cli.mjs list                # list tasks with numbers
 *   node scripts/tasks-cli.mjs show 4              # show full details for task #4
 *   node scripts/tasks-cli.mjs complete 4          # mark task #4 as completed (status=closed)
 *   node scripts/tasks-cli.mjs reopen 4            # mark task #4 as open (status=open)
 *   node scripts/tasks-cli.mjs export [file]       # export tasks to JSON for chat context
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY env vars.');
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });

async function authenticateIfNeeded() {
  const email = process.env.SUPABASE_EMAIL;
  const password = process.env.SUPABASE_PASSWORD;
  if (!email || !password) return;
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    console.error('Auth failed:', error.message || error);
    process.exit(1);
  }
}

function formatDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function toHumanType(t) {
  if (t === 'bug') return 'Bug fix';
  if (t === 'feature') return 'New idea';
  return t || '';
}

function splitNotes(description = '') {
  const idx = description.indexOf('\nNotes:');
  if (idx === -1) return { base: description, notes: '' };
  return { base: description.substring(0, idx).trim(), notes: description.substring(idx + 7).trim() };
}

async function fetchTasks(siteId = process.env.SITE_ID) {
  let q = supabase.from('project_issues').select('*').order('created_at', { ascending: false });
  if (siteId) q = q.eq('site_id', siteId);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

async function list() {
  await authenticateIfNeeded();
  const tasks = await fetchTasks();
  if (!tasks.length) {
    console.log('No tasks found.');
    return;
  }
  tasks.forEach((t, i) => {
    const n = i + 1;
    const { base, notes } = splitNotes(t.description || '');
    console.log(`#${n} ${t.status === 'closed' ? '✅' : '📝'} [${toHumanType(t.type)}] ${t.title}`);
    if (notes) console.log(`   Comment: ${notes}`);
    console.log(`   Page: ${t.page || '-'}${t.element_selector ? ` • Selector: ${t.element_selector}` : ''}`);
    console.log(`   Created: ${formatDate(t.created_at)}\n`);
  });
}

async function byNumber(n) {
  const tasks = await fetchTasks();
  const idx = Number(n) - 1;
  if (isNaN(idx) || idx < 0 || idx >= tasks.length) throw new Error(`Invalid task number: ${n}`);
  return { task: tasks[idx], index: idx, all: tasks };
}

async function show(n) {
  await authenticateIfNeeded();
  const { task } = await byNumber(n);
  const { base, notes } = splitNotes(task.description || '');
  console.log(JSON.stringify({
    number: Number(n),
    id: task.id,
    status: task.status,
    type: toHumanType(task.type),
    title: task.title,
    base,
    comment: notes,
    page: task.page,
    selector: task.element_selector,
    created_at: task.created_at
  }, null, 2));
}

async function complete(n) {
  await authenticateIfNeeded();
  const { task } = await byNumber(n);
  const { error } = await supabase.from('project_issues').update({ status: 'closed' }).eq('id', task.id);
  if (error) throw error;
  console.log(`Marked #${n} as completed.`);
}

async function reopen(n) {
  await authenticateIfNeeded();
  const { task } = await byNumber(n);
  const { error } = await supabase.from('project_issues').update({ status: 'open' }).eq('id', task.id);
  if (error) throw error;
  console.log(`Reopened #${n}.`);
}

async function exportTasks(file = 'chat-context-tasks.json') {
  await authenticateIfNeeded();
  const tasks = await fetchTasks();
  const mapped = tasks.map((t, i) => {
    const { base, notes } = splitNotes(t.description || '');
    return {
      number: i + 1,
      id: t.id,
      status: t.status,
      type: toHumanType(t.type),
      title: t.title,
      comment: notes,
      base,
      page: t.page,
      selector: t.element_selector,
      created_at: formatDate(t.created_at)
    };
  });
  // Build a richer quick_export-style payload so the exported file is self-describing
  const quickExport = {
    quick_export: {
      data: {
        // include the full raw project_issues rows so the chat or tool has current state
        'public.project_issues': tasks
      },
      // minimal metadata to help the assistant/human know where to look first
      files: {
        // prefer the full Supabase quick_export snapshot that was provided in the repo
        assistant_context: 'SupabaseInfo.txt',
        this_script: 'scripts/tasks-cli.mjs',
        other_guides: ['ASSISTANT_CONTEXT.md', 'prompt.txt', 'OpenAI_Integration_Guide.md']
      },
      instructions: {
        primary: 'Please consult the Supabase quick_export snapshot file specified in files.assistant_context (SupabaseInfo.txt) first for current DB data and schema information.',
        secondary: 'If you still need higher-level app guidance or conventions, consult ASSISTANT_CONTEXT.md next.',
        fallback: 'If more live database/schema context is required beyond the exported snapshot, use the Supabase CLI locally: `supabase login`, `supabase link --project-ref <ref>`, `supabase db pull`, and `supabase gen types typescript --linked > supabase.types.ts`.'
      }
    }
  };

  fs.writeFileSync(file, JSON.stringify(quickExport, null, 2));
  console.log(`Exported ${mapped.length} tasks (as quick_export.public.project_issues) to ${file}`);
}

const [,, cmd, arg] = process.argv;
(async () => {
  try {
    switch (cmd) {
      case 'list':
        await list();
        break;
      case 'show':
        await show(arg);
        break;
      case 'complete':
        await complete(arg);
        break;
      case 'reopen':
        await reopen(arg);
        break;
      case 'export':
        await exportTasks(arg);
        break;
      default:
        console.log('Usage:');
        console.log('  node scripts/tasks-cli.mjs list');
        console.log('  node scripts/tasks-cli.mjs show <num>');
        console.log('  node scripts/tasks-cli.mjs complete <num>');
        console.log('  node scripts/tasks-cli.mjs reopen <num>');
        console.log('  node scripts/tasks-cli.mjs export [file]');
    }
  } catch (e) {
    console.error(e.message || e);
    process.exit(1);
  }
})();
