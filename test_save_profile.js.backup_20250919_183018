import { createClient } from '@supabase/supabase-js';

async function testProfileSave() {
  const supabaseUrl = 'https://unveoqnlqnobufhublyw.supabase.co';
  const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMTcyNzYsImV4cCI6MjA3MDU5MzI3Nn0.g93OsXDpO3V9DToU7s-Z3SwBBnB84rBv0JMv-idgSME';
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  console.log('=== TEST PROFILE SAVE ===\n');

  // Authenticate
  const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
    email: 'benhowardmagic@hotmail.com',
    password: 'Hello1!'
  });

  if (!user) {
    console.error('Authentication failed:', authError);
    return;
  }

  console.log('1. Authenticated as:', user.email);
  console.log('   User ID:', user.id);

  // Test 1: Check if profile exists
  console.log('\n2. Checking existing profile...');
  const { data: existingProfile, error: selectError } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (selectError) {
    console.error('   Error selecting profile:', selectError);
  } else if (existingProfile) {
    console.log('   Profile exists:', existingProfile);
  } else {
    console.log('   No profile found');
  }

  // Test 2: Try to upsert profile
  console.log('\n3. Attempting to upsert profile...');
  const testNickname = 'TestNick_' + Date.now();
  const profileData = {
    user_id: user.id,
    nickname: testNickname,
    full_name: 'Test User',
    site_id: 2,
    role: 'staff'
  };

  console.log('   Data to save:', profileData);

  const { data: upsertResult, error: upsertError } = await supabase
    .from('profiles')
    .upsert(profileData)
    .select();

  if (upsertError) {
    console.error('   ❌ Upsert error:', upsertError);
    console.error('   Error code:', upsertError.code);
    console.error('   Error message:', upsertError.message);
  } else {
    console.log('   ✅ Upsert successful:', upsertResult);
  }

  // Test 3: Verify the save
  console.log('\n4. Verifying save...');
  const { data: verifyProfile, error: verifyError } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (verifyError) {
    console.error('   Error verifying:', verifyError);
  } else if (verifyProfile) {
    console.log('   Profile after save:', verifyProfile);
    if (verifyProfile.nickname === testNickname) {
      console.log('   ✅ Nickname saved correctly!');
    } else {
      console.log('   ❌ Nickname not saved as expected');
    }
  }

  console.log('\n=== TEST COMPLETE ===');
  await supabase.auth.signOut();
}

testProfileSave().catch(console.error);
