// @ts-check
import { test, expect } from '@playwright/test';
import { getAuthState, waitForPageLoad, takeScreenshot } from '../utils/test-helpers.js';

const baseURL = process.env.BASE_URL || 'http://127.0.0.1:50253';

test.describe('Admin Dashboard', () => {
  test('admin login and invite modal opens', async ({ browser }) => {
    const context = await browser.newContext({ storageState: getAuthState('admin') });
    const page = await context.newPage();

    // Go to admin portal
    await page.goto(`${baseURL}/admin-login.html`);
    await waitForPageLoad(page);

    // If still on login (state not picked up), login explicitly
    if (page.url().endsWith('admin-login.html')) {
      const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'benhowardmagic@hotmail.com';
      const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Hello1!';
      await page.fill('#email', ADMIN_EMAIL);
      await page.fill('#password', ADMIN_PASSWORD);
      await Promise.all([
        page.click('#submit-btn, button[type="submit"]'),
        page.waitForNavigation({ waitUntil: 'networkidle' })
      ]);
    }

    await expect(page).toHaveURL(new RegExp('admin-dashboard\\.html$'));
    await takeScreenshot(page, 'admin-dashboard');

    // Open Invite User modal if available
    const inviteBtn = page.locator('#btn-invite-user');
    if (await inviteBtn.count()) {
      await inviteBtn.click();
      const modal = page.locator('#invite-user-modal');
      await expect(modal).toBeVisible();
      await takeScreenshot(page, 'admin-invite-modal');

      // Check core fields exist
      await expect(page.locator('#invite-full-name, input[name="full_name"]')).toHaveCount(1);
      await expect(page.locator('#invite-email, input[type="email"]')).toHaveCount(1);
      await expect(page.locator('#invite-role, select[name="role"]')).toHaveCount(1);

      // Close modal
      const closeBtn = page.locator('#invite-user-modal-close, .modal-close');
      if (await closeBtn.count()) await closeBtn.click();
    }
  });
});

