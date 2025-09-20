import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';

async function testFinalWelcomeFlow() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 400
  });

  const page = await browser.newPage();

  // Capture console messages
  page.on('console', msg => {
    const text = msg.text();
    if (!text.includes('Environment:') && !text.includes('Base URL:') &&
        !text.includes('Password Redirect:') && !text.includes('Failed to load resource')) {
      console.log('[Browser]', text);
    }
  });

  try {
    console.log('=== FINAL COMPLETE WELCOME FLOW TEST ===\n');

    // 1. Login
    console.log('1. Logging in...');
    await page.goto('http://127.0.0.1:5500/Home.html');
    await page.waitForTimeout(1000);
    await page.fill('#email', 'benhowardmagic@hotmail.com');
    await page.fill('input[type="password"]', 'Hello1!');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(2000);

    // Navigate to staff portal if needed
    const currentUrl = page.url();
    if (currentUrl.includes('admin-dashboard.html')) {
      console.log('   On admin dashboard, going to staff portal...');
      await page.goto('http://127.0.0.1:5500/staff.html');
      await page.waitForTimeout(1500);
    }

    // 2. Go to Welcome page
    console.log('\n2. Opening Welcome page...');
    await page.click('button[data-section="welcome"]');
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'test_1_welcome_with_nav.png' });

    // Step 1: Nickname
    const nicknameField = await page.locator('#nickname');
    if (await nicknameField.isVisible()) {
      console.log('\n3. Step 1: Setting nickname...');
      await nicknameField.clear();
      const uniqueNickname = 'Final_' + Date.now();
      await nicknameField.fill(uniqueNickname);
      console.log('   Nickname set to:', uniqueNickname);

      const getStartedBtn = await page.locator('button:has-text("Get started")');
      if (await getStartedBtn.isVisible()) {
        await getStartedBtn.click();
        console.log('   Clicked Get Started');
        await page.waitForTimeout(3000);
      }
    }

    // Step 2: Role and Team - using button grids
    console.log('\n4. Step 2: Selecting role and team...');

    // Wait for content to load
    await page.waitForTimeout(2000);

    // Try to select role from grid
    const roleButtons = await page.locator('#role-grid button, #role-grid label');
    const roleCount = await roleButtons.count();
    console.log('   Found', roleCount, 'role options');

    if (roleCount > 0) {
      // Click the second role option (usually Nurse)
      if (roleCount > 1) {
        await roleButtons.nth(1).click();
        console.log('   Selected second role');
      } else {
        await roleButtons.first().click();
        console.log('   Selected first role');
      }
    }

    // Select team
    await page.waitForTimeout(1000);
    const teamButtons = await page.locator('#team-grid button, #team-grid label');
    const teamCount = await teamButtons.count();
    console.log('   Found', teamCount, 'team options');

    if (teamCount > 0) {
      await teamButtons.first().click();
      console.log('   Selected first team');
    }

    await page.screenshot({ path: 'test_2_before_finish.png' });

    // Continue to avatar
    const toAvatarBtn = await page.locator('#to-avatar-btn');
    if (await toAvatarBtn.isVisible()) {
      await toAvatarBtn.click();
      console.log('   Clicked Continue to Avatar');
      await page.waitForTimeout(3000);
    }

    // Step 3: Avatar
    const avatarRandomize = await page.locator('#avatar-randomize');
    if (await avatarRandomize.isVisible()) {
      console.log('\n5. Step 3: Creating avatar...');

      // Click randomize multiple times
      for (let i = 0; i < 3; i++) {
        await avatarRandomize.click();
        await page.waitForTimeout(800);
      }
      console.log('   Avatar randomized');

      // Scroll to see continue button
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(1000);

      await page.screenshot({ path: 'test_avatar_changed.png' });

      // Click finish avatar
      const finishAvatarBtn = await page.locator('#finish-avatar-btn');
      if (await finishAvatarBtn.isVisible()) {
        await finishAvatarBtn.click();
        console.log('   Clicked Finish Avatar');
        await page.waitForTimeout(3000);
      }
    }

    // Step 4: Working Hours
    const mondayInput = await page.locator('#monday-val');
    if (await mondayInput.isVisible()) {
      console.log('\n6. Step 4: Setting working hours...');

      // Set working hours for each day
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
      for (const day of days) {
        const input = await page.locator(`#${day}-val`);
        if (await input.count() > 0) {
          await input.clear();
          await input.fill('08:00');
          console.log(`   ${day}: 8 hours`);
        }
      }

      console.log('   Total: 40 hours/week');
      await page.screenshot({ path: 'test_working_hours.png' });

      // Complete setup
      const completeBtn = await page.locator('#complete-setup');
      if (await completeBtn.isVisible()) {
        console.log('\n7. Completing setup...');
        await completeBtn.click();
        console.log('   Clicked Complete Setup');
        await page.waitForTimeout(5000);
      }
    }

    // Check completion
    const step5Visible = await page.isVisible('#step5');
    if (step5Visible) {
      console.log('\n✅ WELCOME PROCESS COMPLETED!');
      await page.screenshot({ path: 'test_welcome_fixed.png' });
      await page.waitForTimeout(3000);
    } else {
      console.log('\n⚠️ Did not reach completion screen');
      await page.screenshot({ path: 'test_error_final.png' });
    }

    // 8. Verify Holiday Page
    console.log('\n8. Checking My Holidays page...');
    await page.goto('http://127.0.0.1:5500/my-holidays.html');
    await page.waitForTimeout(3000);

    const totalAllowanceElement = await page.locator('#total-allowance');
    if (await totalAllowanceElement.count() > 0) {
      const totalAllowance = await totalAllowanceElement.textContent();
      const unit = await page.textContent('#allowance-unit');
      console.log('   Total Allowance:', totalAllowance, unit);

      if (totalAllowance === '400' && unit === 'hours') {
        console.log('   ✅ CALCULATION CORRECT: 40 hours/week * 10 = 400 hours/year');
      } else if (totalAllowance === '0') {
        console.log('   ⚠️ Allowance is 0 - data may not have populated yet');
      }

      await page.screenshot({ path: 'test_holidays_after_welcome.png' });
    }

    // 9. Verify Database Data
    console.log('\n9. Verifying database data...');
    const supabaseUrl = 'https://unveoqnlqnobufhublyw.supabase.co';
    const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMTcyNzYsImV4cCI6MjA3MDU5MzI3Nn0.g93OsXDpO3V9DToU7s-Z3SwBBnB84rBv0JMv-idgSME';
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data: { user } } = await supabase.auth.signInWithPassword({
      email: 'benhowardmagic@hotmail.com',
      password: 'Hello1!'
    });

    if (user) {
      // Check all holiday tables
      const { data: holidayProfile } = await supabase
        .from('1_staff_holiday_profiles')
        .select('*')
        .eq('email', user.email)
        .maybeSingle();

      if (holidayProfile) {
        console.log('   ✅ Holiday Profile exists');
        console.log('   - ID:', holidayProfile.id);
        console.log('   - Avatar URL:', holidayProfile.avatar_url ? 'Set' : 'Not set');

        // Check entitlement
        const { data: entitlement } = await supabase
          .from('2_staff_entitlements')
          .select('*')
          .eq('staff_profile_id', holidayProfile.id)
          .eq('year', new Date().getFullYear())
          .maybeSingle();

        if (entitlement) {
          console.log('   ✅ Entitlement exists');
          console.log('   - Weekly Hours:', entitlement.weekly_hours);
          console.log('   - Multiplier:', entitlement.holiday_multiplier);
          console.log('   - Calculated Hours:', entitlement.calculated_hours);
          console.log('   - Annual Hours:', entitlement.annual_hours);
        } else {
          console.log('   ❌ No entitlement found');
        }
      } else {
        console.log('   ❌ No holiday profile found');
      }

      // Check working pattern
      const { data: workingPattern } = await supabase
        .from('3_staff_working_patterns')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (workingPattern) {
        console.log('   ✅ Working Pattern exists');
        const totalWeekly =
          parseFloat(workingPattern.monday_hours || 0) +
          parseFloat(workingPattern.tuesday_hours || 0) +
          parseFloat(workingPattern.wednesday_hours || 0) +
          parseFloat(workingPattern.thursday_hours || 0) +
          parseFloat(workingPattern.friday_hours || 0);
        console.log('   - Total Weekly:', totalWeekly, 'hours');
      } else {
        console.log('   ❌ No working pattern found');
      }

      // Check profile link
      if (holidayProfile?.id) {
        const { data: link } = await supabase
          .from('5_staff_profile_user_links')
          .select('*')
          .eq('user_id', user.id)
          .eq('staff_profile_id', holidayProfile.id)
          .maybeSingle();

        if (link) {
          console.log('   ✅ Profile Link exists');
        } else {
          console.log('   ❌ No profile link found');
        }
      }
    }

    console.log('\n=== TEST COMPLETE ===');

  } catch (error) {
    console.error('\n❌ Test error:', error);
    await page.screenshot({ path: 'test_error.png' });
  } finally {
    await page.waitForTimeout(3000);
    await browser.close();
  }
}

testFinalWelcomeFlow().catch(console.error);
