import { chromium } from 'playwright';

async function testAvatarWithDestination() {
    console.log('🎯 Testing Holiday Avatar Generation with Destination...\n');
    
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    try {
        // Step 1: Navigate directly to staff holidays page
        console.log('1️⃣ Navigating to staff holidays page...');
        await page.goto('http://127.0.0.1:58156/staff-holidays.html');
        await page.waitForTimeout(3000);
        
        // Check if we're redirected to login
        const currentUrl = page.url();
        console.log('Current URL:', currentUrl);
        
        if (currentUrl.includes('homepage.html') || currentUrl.includes('index.html')) {
            console.log('📝 Need to login first...');
            
            // Fill login form
            await page.locator('#email').fill('ben.howard@stoke.nhs.uk');
            await page.locator('input[type="password"]').fill('Hello1!');
            await page.click('button:has-text("Sign In")');
            await page.waitForTimeout(3000);
            
            // Navigate to staff holidays again
            console.log('🔄 Navigating back to holidays page...');
            await page.goto('http://127.0.0.1:58156/staff-holidays.html');
            await page.waitForTimeout(3000);
        }
        
        // Step 2: Create a new holiday request with destination
        console.log('2️⃣ Creating holiday request with destination...');
        
        // Check if request button exists
        const requestButton = await page.locator('button:has-text("Request Holiday")').first();
        if (await requestButton.isVisible()) {
            await requestButton.click();
            await page.waitForTimeout(1000);
            
            // Fill in the holiday request form
            const today = new Date();
            const startDate = new Date(today);
            startDate.setDate(today.getDate() + 30); // 30 days from now
            const endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 5); // 5 day holiday
            
            await page.fill('#start-date', startDate.toISOString().split('T')[0]);
            await page.fill('#end-date', endDate.toISOString().split('T')[0]);
            await page.selectOption('#request-type', 'holiday');
            
            // Add destination
            const destinationField = await page.locator('#destination');
            if (await destinationField.isVisible()) {
                await destinationField.fill('Paris');
                console.log('✅ Added destination: Paris');
            }
            
            // Submit the form
            await page.click('button:has-text("Submit Request")');
            await page.waitForTimeout(3000);
        } else {
            console.log('⚠️ Request button not found, checking existing holidays...');
        }
        
        // Step 3: Look for avatar containers
        console.log('3️⃣ Checking for avatar containers...');
        
        // Enable console logging
        page.on('console', msg => {
            const text = msg.text();
            if (text.includes('avatar') || text.includes('Avatar') || text.includes('generating') || text.includes('Holiday')) {
                console.log('📝 Console:', text);
            }
        });
        
        // Check for any avatar elements
        const avatarInfo = await page.evaluate(() => {
            const results = {
                avatarContainers: [],
                holidayDestinations: [],
                countdownBanner: null
            };
            
            // Check for avatar containers
            document.querySelectorAll('[id^="avatar-"]').forEach(el => {
                const img = el.querySelector('img');
                results.avatarContainers.push({
                    id: el.id,
                    hasImage: !!img,
                    imageSrc: img?.src || null
                });
            });
            
            // Check for destinations in holiday cards
            document.querySelectorAll('.holiday-card').forEach(card => {
                const destination = card.querySelector('p:has-text("🏖️")');
                if (destination) {
                    results.holidayDestinations.push(destination.textContent);
                }
            });
            
            // Check countdown banner
            const countdownAvatar = document.getElementById('holiday-avatar');
            if (countdownAvatar) {
                const img = countdownAvatar.querySelector('img');
                results.countdownBanner = {
                    exists: true,
                    hasImage: !!img,
                    imageSrc: img?.src || null
                };
            }
            
            return results;
        });
        
        console.log('\n📊 Avatar Analysis:');
        console.log('Avatar containers found:', avatarInfo.avatarContainers.length);
        console.log('Holiday destinations found:', avatarInfo.holidayDestinations.length);
        if (avatarInfo.countdownBanner) {
            console.log('Countdown banner:', avatarInfo.countdownBanner.hasImage ? 'Has image' : 'No image');
        }
        
        // Step 4: Wait for potential avatar generation
        if (avatarInfo.avatarContainers.length > 0 || avatarInfo.holidayDestinations.length > 0) {
            console.log('\n⏳ Waiting for avatar generation (up to 30 seconds)...');
            
            // Wait and check periodically
            for (let i = 0; i < 6; i++) {
                await page.waitForTimeout(5000);
                
                const currentStatus = await page.evaluate(() => {
                    const containers = document.querySelectorAll('[id^="avatar-"]');
                    let withImages = 0;
                    containers.forEach(el => {
                        if (el.querySelector('img[src*="http"]')) withImages++;
                    });
                    return { total: containers.length, withImages };
                });
                
                console.log(`  Check ${i+1}/6: ${currentStatus.withImages}/${currentStatus.total} avatars loaded`);
                
                if (currentStatus.withImages > 0) {
                    console.log('  ✅ Avatar images detected!');
                    break;
                }
            }
        }
        
        // Step 5: Take final screenshots
        console.log('\n5️⃣ Taking final screenshots...');
        await page.screenshot({ 
            path: 'screenshots/holiday_page_with_avatars.png', 
            fullPage: true 
        });
        
        // Check specific avatar containers
        const finalStatus = await page.evaluate(() => {
            const results = [];
            
            // Check all avatar containers
            document.querySelectorAll('[id^="avatar-"]').forEach(container => {
                const img = container.querySelector('img');
                if (img && img.src) {
                    results.push({
                        id: container.id,
                        src: img.src.substring(0, 100),
                        isOpenAI: img.src.includes('oaidalleapiprodscus') || img.src.includes('openai')
                    });
                }
            });
            
            // Check countdown banner
            const banner = document.getElementById('holiday-avatar');
            if (banner) {
                const img = banner.querySelector('img');
                if (img && img.src) {
                    results.push({
                        id: 'countdown-banner',
                        src: img.src.substring(0, 100),
                        isOpenAI: img.src.includes('oaidalleapiprodscus') || img.src.includes('openai')
                    });
                }
            }
            
            return results;
        });
        
        console.log('\n🎨 Final Avatar Status:');
        if (finalStatus.length > 0) {
            finalStatus.forEach(avatar => {
                if (avatar.isOpenAI) {
                    console.log(`  ✅ ${avatar.id}: AI-generated image from DALL-E`);
                } else {
                    console.log(`  📷 ${avatar.id}: Image loaded (${avatar.src}...)`);
                }
            });
        } else {
            console.log('  ⚠️ No avatar images found');
            console.log('  This could mean:');
            console.log('  - No holidays with destinations');
            console.log('  - API key issue');
            console.log('  - Service not loaded properly');
        }
        
        console.log('\n✅ Test completed!');
        console.log('📁 Screenshot saved: screenshots/holiday_page_with_avatars.png');
        
    } catch (error) {
        console.error('\n❌ Test failed:', error);
        await page.screenshot({ 
            path: 'screenshots/avatar_test_error.png', 
            fullPage: true 
        });
    } finally {
        console.log('\n🔚 Closing browser in 5 seconds...');
        await page.waitForTimeout(5000);
        await browser.close();
    }
}

// Run the test
testAvatarWithDestination();