import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://unveoqnlqnobufhublyw.supabase.co';
const supabaseServiceKey = 'sb_secret_ylIhDtikpno4LTTUmpDJvw_Ov7BtIEp';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTables() {
  console.log('Checking Supabase tables structure...\n');

  try {
    // Check activity_likes table
    console.log('1. Checking activity_likes table:');
    const { data: likesData, error: likesError } = await supabase
      .from('activity_likes')
      .select('*')
      .limit(1);

    if (likesError) {
      console.log('Error fetching activity_likes:', likesError.message);
    } else {
      console.log('activity_likes columns:', likesData.length > 0 ? Object.keys(likesData[0]) : 'Table exists but is empty');
    }

    // Check master_users table
    console.log('\n2. Checking master_users table:');
    const { data: usersData, error: usersError } = await supabase
      .from('master_users')
      .select('*')
      .limit(1);

    if (usersError) {
      console.log('Error fetching master_users:', usersError.message);
    } else {
      console.log('master_users columns:', usersData.length > 0 ? Object.keys(usersData[0]) : 'Table exists but is empty');
    }

    // Check avatar_emotion_changes table
    console.log('\n3. Checking avatar_emotion_changes table:');
    const { data: emotionData, error: emotionError } = await supabase
      .from('avatar_emotion_changes')
      .select('*')
      .limit(1);

    if (emotionError) {
      console.log('Error fetching avatar_emotion_changes:', emotionError.message);
    } else {
      console.log('avatar_emotion_changes columns:', emotionData.length > 0 ? Object.keys(emotionData[0]) : 'Table exists but is empty');
    }

    // Check if we can manually join activity_likes with master_users
    console.log('\n4. Testing manual join between activity_likes and master_users:');

    // First get an activity like
    const { data: likeData, error: likeError } = await supabase
      .from('activity_likes')
      .select('*')
      .limit(1);

    if (likeError) {
      console.log('Error fetching activity_likes:', likeError.message);
    } else if (likeData && likeData.length > 0) {
      const like = likeData[0];
      console.log('Found a like:', like);

      // Now get the user data for this like
      const { data: userData, error: userError } = await supabase
        .from('master_users')
        .select('nickname, full_name, avatar_url')
        .eq('auth_user_id', like.user_id)
        .single();

      if (userError) {
        console.log('Error fetching user data:', userError.message);
      } else {
        console.log('User data for the like:', userData);
      }
    } else {
      console.log('No activity likes found');
    }

  } catch (err) {
    console.error('Error:', err);
  }
}

checkTables();