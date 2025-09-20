import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';

async function testHolidaySystemSimplified() {
  // Initialize Supabase client
  const supabaseUrl = 'https://swnkxrvqjsexdqfpptrv.supabase.co';
  const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3bmt4cnZxanNleGRxZnBwdHJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM4NTgxNzAsImV4cCI6MjA0OTQzNDE3MH0.8L4e9vdBbZ5snJxJPvUrPRQBkhtZvoWqKvYwtk-2jT0';
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const browser = await chromium.launch({
    headless: false,
    slowMo: 200
  });

  const page = await browser.newPage();

  // Capture console messages
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('saved') || text.includes('error') || text.includes('profile') || text.includes('holiday')) {
      console.log('[Browser]', text);
    }
  });

  try {
    console.log('=== HOLIDAY SYSTEM VERIFICATION TEST ===\n');

    // 1. Login and authenticate
    console.log('1. Authenticating with Supabase...');
    const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
      email: 'benhowardmagic@hotmail.com',
      password: 'Hello1!'
    });

    if (!user) {
      console.error('Authentication failed:', authError);
      return;
    }

    console.log('   ✅ Authenticated as:', user.email);

    // 2. Check current database state
    console.log('\n2. Checking current database state...');

    // Check 1_staff_holiday_profiles
    const { data: holidayProfile } = await supabase
      .from('1_staff_holiday_profiles')
      .select('*')
      .eq('email', user.email)
      .maybeSingle();

    if (holidayProfile) {
      console.log('\n   ✅ Holiday Profile EXISTS:');
      console.log('   - ID:', holidayProfile.id);
      console.log('   - Name:', holidayProfile.full_name);
      console.log('   - Role:', holidayProfile.role);
      console.log('   - Team:', holidayProfile.team_name);
      console.log('   - Avatar URL:', holidayProfile.avatar_url ? 'Set' : 'Not set');
      console.log('   - Is GP:', holidayProfile.is_gp);
    } else {
      console.log('   ❌ No holiday profile found - needs to be created');
    }

    // Check 2_staff_entitlements
    if (holidayProfile?.id) {
      const { data: entitlement } = await supabase
        .from('2_staff_entitlements')
        .select('*')
        .eq('staff_profile_id', holidayProfile.id)
        .eq('year', new Date().getFullYear())
        .maybeSingle();

      if (entitlement) {
        console.log('\n   ✅ Entitlement EXISTS:');
        console.log('   - Weekly Hours:', entitlement.weekly_hours);
        console.log('   - Holiday Multiplier:', entitlement.holiday_multiplier);
        console.log('   - Calculated Hours:', entitlement.calculated_hours);
        console.log('   - Annual Hours:', entitlement.annual_hours);
        console.log('   - Manual Override:', entitlement.manual_override);
      } else {
        console.log('   ❌ No entitlement found - needs to be created');
      }
    }

    // Check 3_staff_working_patterns
    const { data: workingPattern } = await supabase
      .from('3_staff_working_patterns')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (workingPattern) {
      console.log('\n   ✅ Working Pattern EXISTS:');
      const totalWeekly =
        parseFloat(workingPattern.monday_hours || 0) +
        parseFloat(workingPattern.tuesday_hours || 0) +
        parseFloat(workingPattern.wednesday_hours || 0) +
        parseFloat(workingPattern.thursday_hours || 0) +
        parseFloat(workingPattern.friday_hours || 0);
      console.log('   - Total Weekly:', totalWeekly, 'hours');
    } else {
      console.log('   ❌ No working pattern found - needs to be created');
    }

    // 3. Test My Holidays Page
    console.log('\n3. Testing My Holidays page...');
    await page.goto('http://127.0.0.1:5500/Home.html');
    await page.waitForTimeout(1000);
    await page.fill('#email', 'benhowardmagic@hotmail.com');
    await page.fill('input[type="password"]', 'Hello1!');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(2000);

    // Navigate directly to my-holidays
    await page.goto('http://127.0.0.1:5500/my-holidays.html');
    await page.waitForTimeout(3000);

    // Check if holiday data loads
    const totalAllowanceElement = await page.locator('#total-allowance');
    if (await totalAllowanceElement.count() > 0) {
      const totalAllowance = await totalAllowanceElement.textContent();
      const usedHolidays = await page.textContent('#used-holidays');
      const remainingHolidays = await page.textContent('#remaining-holidays');

      console.log('   Holiday Display:');
      console.log('   - Total Allowance:', totalAllowance, 'hours');
      console.log('   - Used:', usedHolidays, 'hours');
      console.log('   - Remaining:', remainingHolidays, 'hours');

      await page.screenshot({ path: 'test_my_holidays_current.png' });

      // Test holiday booking calculation if we have a working pattern
      if (workingPattern) {
        console.log('\n4. Testing holiday booking calculation...');
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);

        await page.fill('#from-date', tomorrow.toISOString().split('T')[0]);
        await page.fill('#to-date', nextWeek.toISOString().split('T')[0]);
        await page.click('#calculate-btn');
        await page.waitForTimeout(1500);

        // Check calculation result
        const calculationVisible = await page.isVisible('#calculation-result');
        if (calculationVisible) {
          const calcTotal = await page.textContent('#calc-total');
          console.log('   Calculated time off:', calcTotal, 'hours');
          await page.screenshot({ path: 'test_holiday_calculation.png' });
        }
      }
    } else {
      console.log('   ⚠️ Holiday page shows setup required message');
      const pageContent = await page.textContent('body');
      if (pageContent.includes('complete your welcome process')) {
        console.log('   Need to complete welcome process first');
      }
    }

    // 5. Test Admin Holiday Management
    console.log('\n5. Testing admin holiday management...');
    await page.goto('http://127.0.0.1:5500/admin-dashboard.html');
    await page.waitForTimeout(2000);

    // Navigate to holidays section
    const holidaysButton = await page.locator('button[data-section="view-holidays"]');
    if (await holidaysButton.count() > 0) {
      await holidaysButton.click();
      await page.waitForTimeout(2000);

      // Check if entitlements load
      const entitlementsVisible = await page.isVisible('#holidays-entitlements');
      if (entitlementsVisible) {
        console.log('   ✅ Entitlements section loaded');
        await page.screenshot({ path: 'test_admin_entitlements.png' });
      }

      // Check if requests load
      const requestsVisible = await page.isVisible('#holidays-requests');
      if (requestsVisible) {
        console.log('   ✅ Requests section loaded');
      }
    } else {
      console.log('   ⚠️ Holidays section not found in admin dashboard');
    }

    // 6. Check for missing data and provide recommendations
    console.log('\n=== SYSTEM STATUS ===');

    if (!holidayProfile) {
      console.log('⚠️ Holiday profile missing - Complete welcome process');
    } else if (!holidayProfile.avatar_url) {
      console.log('⚠️ Avatar not set - Complete avatar step in welcome');
    }

    if (holidayProfile && !workingPattern) {
      console.log('⚠️ Working pattern missing - Complete working hours in welcome');
    }

    if (holidayProfile && workingPattern) {
      const { data: entitlement } = await supabase
        .from('2_staff_entitlements')
        .select('*')
        .eq('staff_profile_id', holidayProfile.id)
        .eq('year', new Date().getFullYear())
        .maybeSingle();

      if (!entitlement) {
        console.log('⚠️ Entitlement missing - Will be created on welcome completion');
      } else {
        console.log('✅ All core holiday data exists');
      }
    }

    // 7. Test creating a holiday request if all data exists
    if (holidayProfile && workingPattern) {
      console.log('\n6. Creating test holiday request...');

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const requestData = {
        user_id: user.id,
        site_id: holidayProfile.site_id || 1,
        start_date: tomorrow.toISOString().split('T')[0],
        end_date: tomorrow.toISOString().split('T')[0],
        hours_requested: 8,
        sessions_requested: 0,
        reason: 'Automated test request',
        status: 'pending',
        year: new Date().getFullYear(),
        requested_at: new Date().toISOString()
      };

      const { data: newRequest, error: requestError } = await supabase
        .from('4_holiday_requests')
        .insert(requestData)
        .select()
        .single();

      if (newRequest) {
        console.log('   ✅ Test holiday request created:', newRequest.id);
      } else {
        console.log('   ❌ Failed to create request:', requestError);
      }
    }

  } catch (error) {
    console.error('\n❌ Test error:', error);
    await page.screenshot({ path: 'test_error_state.png' });
  } finally {
    console.log('\n=== TEST COMPLETE ===');
    await page.waitForTimeout(2000);
    await browser.close();
    await supabase.auth.signOut();
  }
}

testHolidaySystemSimplified().catch(console.error);