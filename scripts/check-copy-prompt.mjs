#!/usr/bin/env node
import { chromium } from 'playwright';

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:5500';
const EMAIL = process.env.CHECKLOOPS_EMAIL || 'ben.howard@stoke.nhs.uk';
const PASSWORD = process.env.CHECKLOOPS_PASSWORD || 'Hello1!';

function sleep(ms){ return new Promise(r=>setTimeout(r, ms)); }

async function run(){
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  page.setDefaultTimeout(30000);

  console.log('Navigating to', BASE_URL);
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });

  // Login flow: support both index.html and Home.html variants
  const onIndex = await page.locator('#auth-wrapper').count();
  const onHome = await page.locator('#signin-form').count();
  if (onIndex) {
    await page.waitForSelector('#auth-wrapper', { state: 'visible' });
    await page.fill('#auth-email', EMAIL);
    await page.fill('#auth-password', PASSWORD);
    await Promise.all([
      page.click('#auth-form button[type="submit"]'),
      page.waitForSelector('#auth-wrapper', { state: 'hidden' })
    ]);
  } else if (onHome) {
    await page.waitForSelector('#signin-form', { state: 'visible' });
    await page.fill('#email', EMAIL);
    await page.fill('#password', PASSWORD);
    await Promise.all([
      page.click('#signin-form button[type="submit"]'),
      // Home.html redirects to index.html after login
      page.waitForURL(/index\.html|\/($|\?)/, { timeout: 45000 })
    ]);
    // On index.html, auth-wrapper should hide soon after
    await page.waitForSelector('#auth-wrapper', { state: 'hidden', timeout: 20000 }).catch(()=>{});
  } else {
    throw new Error('Unknown login page layout.');
  }

  // Navigate to Project Management section
  await page.click('button[data-section="project-management"]');
  await page.waitForSelector('#view-project-management.active');

  // Ensure at least one task exists; if not, create one via UI
  let hasCopyBtn = await page.locator('.btn-copy-copilot').count();
  if (!hasCopyBtn) {
    console.log('No tasks found, trying to create one via UI...');
    try {
      await page.click('#btn-add-task');
      await page.waitForSelector('#project-task-form');
      await page.fill('#task-title', 'Test: Verify copy prompt text');
      await page.fill('#task-description', 'Ensure the copied prompt matches the new format.');
      await page.selectOption('#task-type', 'bug');
      await page.click('#project-task-form button[type="submit"]');
      await page.waitForSelector('#project-task-modal', { state: 'hidden', timeout: 15000 });
      await page.waitForSelector('.btn-copy-copilot', { timeout: 15000 });
      hasCopyBtn = await page.locator('.btn-copy-copilot').count();
    } catch {
      // fall back to synthetic task if UI creation fails
      hasCopyBtn = 0;
    }
  }

  if (!hasCopyBtn) {
    console.log('Still no tasks; injecting a synthetic task and button for verification...');
    await page.evaluate(() => {
      // Build a minimal fake task and dispatch a click on a fake button
      const fake = {
        id: 'test-001',
        status: 'open',
        type: 'bug',
        title: 'Synthetic copy-prompt test task',
        description: 'Element: .fake\nText: Verify copy prompt contents',
        page: 'project-management',
        element_selector: '.fake',
        created_at: new Date().toISOString(),
        created_by: 'tester'
      };
      try { projectTasks = [fake]; } catch {}
      const btn = document.createElement('button');
      btn.className = 'btn-copy-copilot';
      btn.setAttribute('data-task-id', fake.id);
      document.body.appendChild(btn);
    });
  }

  // Build the prompt string in-page (more reliable than clipboard reads in headless)
  const copied = await page.evaluate(() => {
    function sampleTask(){
      return {
        id: 'test-001',
        status: 'open',
        type: 'bug',
        title: 'Synthetic copy-prompt test task',
        description: 'Element: .fake\nText: Verify copy prompt contents',
        page: 'project-management',
        element_selector: '.fake',
        created_at: new Date().toISOString(),
        created_by: 'tester'
      };
    }
    try {
      // Prefer real task if present
      const realBtn = document.querySelector('.btn-copy-copilot');
      if (realBtn && typeof buildCopilotPrompt === 'function'){
        const id = realBtn.getAttribute('data-task-id');
        if (id && Array.isArray(projectTasks)){
          const t = projectTasks.find(tt => String(tt.id) === String(id));
          if (t) return buildCopilotPrompt(t);
        }
      }
    } catch {}
    // Fallback to synthetic task
    return (typeof buildCopilotPrompt === 'function') ? buildCopilotPrompt(sampleTask()) : null;
  });

  if (!copied) throw new Error('Could not generate prompt text in page context.');

  console.log('Prompt sample (first 200 chars):', copied.slice(0,200).replace(/\n/g,' '));

  const checks = [
    'Hi — please do this:',
    'Use `SupabaseInfo.txt` (in this repo) to understand how the tables are laid out.',
    'Only if you REALLY need to dig deeper or make amendments to Supabase, use the Supabase CLI.',
    'Open http://127.0.0.1:5500',
    'Log in with email: ben.howard@stoke.nhs.uk',
    'Password: Hello1!'
  ];

  const missing = checks.filter(s => !copied.includes(s));
  if (missing.length){
    throw new Error('Prompt text missing expected phrases: '+missing.join(' | '));
  }

  console.log('✅ Copy prompt content looks correct.');
  await browser.close();
}

run().catch(async (err)=>{
  console.error('❌ Test failed:', err.message || err);
  process.exit(1);
});
