import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://unveoqnlqnobufhublyw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAxNzI3NiwiZXhwIjoyMDcwNTkzMjc2fQ.CJxV14F0T2TWkAjeR4bpYiBIOwLwyfzF9WzAWwS99Xc';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addPracticeQuizAchievement() {
  console.log('🎯 Adding First Practice Quiz achievement...\n');

  try {
    // Insert the new achievement
    const { error: insertError } = await supabase
      .from('achievements')
      .insert({
        key: 'first_practice_quiz',
        name: 'Practice Makes Perfect',
        description: 'Completed your first practice quiz to sharpen your skills!',
        icon: 'star',
        points: 15,
        metadata: { category: 'milestone' }
      });

    if (insertError) {
      console.error('Error inserting achievement:', insertError);
      return;
    }

    console.log('✅ Added First Practice Quiz achievement\n');

    // Verify the changes
    const { data: achievements, error: verifyError } = await supabase
      .from('achievements')
      .select('*')
      .order('key');

    if (verifyError) {
      console.error('Error verifying:', verifyError);
      return;
    }

    console.log('📋 Current achievements in database:');
    achievements.forEach(achievement => {
      console.log(`- ${achievement.name} (${achievement.key})`);
      console.log(`  ${achievement.description}`);
      console.log(`  Icon: ${achievement.icon}, Points: ${achievement.points}\n`);
    });

    console.log('✅ Achievement added successfully!');

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

addPracticeQuizAchievement().catch(console.error);