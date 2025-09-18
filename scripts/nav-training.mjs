import 'dotenv/config';
import { chromium } from 'playwright';

async function run() {
  const base = process.env.BASE_URL || 'http://127.0.0.1:5500';
  const user = process.env.TEST_USER;
  const pass = process.env.TEST_PASS;

  const browser = await chromium.launch({ headless: false });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  page.on('console', msg => {
    try {
      console.log('[page]', msg.type(), msg.text());
    } catch {}
  });

  const target = new URL('index.html', base).toString();
  console.log('Opening', target);
  await page.goto(target, { waitUntil: 'load' });

  // If nav not present shortly, try explicit login flow on Home.html
  const navReady = page.locator('nav button[data-section]');
  const navAppeared = await navReady.first().isVisible().catch(() => false);
  if (!navAppeared) {
    const onHome = /Home\.html/i.test(page.url());
    const hasSignin = await page.locator('#signin-form').first().isVisible().catch(() => false);
    if (user && pass) {
      console.log('Attempting login via Home.html with TEST_USER/TEST_PASS');
      if (!onHome) {
        await page.goto(new URL('Home.html', base).toString(), { waitUntil: 'load' });
      }
      await page.fill('#email', user);
      await page.fill('#password', pass);
      await page.locator('#signin-form button[type="submit"]').click();
      // Wait for redirect to admin dashboard
      await page.waitForURL(/index\.html(\?.*)?$/i, { timeout: 20000 }).catch(() => {});
    } else if (hasSignin) {
      console.warn('No TEST_USER/TEST_PASS in env; cannot auto-login.');
    }
  }

  // Wait for a known logged-in indicator if possible (admin overlay hidden)
  await page.locator('#auth-wrapper').first().waitFor({ state: 'hidden', timeout: 20000 }).catch(() => {});
  // Also wait until the sidebar nav exists
  await page.locator('nav button[data-section]').first().waitFor({ state: 'visible', timeout: 20000 }).catch(() => {});

  // Expand Checks & Audits group if needed, then click Mandatory Training
  const trainingBtn = page.locator('button[data-section="training"]');
  if (!(await trainingBtn.isVisible().catch(() => false))) {
    const toggleChecks = page.locator('#toggle-checks');
    if (await toggleChecks.count()) {
      await toggleChecks.click();
      await trainingBtn.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    }
  }
  console.log('Navigating to Mandatory Training...');
  await trainingBtn.click({ timeout: 15000 });

  // Wait for training view to be active/visible
  const trainingView = page.locator('#view-training');
  await trainingView.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
  await page.waitForSelector('#view-training .h1', { timeout: 5000 }).catch(() => {});

  // Inspect matrix status (wait until rendered or error)
  const tbody = page.locator('#training-tbody');
  await tbody.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
  // Wait until loading message disappears or a known content/error appears
  await page.waitForFunction(() => {
    const tb = document.querySelector('#training-tbody');
    const hdr = document.querySelector('#training-headers');
    if (!tb || !hdr) return false;
    const txt = tb.textContent || '';
    const hasCols = (hdr.querySelectorAll('th').length || 0) > 1; // more than just Staff Member
    const hasCells = !!tb.querySelector('.training-cell');
    return hasCols && (hasCells || !/Loading training matrix/i.test(txt));
  }, null, { timeout: 30000 }).catch(() => {});
  const tbodyText = await tbody.innerText().catch(() => '');
  const headersHtml = await page.locator('#training-headers').innerHTML().catch(() => '');
  console.log('Training tbody text (first 200 chars):', (tbodyText || '').slice(0, 200));
  console.log('Training headers length:', headersHtml.length);

  // Snapshot of trainingData lengths
  const lengths = await page.evaluate(() => ({
    staff: (window.trainingData && window.trainingData.staff && window.trainingData.staff.length) || 0,
    types: (window.trainingData && window.trainingData.types && window.trainingData.types.length) || 0,
    records: (window.trainingData && window.trainingData.records && window.trainingData.records.length) || 0,
    hasCtx: !!window.ctx,
    site_id: window.ctx && window.ctx.site_id,
  }));
  console.log('trainingData lengths + ctx:', lengths);

  // When ctx is ready, force refresh from DB and print lengths again
  await page.waitForFunction(() => !!(window.ctx && window.ctx.site_id), null, { timeout: 20000 }).catch(() => {});
  await page.evaluate(() => window.loadTrainingMatrix && window.loadTrainingMatrix());
  await page.waitForTimeout(1000);
  const lengths2 = await page.evaluate(() => ({
    staff: (window.trainingData && window.trainingData.staff && window.trainingData.staff.length) || 0,
    types: (window.trainingData && window.trainingData.types && window.trainingData.types.length) || 0,
    records: (window.trainingData && window.trainingData.records && window.trainingData.records.length) || 0,
    site_id: window.ctx && window.ctx.site_id,
  }));
  console.log('after ctx refresh, trainingData lengths:', lengths2);

  // Take a screenshot for verification
  try {
    await page.screenshot({ path: 'training.png', fullPage: true });
    console.log('Saved screenshot to training.png');
  } catch (e) {
    console.warn('Failed to take screenshot:', e);
  }

  console.log('At Mandatory Training. Keeping browser open for 5 seconds...');
  await page.waitForTimeout(5000);
  await browser.close();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
