import 'dotenv/config';
import { defineConfig } from '@playwright/test';

// Use the provided BASE_URL (your running local server) or default to Vite preview
const baseURL = process.env.BASE_URL || 'http://127.0.0.1:50253';

// If we're pointing at an external server (anything not the Vite default),
// skip starting the dev server and just reuse the running one.
const useExternalServer = !!process.env.BASE_URL && !process.env.BASE_URL.includes('localhost:5173');

export default defineConfig({
  testDir: 'tests',
  timeout: 30 * 1000,
  fullyParallel: true,
  ...(useExternalServer ? {} : { globalSetup: './tests/global-setup.js' }),
  // Only start a web server if we're not told to use an existing one
  ...(useExternalServer
    ? {}
    : {
        webServer: {
          command: 'npm run dev',
          url: baseURL,
          reuseExistingServer: true,
          timeout: 120000,
        },
      }),
  use: {
    baseURL,
    // Do not preload storageState; tests handle auth inline
    headless: true,
    viewport: { width: 1280, height: 800 },
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
});
