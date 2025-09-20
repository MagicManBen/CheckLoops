import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://unveoqnlqnobufhublyw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMTcyNzYsImV4cCI6MjA3MDU5MzI3Nn0.g93OsXDpO3V9DToU7s-Z3SwBBnB84rBv0JMv-idgSME';

const supabase = createClient(supabaseUrl, supabaseKey);

async function unlockQuizForAdmin() {
  console.log('🔓 Unlocking quiz for benhowardmagic@hotmail.com...');
  
  try {
    // Login as admin first
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'benhowardmagic@hotmail.com',
      password: 'Hello1!'
    });

    if (authError) {
      console.error('❌ Auth error:', authError);
      return;
    }

    console.log('✅ Successfully logged in as admin');
    
    // Get user ID
    const userId = authData.user.id;
    console.log(`🔑 User ID: ${userId}`);
    
    // Set next_quiz_due date to yesterday to make the quiz available immediately
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Update the master_users table to reset the quiz due date
    const { data: updateData, error: updateError } = await supabase
      .from('master_users')
      .update({
        next_quiz_due: yesterday.toISOString(),
        last_required_quiz_at: null // Optional: Reset the last quiz completion date
      })
      .eq('auth_user_id', userId);
    
    if (updateError) {
      console.error('❌ Error updating master_users:', updateError);
      return;
    }
    
    console.log('✅ Successfully reset quiz due date to:', yesterday.toISOString());
    console.log('🎉 User can now take the quiz again');
    
    // Verify the update
    const { data: verifyData, error: verifyError } = await supabase
      .from('master_users')
      .select('next_quiz_due, last_required_quiz_at')
      .eq('auth_user_id', userId)
      .maybeSingle();
    
    if (verifyError) {
      console.error('❌ Error verifying update:', verifyError);
      return;
    }
    
    console.log('📊 Updated user data:');
    console.log(`Next quiz due: ${verifyData.next_quiz_due}`);
    console.log(`Last required quiz: ${verifyData.last_required_quiz_at}`);
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

unlockQuizForAdmin();