/**
 * Navigation Consistency Test Script
 * 
 * This script checks the navigation structure and styling across different pages
 * to ensure consistency. It can be run in the browser console on any page.
 * 
 * Usage:
 * 1. Open any page with the navigation bar
 * 2. Open the browser console (F12 or Cmd+Opt+I)
 * 3. Copy and paste this entire script into the console
 * 4. Press Enter to run the test
 */

(function() {
  console.log('%c Navigation Consistency Test', 'background:#4338ca; color:white; padding:5px; border-radius:4px;');
  
  // Check if we're on a page with navigation
  const topbar = document.querySelector('.topbar.panel');
  if (!topbar) {
    console.error('❌ No .topbar.panel found on this page!');
    return;
  }
  
  // 1. Check structure
  console.log('%c 1. Checking navigation structure...', 'font-weight:bold;');
  
  const navContainer = topbar.querySelector('.nav.seg-nav');
  if (!navContainer) {
    console.error('❌ No .nav.seg-nav container found!');
    return;
  } else {
    console.log('✅ .nav.seg-nav container found');
  }
  
  const halo = topbar.querySelector('.halo');
  if (!halo) {
    console.warn('⚠️ No .halo element found in topbar');
  } else {
    console.log('✅ .halo element found');
    
    // Check halo positioning
    const haloStyle = window.getComputedStyle(halo);
    if (haloStyle.position !== 'absolute') {
      console.warn('⚠️ .halo position is not absolute:', haloStyle.position);
    }
  }
  
  const spacer = topbar.querySelector('.spacer');
  if (!spacer) {
    console.warn('⚠️ No .spacer element found in topbar');
  } else {
    console.log('✅ .spacer element found');
  }
  
  const emailPill = topbar.querySelector('#email-pill');
  if (!emailPill) {
    console.warn('⚠️ No #email-pill element found');
  } else {
    console.log('✅ #email-pill element found');
  }
  
  const rolePill = topbar.querySelector('#role-pill');
  if (!rolePill) {
    console.warn('⚠️ No #role-pill element found');
  } else {
    console.log('✅ #role-pill element found');
  }
  
  const logoutBtn = topbar.querySelector('#logout-btn');
  if (!logoutBtn) {
    console.warn('⚠️ No #logout-btn element found');
  } else {
    console.log('✅ #logout-btn element found');
  }
  
  // 2. Check navigation items
  console.log('%c 2. Checking navigation items...', 'font-weight:bold;');
  
  const navButtons = navContainer.querySelectorAll('button');
  console.log(`Found ${navButtons.length} navigation buttons`);
  
  const expectedPages = [
    'home', 'calendar', 'welcome', 'holidays', 'meetings', 
    'scans', 'training', 'achievements', 'quiz'
  ];
  
  const foundPages = Array.from(navButtons).map(btn => btn.dataset.section);
  console.log('Found pages:', foundPages);
  
  // Check for missing pages
  const missingPages = expectedPages.filter(page => !foundPages.includes(page));
  if (missingPages.length > 0) {
    console.error('❌ Missing expected navigation items:', missingPages);
  } else {
    console.log('✅ All expected navigation items present');
  }
  
  // Check for unexpected pages
  const unexpectedPages = foundPages.filter(page => !expectedPages.includes(page) && page !== 'admin-portal');
  if (unexpectedPages.length > 0) {
    console.warn('⚠️ Unexpected navigation items found:', unexpectedPages);
  }
  
  // 3. Check styling
  console.log('%c 3. Checking navigation styling...', 'font-weight:bold;');
  
  // Check if fix-navigation-style.js is loaded
  if (typeof window.fixNavigationStyling !== 'function') {
    console.error('❌ fixNavigationStyling function not found! fix-navigation-style.js might be missing.');
  } else {
    console.log('✅ fixNavigationStyling function found');
  }
  
  // Check topbar styling
  const topbarStyle = window.getComputedStyle(topbar);
  
  if (!topbarStyle.background.includes('gradient')) {
    console.warn('⚠️ Topbar background is not a gradient:', topbarStyle.background);
  }
  
  if (topbarStyle.position !== 'relative') {
    console.warn('⚠️ Topbar position is not relative:', topbarStyle.position);
  }
  
  // Check nav styling
  const navStyle = window.getComputedStyle(navContainer);
  
  if (navStyle.display !== 'flex') {
    console.warn('⚠️ Navigation container is not using flexbox:', navStyle.display);
  }
  
  // 4. Check for active button
  console.log('%c 4. Checking for active navigation button...', 'font-weight:bold;');
  
  const activeButtons = navContainer.querySelectorAll('button.active');
  if (activeButtons.length === 0) {
    console.warn('⚠️ No active navigation button found');
  } else if (activeButtons.length > 1) {
    console.warn('⚠️ Multiple active navigation buttons found:', activeButtons.length);
  } else {
    console.log('✅ One active navigation button found:', activeButtons[0].textContent);
  }
  
  console.log('%c Navigation Consistency Test Completed', 'background:#4338ca; color:white; padding:5px; border-radius:4px;');
})();