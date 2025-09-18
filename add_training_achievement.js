import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://unveoqnlqnobufhublyw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAxNzI3NiwiZXhwIjoyMDcwNTkzMjc2fQ.CJxV14F0T2TWkAjeR4bpYiBIOwLwyfzF9WzAWwS99Xc';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addTrainingAchievement() {
  console.log('📚 Adding First Training Upload achievement...\n');

  try {
    // Remove points from existing achievements
    console.log('Removing points from existing achievements...');
    const { error: updateError } = await supabase
      .from('achievements')
      .update({ points: 0 })
      .neq('key', 'none'); // Update all

    if (updateError) {
      console.error('Error updating achievements:', updateError);
    }

    // Insert the new achievement
    const { error: insertError } = await supabase
      .from('achievements')
      .insert({
        key: 'first_training_upload',
        name: 'Training Champion',
        description: 'Uploaded your first training record!',
        icon: 'certificate',
        points: 0,
        metadata: { category: 'milestone' }
      });

    if (insertError) {
      console.error('Error inserting achievement:', insertError);
      return;
    }

    console.log('✅ Added First Training Upload achievement\n');

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
      console.log(`  Icon: ${achievement.icon}\n`);
    });

    console.log('✅ Achievement added successfully!');

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

addTrainingAchievement().catch(console.error);