import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://unveoqnlqnobufhublyw.supabase.co';
const supabaseServiceKey = (typeof process !== 'undefined' && process.env?.SUPABASE_SERVICE_ROLE_KEY) || '';
if (!supabaseServiceKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY not set in environment');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAchievements() {
  console.log('🏆 Checking current achievements in database...\n');

  // Get all achievements
  const { data: achievements, error } = await supabase
    .from('achievements')
    .select('*')
    .order('key');

  if (error) {
    console.error('Error fetching achievements:', error);
    return;
  }

  console.log(`Found ${achievements.length} achievements:\n`);

  achievements.forEach(achievement => {
    console.log(`Key: ${achievement.key}`);
    console.log(`Name: ${achievement.name}`);
    console.log(`Description: ${achievement.description}`);
    console.log(`Icon: ${achievement.icon}`);
    console.log(`Points: ${achievement.points}`);
    console.log(`Metadata:`, achievement.metadata);
    console.log('---');
  });

  // Check if there are any user_achievements
  const { data: userAchievements, error: userError } = await supabase
    .from('user_achievements')
    .select('*')
    .limit(5);

  console.log('\n📊 Sample user achievements:');
  if (userAchievements && userAchievements.length > 0) {
    console.log(`Found ${userAchievements.length} user achievement records (showing first 5)`);
  } else {
    console.log('No user achievements found');
  }
}

checkAchievements().catch(console.error);