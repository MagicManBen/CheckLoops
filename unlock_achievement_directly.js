import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://unveoqnlqnobufhublyw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAxNzI3NiwiZXhwIjoyMDcwNTkzMjc2fQ.CJxV14F0T2TWkAjeR4bpYiBIOwLwyfzF9WzAWwS99Xc';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function unlockAchievementDirectly() {
  console.log('🏆 Unlocking Practice Quiz achievement directly...\n');

  const kioskUserId = 46; // From the profile data

  try {
    // Check if achievement already exists
    const { data: existingAchievement } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('kiosk_user_id', kioskUserId)
      .eq('achievement_key', 'first_practice_quiz')
      .maybeSingle();

    if (existingAchievement) {
      console.log('✅ Achievement already exists:', existingAchievement);
      return;
    }

    // Unlock the achievement
    const { data: achievementData, error: achievementError } = await supabase
      .from('user_achievements')
      .insert({
        kiosk_user_id: kioskUserId,
        achievement_key: 'first_practice_quiz',
        status: 'unlocked',
        progress_percent: 100,
        unlocked_at: new Date().toISOString()
      })
      .select();

    if (achievementError) {
      console.error('Error unlocking achievement:', achievementError);
    } else {
      console.log('✅ Achievement unlocked successfully!', achievementData);
    }

    // Also check/unlock onboarding achievement if needed
    const { data: onboardingAchievement } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('kiosk_user_id', kioskUserId)
      .eq('achievement_key', 'onboarding_completion')
      .maybeSingle();

    if (!onboardingAchievement) {
      const { data: onboardingData, error: onboardingError } = await supabase
        .from('user_achievements')
        .insert({
          kiosk_user_id: kioskUserId,
          achievement_key: 'onboarding_completion',
          status: 'unlocked',
          progress_percent: 100,
          unlocked_at: new Date().toISOString()
        })
        .select();

      if (onboardingError) {
        console.error('Error unlocking onboarding achievement:', onboardingError);
      } else {
        console.log('✅ Onboarding achievement also unlocked!', onboardingData);
      }
    }

    // List all achievements for this user
    const { data: allAchievements } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('kiosk_user_id', kioskUserId);

    console.log('\n📋 All achievements for kiosk_user_id', kioskUserId + ':');
    allAchievements?.forEach(a => {
      console.log(`- ${a.achievement_key}: ${a.status} (${a.progress_percent}%)`);
    });

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

unlockAchievementDirectly().catch(console.error);