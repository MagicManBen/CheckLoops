import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://unveoqnlqnobufhublyw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAxNzI3NiwiZXhwIjoyMDcwNTkzMjc2fQ.CJxV14F0T2TWkAjeR4bpYiBIOwLwyfzF9WzAWwS99Xc';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function retroactiveUnlockPracticeAchievement() {
  console.log('🔄 Retroactively unlocking Practice Quiz achievements...\n');

  try {
    // Step 1: Find all users who have completed practice quizzes
    const { data: usersWithPractice, error: practiceError } = await supabase
      .from('quiz_practices')
      .select('user_id')
      .order('user_id');

    if (practiceError) {
      console.error('Error fetching practice quizzes:', practiceError);
      return;
    }

    // Get unique user IDs
    const uniqueUserIds = [...new Set(usersWithPractice.map(p => p.user_id))];
    console.log(`Found ${uniqueUserIds.length} users with practice quizzes\n`);

    for (const userId of uniqueUserIds) {
      console.log(`Processing user: ${userId}`);

      // Get user's email and profile
      const { data: userData } = await supabase.auth.admin.getUserById(userId);
      if (!userData || !userData.user) {
        console.log(`  ⚠️ Could not find auth user for ${userId}`);
        continue;
      }

      const userEmail = userData.user.email;
      console.log(`  Email: ${userEmail}`);

      // Get profile data
      const { data: profileData } = await supabase
        .from('master_users')
        .select('*')
        .eq('auth_user_id', userId)
        .single();

      if (!profileData) {
        console.log(`  ⚠️ No profile found`);
        continue;
      }

      // Get or create kiosk user
      let kioskUserId = null;

      const { data: existingKioskUser } = await supabase
        .from('master_users')
        .select('id')
        .eq('email', userEmail)
        .maybeSingle();

      if (existingKioskUser) {
        kioskUserId = existingKioskUser.id;
        console.log(`  Found kiosk_user_id: ${kioskUserId}`);
      } else {
        // Create kiosk user
        const { data: newKioskUser } = await supabase
          .from('master_users')
          .insert({
            site_id: profileData.site_id || 1,
            full_name: profileData.full_name || userEmail.split('@')[0],
            email: userEmail,
            role: profileData.role || 'staff',
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (newKioskUser) {
          kioskUserId = newKioskUser.id;
          console.log(`  Created kiosk_user_id: ${kioskUserId}`);
        }
      }

      if (!kioskUserId) {
        console.log(`  ⚠️ Could not get/create kiosk user`);
        continue;
      }

      // Check if achievement already exists
      const { data: existingAchievement } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('kiosk_user_id', kioskUserId)
        .eq('achievement_key', 'first_practice_quiz')
        .maybeSingle();

      if (existingAchievement) {
        console.log(`  ✅ Achievement already unlocked`);
      } else {
        // Unlock the achievement
        const { error: achievementError } = await supabase
          .from('user_achievements')
          .upsert({
            kiosk_user_id: kioskUserId,
            achievement_key: 'first_practice_quiz',
            status: 'unlocked',
            progress_percent: 100,
            unlocked_at: new Date().toISOString()
          }, {
            onConflict: 'kiosk_user_id,achievement_key'
          });

        if (achievementError) {
          console.log(`  ❌ Error unlocking achievement:`, achievementError);
        } else {
          console.log(`  🏆 Achievement unlocked!`);
        }
      }

      console.log('');
    }

    console.log('✅ Retroactive unlock process complete!');

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

retroactiveUnlockPracticeAchievement().catch(console.error);