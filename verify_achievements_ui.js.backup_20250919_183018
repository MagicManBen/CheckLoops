// Script to verify achievements UI is working correctly
// Run this in the browser console while logged in

async function verifyAchievementsUI() {
    console.log("=".repeat(60));
    console.log("VERIFYING ACHIEVEMENTS UI");
    console.log("=".repeat(60));

    // Check if Supabase is available
    if (typeof supabase === 'undefined') {
        console.error("❌ Supabase not initialized");
        return;
    }

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        console.error("❌ No user logged in");
        return;
    }
    console.log("✅ User logged in:", user.email);

    // Get user profile with kiosk_user_id
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

    if (!profile) {
        console.error("❌ No user profile found");
        return;
    }
    console.log("✅ User profile found, kiosk_user_id:", profile.kiosk_user_id);

    // Get achievements for this user
    const { data: userAchievements } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('kiosk_user_id', profile.kiosk_user_id);

    console.log("\nUser Achievements:");
    if (userAchievements && userAchievements.length > 0) {
        userAchievements.forEach(ach => {
            const icon = ach.status === 'unlocked' ? '✅' : '🔒';
            console.log(`  ${icon} ${ach.achievement_key}: ${ach.status} (${ach.progress_percent}%)`);
        });
    } else {
        console.log("  No achievements found");
    }

    // Check achievements display on page
    console.log("\nChecking UI elements:");

    // For staff.html
    const achGrid = document.getElementById('achievements-grid');
    if (achGrid) {
        const achievementCards = achGrid.querySelectorAll('.ach');
        console.log(`  Achievements grid found with ${achievementCards.length} achievements displayed`);
        achievementCards.forEach(card => {
            const key = card.getAttribute('data-key');
            const name = card.querySelector('.name')?.textContent;
            console.log(`    - ${key}: ${name}`);
        });
    }

    // For achievements.html
    const achList = document.getElementById('ach-list');
    if (achList) {
        const achievementCards = achList.querySelectorAll('.ach-card');
        console.log(`  Achievements list found with ${achievementCards.length} total achievements`);

        const unlockedCards = achList.querySelectorAll('.ach-card.unlocked');
        const lockedCards = achList.querySelectorAll('.ach-card.locked');

        console.log(`    - Unlocked: ${unlockedCards.length}`);
        console.log(`    - Locked: ${lockedCards.length}`);

        unlockedCards.forEach(card => {
            const key = card.getAttribute('data-key');
            const title = card.querySelector('.title')?.textContent;
            console.log(`      ✅ ${key}: ${title}`);
        });
    }

    // Check KPI display
    const kpiUnlocked = document.getElementById('ach-unlocked');
    const kpiTotal = document.getElementById('ach-total');
    if (kpiUnlocked && kpiTotal) {
        console.log(`\nKPI Display: ${kpiUnlocked.textContent}/${kpiTotal.textContent} achievements unlocked`);
    }

    console.log("\n" + "=".repeat(60));
    console.log("VERIFICATION COMPLETE");
    console.log("=".repeat(60));
}

// Run the verification
verifyAchievementsUI();