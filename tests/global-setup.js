import 'dotenv/config';
import { chromium } from 'playwright';

export default async function globalSetup() {
  const baseURL = process.env.BASE_URL || 'http://localhost:5173';
  const user = process.env.TEST_USER;
  const pass = process.env.TEST_PASS;

  if (!user || !pass) {
    throw new Error('Missing TEST_USER or TEST_PASS in environment. Create a .env with these values.');
  }

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Go to the sign-in page
  const loginUrl = new URL('Home.html', baseURL).toString();
  await page.goto(loginUrl, { waitUntil: 'load' });

  // Fill and submit the login form on Home.html
  await page.waitForSelector('#signin-form', { state: 'visible' });
  await page.fill('#email', user);
  await page.fill('#password', pass);
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'load' }),
    page.click('#signin-form button[type="submit"]'),
  ]);

  // Expect redirect to admin dashboard (index.html) and authenticated UI visible
  try {
    await page.waitForURL(/index\.html(\?.*)?$/i, { timeout: 15000 });
  } catch (_) {
    // If not redirected by URL, the app might still be at '/' which serves index.html via dev server
  }

  // Wait for auth overlay to disappear and a logged-in indicator to show
  await page.waitForSelector('#auth-wrapper', { state: 'hidden', timeout: 20000 }).catch(() => {});
  await page.waitForSelector('#email-pill', { state: 'visible', timeout: 20000 });

  // Save authenticated state
  await context.storageState({ path: 'storageState.json' });
  await browser.close();
}

