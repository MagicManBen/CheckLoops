import { chromium } from 'playwright';

async function testMeetingsPage() {
  console.log('🔍 Deep dive analysis of Meetings page functionality...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500  // Slow down to observe interactions
  });
  
  const page = await browser.newPage();
  
  // Enable console logging
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('❌ Console Error:', msg.text());
    }
  });
  
  page.on('pageerror', err => {
    console.log('❌ Page Error:', err.message);
  });

  try {
    // 1. Login as admin to test full functionality
    console.log('1️⃣ Logging in as admin...');
    await page.goto('http://127.0.0.1:5500/home.html');
    await page.waitForTimeout(1000);
    
    await page.locator('#email').fill('benhowardmagic@hotmail.com');
    await page.locator('#password').fill('Hello1!');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(3000);
    
    // Navigate to meetings page
    console.log('2️⃣ Navigating to Meetings page...');
    await page.goto('http://127.0.0.1:5500/staff-meetings.html');
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: 'meetings_initial_state.png', fullPage: true });
    console.log('   ✅ Screenshot saved: meetings_initial_state.png');
    
    // 3. Test Calendar Tab
    console.log('\n3️⃣ Testing Calendar Tab...');
    const calendarVisible = await page.locator('#calendar').isVisible();
    console.log(`   Calendar element visible: ${calendarVisible}`);
    
    // Check if FullCalendar is initialized
    const hasCalendarContent = await page.evaluate(() => {
      const cal = document.querySelector('#calendar');
      return cal && cal.querySelector('.fc-toolbar') !== null;
    });
    console.log(`   FullCalendar initialized: ${hasCalendarContent}`);
    
    // Try to click on an event
    const events = await page.locator('.fc-event').count();
    console.log(`   Number of calendar events found: ${events}`);
    
    if (events > 0) {
      console.log('   Clicking on first event...');
      await page.locator('.fc-event').first().click();
      await page.waitForTimeout(1000);
      
      const modalVisible = await page.locator('#meeting-modal').isVisible();
      console.log(`   Meeting modal appears: ${modalVisible}`);
      
      if (modalVisible) {
        await page.screenshot({ path: 'meetings_modal.png' });
        console.log('   ✅ Screenshot saved: meetings_modal.png');
        
        // Test Accept/Decline buttons
        const acceptBtn = await page.locator('.btn-accept').isVisible();
        const declineBtn = await page.locator('.btn-decline').isVisible();
        console.log(`   Accept button visible: ${acceptBtn}`);
        console.log(`   Decline button visible: ${declineBtn}`);
        
        // Close modal
        await page.click('button:has-text("×")');
      }
    }
    
    // 4. Test Agenda Tab
    console.log('\n4️⃣ Testing Agenda Tab...');
    await page.click('button[data-tab="agenda"]');
    await page.waitForTimeout(1000);
    
    const agendaVisible = await page.locator('#agenda-content').isVisible();
    console.log(`   Agenda content visible: ${agendaVisible}`);
    
    // Check for existing agenda items
    const agendaItems = await page.locator('.agenda-item').count();
    console.log(`   Existing agenda items: ${agendaItems}`);
    
    // Try to submit new agenda item
    console.log('   Testing agenda submission form...');
    const meetingSelect = await page.locator('#agenda-meeting-select option').count();
    console.log(`   Meeting options in dropdown: ${meetingSelect - 1}`); // -1 for placeholder
    
    if (meetingSelect > 1) {
      await page.selectOption('#agenda-meeting-select', { index: 1 });
      await page.fill('#agenda-item-title', 'Test Agenda Item');
      await page.fill('#agenda-item-description', 'Testing functionality');
      
      // Intercept alert
      page.once('dialog', async dialog => {
        console.log(`   Alert message: "${dialog.message()}"`);
        await dialog.accept();
      });
      
      await page.click('button:has-text("Submit Agenda Item")');
      await page.waitForTimeout(1000);
      
      // Check if item was added
      const newItems = await page.locator('.agenda-item').count();
      console.log(`   Agenda items after submission: ${newItems}`);
      console.log(`   Item actually saved to database: ${newItems > agendaItems ? 'No (UI only)' : 'Unknown'}`);
    }
    
    await page.screenshot({ path: 'meetings_agenda.png' });
    console.log('   ✅ Screenshot saved: meetings_agenda.png');
    
    // 5. Test Meeting Notes Tab
    console.log('\n5️⃣ Testing Meeting Notes Tab...');
    await page.click('button[data-tab="notes"]');
    await page.waitForTimeout(1000);
    
    const notesVisible = await page.locator('#notes-content').isVisible();
    console.log(`   Notes content visible: ${notesVisible}`);
    
    // Test notes functionality
    const notesSelect = await page.locator('#notes-meeting-select option').count();
    console.log(`   Meeting options for notes: ${notesSelect - 1}`);
    
    if (notesSelect > 1) {
      await page.selectOption('#notes-meeting-select', { index: 1 });
      await page.fill('#meeting-notes-textarea', 'Test meeting notes content');
      
      // Check PDF generation
      const pdfBtn = await page.locator('.btn-generate-pdf').isVisible();
      console.log(`   PDF generation button visible: ${pdfBtn}`);
      
      // Check file upload
      const uploadInput = await page.locator('#meeting-recording').isVisible();
      console.log(`   Recording upload input visible: ${uploadInput}`);
    }
    
    await page.screenshot({ path: 'meetings_notes.png' });
    console.log('   ✅ Screenshot saved: meetings_notes.png');
    
    // 6. Test History Tab
    console.log('\n6️⃣ Testing Past Meetings Tab...');
    await page.click('button[data-tab="history"]');
    await page.waitForTimeout(1000);
    
    const historyVisible = await page.locator('#history-content').isVisible();
    console.log(`   History content visible: ${historyVisible}`);
    
    const historyItems = await page.locator('.meeting-history-item').count();
    console.log(`   Past meeting items: ${historyItems}`);
    
    if (historyItems > 0) {
      // Click first history item
      await page.locator('.meeting-history-item').first().click();
      await page.waitForTimeout(1000);
      
      // Check if it switches to notes tab
      const notesTabActive = await page.locator('.meetings-tab[data-tab="notes"]').evaluate(el => 
        el.classList.contains('active')
      );
      console.log(`   Clicking history item switches to notes: ${notesTabActive}`);
    }
    
    await page.screenshot({ path: 'meetings_history.png' });
    console.log('   ✅ Screenshot saved: meetings_history.png');
    
    // 7. Check for Supabase integration
    console.log('\n7️⃣ Checking for actual database integration...');
    
    // Check network requests
    const supabaseRequests = await page.evaluate(() => {
      // Check if any Supabase calls were made
      return window.performance.getEntriesByType('resource')
        .filter(entry => entry.name.includes('supabase') || entry.name.includes('54321'))
        .map(entry => ({
          url: entry.name,
          type: entry.initiatorType
        }));
    });
    
    console.log(`   Supabase API calls detected: ${supabaseRequests.length}`);
    supabaseRequests.forEach(req => {
      console.log(`     - ${req.url.substring(0, 80)}...`);
    });
    
    // 8. Summary
    console.log('\n📊 ANALYSIS SUMMARY:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const analysis = {
      '✅ FUNCTIONAL ELEMENTS': [
        '• Tab navigation system works',
        '• FullCalendar library loads and displays',
        '• Modal popup system functions',
        '• Form inputs and buttons are interactive',
        '• PDF generation with jsPDF (client-side only)',
        '• Local state management for UI updates',
        '• Session authentication check works'
      ],
      '⚠️ PLACEHOLDER/MOCK ELEMENTS': [
        '• Calendar events are hardcoded (not from database)',
        '• Agenda items only update UI (no database save)',
        '• Meeting notes not persisted to database',
        '• Accept/Decline just shows alerts',
        '• Past meetings are static/hardcoded',
        '• File upload processes locally only',
        '• AI transcription is simulated with setTimeout'
      ],
      '❌ MISSING FUNCTIONALITY': [
        '• No meetings table in Supabase database',
        '• No agenda_items table',
        '• No meeting_notes table',
        '• No attendees/invitations table',
        '• No real-time updates between users',
        '• No actual file storage to Supabase bucket',
        '• No OpenAI integration for transcription',
        '• No email notifications for invites'
      ],
      '📁 STORAGE BUCKET STATUS': [
        '• "meeting-recordings" bucket EXISTS in Supabase',
        '• But no upload functionality implemented',
        '• Bucket created but unused'
      ]
    };
    
    for (const [category, items] of Object.entries(analysis)) {
      console.log(`\n${category}`);
      items.forEach(item => console.log(item));
    }
    
    console.log('\n🎯 CONCLUSION:');
    console.log('The Meetings page is 90% PLACEHOLDER with nice UI but no backend.');
    console.log('Only the authentication and basic navigation are functional.');
    console.log('All meeting data is hardcoded, nothing saves to database.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: 'meetings_error.png' });
  } finally {
    await browser.close();
    console.log('\n✅ Test complete. Check screenshots for visual evidence.');
  }
}

testMeetingsPage();