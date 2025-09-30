import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://unveoqnlqnobufhublyw.supabase.co';
const supabaseAnonKey = 'sb_publishable_wpy7lxfbI2HwvsznlWJVKg_Zx7HnAc4';

// Use anon key to test RLS policies properly
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAvatarEmotionFix() {
  console.log('Testing avatar_emotion_changes table and RLS policies...\n');

  try {
    // First, sign in as a user to test RLS
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (!session) {
      console.log('No active session. Please sign in first to test RLS policies.');
      return;
    }

    console.log('Logged in as:', session.user.email);
    const userId = session.user.id;

    // Get user's site_id from master_users
    const { data: userData, error: userError } = await supabase
      .from('master_users')
      .select('site_id, auth_user_id')
      .eq('auth_user_id', userId)
      .single();

    if (userError) {
      console.error('Error fetching user data:', userError.message);
      return;
    }

    console.log('User site_id from master_users:', userData.site_id);
    console.log('Type of site_id:', typeof userData.site_id);

    // Test INSERT into avatar_emotion_changes
    console.log('\n1. Testing INSERT into avatar_emotion_changes...');
    const testData = {
      user_id: userId,
      site_id: String(userData.site_id), // Convert to string for TEXT column
      mood: 'happy',
      mood_name: 'Happy',
      avatar_url: 'https://example.com/avatar.png'
    };

    const { data: insertData, error: insertError } = await supabase
      .from('avatar_emotion_changes')
      .insert(testData)
      .select();

    if (insertError) {
      console.error('INSERT failed:', insertError.message);
      console.error('This is the type mismatch error we need to fix!');
    } else {
      console.log('INSERT successful!');
      console.log('Inserted record:', insertData);
    }

    // Test SELECT from avatar_emotion_changes
    console.log('\n2. Testing SELECT from avatar_emotion_changes...');
    const { data: selectData, error: selectError } = await supabase
      .from('avatar_emotion_changes')
      .select('*')
      .eq('site_id', String(userData.site_id));

    if (selectError) {
      console.error('SELECT failed:', selectError.message);
      console.error('RLS policy issue - the IN clause is comparing TEXT with INTEGER!');
    } else {
      console.log('SELECT successful!');
      console.log(`Found ${selectData.length} records`);
    }

    // Test the realtime subscription
    console.log('\n3. Testing realtime subscription...');
    const channel = supabase
      .channel('test-avatar-changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'avatar_emotion_changes',
        filter: `site_id=eq.${String(userData.site_id)}`
      }, (payload) => {
        console.log('Realtime event received:', payload);
      })
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    // Clean up
    setTimeout(() => {
      channel.unsubscribe();
      console.log('\nTest complete!');
    }, 2000);

  } catch (err) {
    console.error('Test error:', err);
  }
}

testAvatarEmotionFix();