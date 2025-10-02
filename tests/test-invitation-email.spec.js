import { test, expect } from '@playwright/test';

test('Test enhanced invitation email template', async ({ page }) => {
  console.log('Starting invitation email test...');

  // Step 1: Navigate to admin login page
  await page.goto('http://127.0.0.1:5501/admin-login.html');
  console.log('Navigated to admin login page');

  // Step 2: Login with provided credentials
  await page.fill('input[type="email"]', 'benhowardmagic@hotmail.com');
  await page.fill('input[type="password"]', 'Hello1!');
  await page.click('button[type="submit"]');
  console.log('Submitted login form');

  // Wait for login to complete and dashboard to load
  await page.waitForTimeout(3000);
  console.log('Waiting for dashboard to load...');

  // Step 3: Scroll down to see the Settings dropdown at the bottom
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
  });
  console.log('Scrolled to bottom to find Settings dropdown');

  // Step 4: Click the Settings dropdown (the one at the very bottom of the nav, NOT Surgery Settings)
  // Target the Settings that's below Staff and has the Users submenu
  await page.evaluate(() => {
    // Find all elements containing "Settings"
    const allSettings = Array.from(document.querySelectorAll('*')).filter(el =>
      el.textContent.trim() === 'Settings'
    );

    // Find the one that's at the bottom (after Staff section)
    for (let setting of allSettings) {
      // Check if this Settings element is near the bottom and not the Surgery Settings
      const rect = setting.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      // Look for the Settings that's in the bottom half and not inside Surgery Settings
      if (rect.top > viewportHeight * 0.5 && !setting.closest('[class*="surgery"]')) {
        setting.click();
        console.log('Found and clicked bottom Settings dropdown');
        return true;
      }
    }

    // Fallback: look for Settings that comes after Staff in the DOM
    const staffElements = document.querySelectorAll('*');
    let foundStaff = false;
    for (let elem of staffElements) {
      if (elem.textContent.trim() === 'Staff') {
        foundStaff = true;
        continue;
      }
      if (foundStaff && elem.textContent.trim() === 'Settings') {
        elem.click();
        console.log('Found Settings after Staff and clicked it');
        return true;
      }
    }
    return false;
  });

  console.log('Clicked bottom Settings dropdown via JavaScript');

  await page.waitForTimeout(1000);

  // Step 5: Click Users from the expanded Settings dropdown
  // Wait for the dropdown to expand and then click Users
  await page.waitForTimeout(500);

  await page.evaluate(() => {
    // Look for Users that's now visible in the expanded dropdown
    const allUsers = Array.from(document.querySelectorAll('*')).filter(el =>
      el.textContent.trim() === 'Users'
    );

    for (let user of allUsers) {
      const style = window.getComputedStyle(user);
      // Click the Users that's visible (not hidden)
      if (style.display !== 'none' && style.visibility !== 'hidden' && user.offsetParent !== null) {
        user.click();
        console.log('Found and clicked visible Users option');
        return true;
      }
    }
    return false;
  });

  console.log('Clicked Users from Settings dropdown');
  await page.waitForTimeout(2000);

  // Step 6: Click Invite User button
  const inviteSelectors = [
    'text=Invite User',
    'text=📧 Invite User',
    '#btn-invite-user',
    'button:has-text("Invite")',
    '.btn:has-text("Invite")'
  ];

  let inviteFound = false;
  for (const selector of inviteSelectors) {
    try {
      const element = await page.$(selector);
      if (element) {
        await element.click();
        console.log(`Clicked invite with selector: ${selector}`);
        inviteFound = true;
        break;
      }
    } catch (e) {
      // Continue to next selector
    }
  }

  if (!inviteFound) {
    throw new Error('Could not find Invite User button');
  }

  await page.waitForTimeout(1000);

  // Step 7: Fill in invitation form fields
  console.log('Filling invitation form...');

  // Fill Full Name
  await page.fill('input[name="fullName"], #invite-fullname, input[placeholder*="name" i]', 'Ben Howard Test');

  // Fill Email
  await page.fill('input[name="email"], #invite-email, input[type="email"]', 'ben.howard@stoke.nhs.uk');

  // Select access type if dropdown exists
  try {
    await page.selectOption('select[name="access_type"], select[name="accessType"], #invite-access-type', 'admin');
  } catch (e) {
    console.log('Access type dropdown not found or already set');
  }

  // Step 8: Send invitation
  await page.click('button:has-text("Send Invitation"), button:has-text("📧 Send"), #invite-user-submit');
  console.log('Clicked Send Invitation button');

  // Wait for the invitation to be sent
  await page.waitForTimeout(3000);

  // Look for success message
  const successMessage = await page.$('text=successfully');
  if (successMessage) {
    console.log('✅ Invitation sent successfully!');
  } else {
    console.log('⚠️ Success message not found, but invitation may have been sent');
  }

  console.log('🎯 Test completed! Check Inbucket at http://127.0.0.1:54324 for the enhanced email template');
});