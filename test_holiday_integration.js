import { chromium } from 'playwright';

async function testHolidayIntegration() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('Testing holiday system integration...');

  // 1. Login as admin
  console.log('1. Logging in as admin...');
  await page.goto('http://127.0.0.1:58156/admin-login.html');
  await page.waitForTimeout(1000);

  await page.fill('#email', 'ben.howard@stoke.nhs.uk');
  await page.fill('input[type="password"]', 'Hello1!');
  await page.click('button:has-text("Sign In")');

  await page.waitForTimeout(3000);

  // 2. Navigate to admin dashboard
  console.log('2. Navigating to admin dashboard...');
  await page.goto('http://127.0.0.1:58156/admin-dashboard.html');
  await page.waitForTimeout(2000);

  // 3. Click on Holidays section
  console.log('3. Opening Holidays section...');
  const holidaysButton = await page.locator('button[data-section="holidays"]');
  if (await holidaysButton.isVisible()) {
    await holidaysButton.click();
    await page.waitForTimeout(2000);
  } else {
    console.log('Holidays button not found in sidebar');
  }

  // 4. Take screenshot of holidays section
  console.log('4. Taking screenshot of holiday management...');
  await page.screenshot({
    path: 'test_holiday_admin.png',
    fullPage: true
  });

  // 5. Check if entitlement cards are loaded
  const cardsContainer = await page.locator('#entitlements-cards-container');
  if (await cardsContainer.isVisible()) {
    console.log('✓ Entitlement cards container is visible');
  } else {
    console.log('✗ Entitlement cards container not visible');
  }

  // 6. Check if requests list is visible
  const requestsList = await page.locator('#requests-list');
  if (await requestsList.isVisible()) {
    console.log('✓ Holiday requests list is visible');
  } else {
    console.log('✗ Holiday requests list not visible');
  }

  // 7. Test staff my-holidays page
  console.log('7. Testing staff my-holidays page...');
  await page.goto('http://127.0.0.1:58156/my-holidays.html');
  await page.waitForTimeout(2000);

  // 8. Take screenshot of my-holidays
  await page.screenshot({
    path: 'test_my_holidays.png',
    fullPage: true
  });

  // 9. Check if holiday stats are displayed
  const totalAllowance = await page.locator('#total-allowance');
  if (await totalAllowance.isVisible()) {
    const value = await totalAllowance.textContent();
    console.log(`✓ Holiday allowance displayed: ${value}`);
  } else {
    console.log('✗ Holiday allowance not visible');
  }

  console.log('Test completed!');
  await page.waitForTimeout(3000);
  await browser.close();
}

testHolidayIntegration().catch(console.error);