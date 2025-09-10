import { chromium } from 'playwright';

async function testFinalAvatarDisplay() {
    console.log('🎯 Final Test: Holiday Avatar Display with Paris Destination\n');
    
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    // Enable console logging
    page.on('console', msg => {
        const text = msg.text();
        if (text.includes('Generating') || text.includes('avatar') || text.includes('Avatar') || 
            text.includes('Image generated') || text.includes('Paris')) {
            console.log('📝 Browser console:', text);
        }
    });
    
    // Track network requests to OpenAI
    page.on('request', request => {
        if (request.url().includes('openai.com')) {
            console.log('🌐 OpenAI API Request:', request.method(), request.url());
        }
    });
    
    page.on('response', response => {
        if (response.url().includes('openai.com')) {
            console.log('📡 OpenAI API Response:', response.status());
        }
    });
    
    try {
        // Step 1: Go to homepage and login
        console.log('1️⃣ Navigating to homepage...');
        await page.goto('http://127.0.0.1:58156/homepage.html');
        await page.waitForTimeout(2000);
        
        // Login
        console.log('2️⃣ Logging in as Ben Howard...');
        const emailField = await page.locator('#email');
        if (await emailField.isVisible()) {
            await emailField.fill('ben.howard@stoke.nhs.uk');
            await page.locator('input[type="password"]').fill('Hello1!');
            await page.click('button:has-text("Sign In")');
            console.log('   ✅ Login submitted');
            await page.waitForTimeout(5000);
        }
        
        // Step 2: Navigate to staff.html first
        console.log('3️⃣ Navigating to staff dashboard...');
        await page.goto('http://127.0.0.1:58156/staff.html');
        await page.waitForTimeout(3000);
        
        // Take screenshot of staff page
        await page.screenshot({ 
            path: 'screenshots/staff_dashboard.png', 
            fullPage: false 
        });
        
        // Step 3: Click on holidays section
        console.log('4️⃣ Looking for holidays link...');
        
        // Try different selectors for the holidays link
        const holidaySelectors = [
            'a[href*="holiday"]',
            'button:has-text("Holidays")',
            'a:has-text("Holidays")',
            '[data-section="holidays"]',
            '.nav-item:has-text("Holidays")'
        ];
        
        let foundHolidayLink = false;
        for (const selector of holidaySelectors) {
            const element = await page.locator(selector).first();
            if (await element.isVisible().catch(() => false)) {
                console.log(`   Found holiday link with selector: ${selector}`);
                await element.click();
                foundHolidayLink = true;
                break;
            }
        }
        
        if (!foundHolidayLink) {
            console.log('   ⚠️ Holiday link not found, navigating directly...');
            await page.goto('http://127.0.0.1:58156/staff-holidays.html');
        }
        
        await page.waitForTimeout(5000);
        
        // Step 4: Check current page
        const currentUrl = page.url();
        console.log('5️⃣ Current page:', currentUrl);
        
        // Take screenshot of holidays page
        await page.screenshot({ 
            path: 'screenshots/holidays_page_initial.png', 
            fullPage: true 
        });
        
        // Step 5: Check for countdown banner
        console.log('6️⃣ Checking for Paris holiday countdown...');
        
        const countdownInfo = await page.evaluate(() => {
            const countdown = document.querySelector('.holiday-countdown');
            if (!countdown) return { exists: false };
            
            const title = countdown.querySelector('h2')?.textContent || '';
            const timer = countdown.querySelector('p')?.textContent || '';
            const avatarEl = document.getElementById('holiday-avatar');
            
            return {
                exists: true,
                title,
                timer,
                hasAvatarContainer: !!avatarEl,
                avatarContent: avatarEl?.innerHTML?.substring(0, 200) || null
            };
        });
        
        if (countdownInfo.exists) {
            console.log('   ✅ Countdown banner found!');
            console.log(`   Title: ${countdownInfo.title}`);
            console.log(`   Timer: ${countdownInfo.timer}`);
            console.log(`   Avatar container: ${countdownInfo.hasAvatarContainer ? 'Yes' : 'No'}`);
        } else {
            console.log('   ⚠️ No countdown banner found');
        }
        
        // Step 6: Check for holiday cards with destinations
        console.log('7️⃣ Checking for holiday cards...');
        
        const holidayCards = await page.evaluate(() => {
            const cards = [];
            document.querySelectorAll('.holiday-card').forEach(card => {
                const destination = card.querySelector('p')?.textContent;
                if (destination && destination.includes('🏖️')) {
                    const avatarContainer = card.querySelector('[id^="avatar-"]');
                    cards.push({
                        destination: destination.replace('🏖️', '').trim(),
                        hasAvatarContainer: !!avatarContainer,
                        avatarId: avatarContainer?.id || null
                    });
                }
            });
            return cards;
        });
        
        console.log(`   Found ${holidayCards.length} holiday cards with destinations`);
        holidayCards.forEach(card => {
            console.log(`   - ${card.destination}: Avatar container = ${card.hasAvatarContainer}`);
        });
        
        // Step 7: Wait for avatar generation
        if (countdownInfo.hasAvatarContainer || holidayCards.length > 0) {
            console.log('\n8️⃣ Waiting for avatar generation (up to 30 seconds)...');
            
            // Wait and check for images
            for (let i = 0; i < 6; i++) {
                await page.waitForTimeout(5000);
                
                const avatarStatus = await page.evaluate(() => {
                    const results = {
                        countdown: null,
                        cards: []
                    };
                    
                    // Check countdown avatar
                    const countdownAvatar = document.getElementById('holiday-avatar');
                    if (countdownAvatar) {
                        const img = countdownAvatar.querySelector('img');
                        results.countdown = {
                            hasImage: !!img,
                            src: img?.src?.substring(0, 100) || null,
                            isAI: img?.src?.includes('oaidalleapiprodscus') || img?.src?.includes('openai') || false
                        };
                    }
                    
                    // Check card avatars
                    document.querySelectorAll('[id^="avatar-"]').forEach(container => {
                        const img = container.querySelector('img');
                        results.cards.push({
                            id: container.id,
                            hasImage: !!img,
                            isAI: img?.src?.includes('oaidalleapiprodscus') || img?.src?.includes('openai') || false
                        });
                    });
                    
                    return results;
                });
                
                console.log(`   Check ${i+1}/6:`);
                if (avatarStatus.countdown) {
                    if (avatarStatus.countdown.isAI) {
                        console.log('     ✅ AI-generated countdown avatar detected!');
                    } else if (avatarStatus.countdown.hasImage) {
                        console.log('     📷 Countdown has image (not AI)');
                    }
                }
                
                const aiAvatars = avatarStatus.cards.filter(c => c.isAI).length;
                if (aiAvatars > 0) {
                    console.log(`     ✅ ${aiAvatars} AI-generated card avatars detected!`);
                }
                
                if (avatarStatus.countdown?.isAI || aiAvatars > 0) {
                    console.log('\n🎉 SUCCESS! AI avatars are being generated!');
                    break;
                }
            }
        }
        
        // Step 8: Take final screenshots
        console.log('\n9️⃣ Taking final screenshots...');
        await page.screenshot({ 
            path: 'screenshots/holidays_page_final.png', 
            fullPage: true 
        });
        
        // Zoom in on countdown if it exists
        const countdownElement = await page.locator('.holiday-countdown').first();
        if (await countdownElement.isVisible().catch(() => false)) {
            await countdownElement.screenshot({ 
                path: 'screenshots/countdown_banner_closeup.png' 
            });
            console.log('   📸 Countdown banner closeup saved');
        }
        
        // Final summary
        console.log('\n📊 FINAL SUMMARY:');
        console.log('✅ Test completed successfully');
        console.log('📁 Screenshots saved:');
        console.log('  - screenshots/staff_dashboard.png');
        console.log('  - screenshots/holidays_page_initial.png');
        console.log('  - screenshots/holidays_page_final.png');
        console.log('  - screenshots/countdown_banner_closeup.png (if exists)');
        
    } catch (error) {
        console.error('\n❌ Test failed:', error);
        await page.screenshot({ 
            path: 'screenshots/error_state.png', 
            fullPage: true 
        });
    } finally {
        console.log('\n🔚 Test complete. Browser will close in 10 seconds...');
        await page.waitForTimeout(10000);
        await browser.close();
    }
}

// Run the test
testFinalAvatarDisplay();