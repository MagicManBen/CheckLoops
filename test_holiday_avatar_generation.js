import { chromium } from 'playwright';

async function testHolidayAvatarGeneration() {
    console.log('🎯 Testing Holiday Avatar Generation...\n');
    
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    try {
        // Step 1: Login
        console.log('1️⃣ Logging in...');
        await page.goto('http://127.0.0.1:58156/index.html');
        await page.waitForTimeout(2000);
        
        // Check if we need to login
        const needsLogin = await page.isVisible('#email').catch(() => false);
        if (needsLogin) {
            await page.locator('#email').fill('ben.howard@stoke.nhs.uk');
            await page.locator('input[type="password"]').fill('Hello1!');
            await page.click('button:has-text("Sign In")');
            await page.waitForTimeout(3000);
        }
        
        // Step 2: Navigate to holidays page
        console.log('2️⃣ Navigating to holidays page...');
        await page.goto('http://127.0.0.1:58156/staff-holidays.html');
        await page.waitForTimeout(5000);
        
        // Step 3: Take screenshot of current state
        console.log('3️⃣ Taking screenshot of current holiday display...');
        await page.screenshot({ 
            path: 'screenshots/holiday_avatar_initial.png', 
            fullPage: true 
        });
        
        // Step 4: Check if avatar generation is triggered
        console.log('4️⃣ Checking for avatar generation...');
        
        // Look for holiday destinations
        const hasDestinations = await page.evaluate(() => {
            const elements = document.querySelectorAll('[id^="avatar-"]');
            console.log('Found avatar containers:', elements.length);
            return elements.length > 0;
        });
        
        if (hasDestinations) {
            console.log('✅ Found holiday destinations that need avatars');
            
            // Wait for avatar generation or loading states
            console.log('⏳ Waiting for avatar generation (this may take up to 30 seconds)...');
            
            // Check console logs for avatar generation
            page.on('console', msg => {
                const text = msg.text();
                if (text.includes('Generating holiday avatar') || 
                    text.includes('Image generated successfully') ||
                    text.includes('Using cached image') ||
                    text.includes('Avatar generation failed')) {
                    console.log('📝 Console:', text);
                }
            });
            
            // Wait for potential avatar images to load
            await page.waitForTimeout(15000);
            
            // Step 5: Take final screenshot
            console.log('5️⃣ Taking final screenshot after avatar generation...');
            await page.screenshot({ 
                path: 'screenshots/holiday_avatar_generated.png', 
                fullPage: true 
            });
            
            // Step 6: Check for actual images
            const avatarStatus = await page.evaluate(() => {
                const results = [];
                const containers = document.querySelectorAll('[id^="avatar-"]');
                containers.forEach(container => {
                    const img = container.querySelector('img');
                    const hasImage = img && img.src && !img.src.includes('data:');
                    const hasPlaceholder = container.querySelector('div[style*="gradient"]');
                    
                    results.push({
                        id: container.id,
                        hasImage: hasImage,
                        hasPlaceholder: !!hasPlaceholder,
                        imageUrl: img?.src || null
                    });
                });
                return results;
            });
            
            console.log('\n📊 Avatar Status:');
            avatarStatus.forEach(status => {
                if (status.hasImage) {
                    console.log(`  ✅ ${status.id}: Generated avatar (${status.imageUrl?.substring(0, 50)}...)`);
                } else if (status.hasPlaceholder) {
                    console.log(`  🏝️ ${status.id}: Showing placeholder`);
                } else {
                    console.log(`  ❓ ${status.id}: Unknown state`);
                }
            });
            
            // Check countdown banner
            const countdownAvatar = await page.evaluate(() => {
                const avatarEl = document.getElementById('holiday-avatar');
                if (!avatarEl) return null;
                
                const img = avatarEl.querySelector('img');
                const hasImage = img && img.src && !img.src.includes('data:');
                return {
                    hasImage: hasImage,
                    imageUrl: img?.src || null
                };
            });
            
            if (countdownAvatar) {
                console.log('\n🎯 Countdown Banner Avatar:');
                if (countdownAvatar.hasImage) {
                    console.log(`  ✅ Generated avatar for countdown`);
                } else {
                    console.log(`  🏝️ No avatar in countdown banner`);
                }
            }
            
        } else {
            console.log('ℹ️ No holiday destinations found that need avatars');
            console.log('   This could mean:');
            console.log('   - No approved holidays with destinations');
            console.log('   - Avatars already cached');
            console.log('   - Page structure different than expected');
        }
        
        console.log('\n✅ Test completed!');
        console.log('📁 Screenshots saved:');
        console.log('  - screenshots/holiday_avatar_initial.png');
        console.log('  - screenshots/holiday_avatar_generated.png');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        await page.screenshot({ 
            path: 'screenshots/holiday_avatar_error.png', 
            fullPage: true 
        });
    } finally {
        await browser.close();
    }
}

// Run the test
testHolidayAvatarGeneration();