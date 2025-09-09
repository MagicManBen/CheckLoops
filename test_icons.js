import { chromium } from 'playwright';

async function testAllIcons() {
  console.log('🎨 Testing All Staff Page Icons');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 
  });
  
  const page = await browser.newPage();
  
  // Track broken images
  const brokenImages = [];
  
  page.on('response', response => {
    if (response.url().includes('icons8.com') && !response.ok()) {
      console.log(`❌ Failed to load icon: ${response.url()} (${response.status()})`);
      brokenImages.push(response.url());
    }
  });
  
  try {
    // Login first
    console.log('🔑 Step 1: Login');
    await page.goto('http://127.0.0.1:58156/Home.html');
    await page.locator('#email').fill('ben.howard@stoke.nhs.uk');
    await page.locator('#password').fill('Hello1!');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(3000);
    
    console.log('🏠 Step 2: Test staff.html icons');
    // Should already be on staff.html after login
    await page.waitForTimeout(3000);
    
    // Count icons and check if they loaded
    const staffIcons = await page.$$eval('img[data-i8]', imgs => 
      imgs.map(img => ({
        src: img.src,
        alt: img.alt,
        loaded: img.complete && img.naturalHeight !== 0,
        dataI8: img.getAttribute('data-i8')
      }))
    );
    
    console.log(`  Found ${staffIcons.length} icons on staff.html:`);
    staffIcons.forEach((icon, i) => {
      const status = icon.loaded ? '✅' : '❌';
      console.log(`    ${i+1}. ${status} ${icon.dataI8} (${icon.alt})`);
    });
    
    await page.screenshot({ path: 'test_icons_staff.png', fullPage: true });
    
    console.log('🧠 Step 3: Test staff-quiz.html icons');
    await page.click('a[href="staff-quiz.html"]');
    await page.waitForTimeout(4000);
    
    const quizIcons = await page.$$eval('img[data-i8]', imgs => 
      imgs.map(img => ({
        src: img.src,
        alt: img.alt,
        loaded: img.complete && img.naturalHeight !== 0,
        dataI8: img.getAttribute('data-i8')
      }))
    );
    
    console.log(`  Found ${quizIcons.length} icons on staff-quiz.html:`);
    quizIcons.forEach((icon, i) => {
      const status = icon.loaded ? '✅' : '❌';
      console.log(`    ${i+1}. ${status} ${icon.dataI8} (${icon.alt})`);
    });
    
    await page.screenshot({ path: 'test_icons_quiz.png', fullPage: true });
    
    console.log('📄 Step 4: Test staff-scans.html icons');
    await page.click('a[href="staff-scans.html"]');
    await page.waitForTimeout(4000);
    
    const scansIcons = await page.$$eval('img[data-i8]', imgs => 
      imgs.map(img => ({
        src: img.src,
        alt: img.alt,
        loaded: img.complete && img.naturalHeight !== 0,
        dataI8: img.getAttribute('data-i8')
      }))
    );
    
    console.log(`  Found ${scansIcons.length} icons on staff-scans.html:`);
    scansIcons.forEach((icon, i) => {
      const status = icon.loaded ? '✅' : '❌';
      console.log(`    ${i+1}. ${status} ${icon.dataI8} (${icon.alt})`);
    });
    
    await page.screenshot({ path: 'test_icons_scans.png', fullPage: true });
    
    console.log('👋 Step 5: Test staff-welcome.html icons');
    await page.goto('http://127.0.0.1:58156/staff-welcome.html');
    await page.waitForTimeout(4000);
    
    const welcomeIcons = await page.$$eval('img[data-i8]', imgs => 
      imgs.map(img => ({
        src: img.src,
        alt: img.alt,
        loaded: img.complete && img.naturalHeight !== 0,
        dataI8: img.getAttribute('data-i8')
      }))
    );
    
    console.log(`  Found ${welcomeIcons.length} icons on staff-welcome.html:`);
    welcomeIcons.forEach((icon, i) => {
      const status = icon.loaded ? '✅' : '❌';
      console.log(`    ${i+1}. ${status} ${icon.dataI8} (${icon.alt})`);
    });
    
    await page.screenshot({ path: 'test_icons_welcome.png', fullPage: true });
    
    // Summary
    const totalIcons = staffIcons.length + quizIcons.length + scansIcons.length + welcomeIcons.length;
    const allIcons = [...staffIcons, ...quizIcons, ...scansIcons, ...welcomeIcons];
    const loadedIcons = allIcons.filter(icon => icon.loaded).length;
    
    console.log('\n📊 ICON TESTING SUMMARY:');
    console.log(`  Total icons tested: ${totalIcons}`);
    console.log(`  Successfully loaded: ${loadedIcons}`);
    console.log(`  Failed to load: ${totalIcons - loadedIcons}`);
    console.log(`  Success rate: ${Math.round((loadedIcons / totalIcons) * 100)}%`);
    
    if (brokenImages.length > 0) {
      console.log('\n❌ Broken image URLs:');
      brokenImages.forEach(url => console.log(`    ${url}`));
    } else {
      console.log('\n✅ All icons loaded successfully!');
    }
    
  } catch (error) {
    console.error('❌ Icon test failed:', error);
    await page.screenshot({ path: 'test_icons_error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

testAllIcons();