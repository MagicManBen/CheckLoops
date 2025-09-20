import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://unveoqnlqnobufhublyw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMTcyNzYsImV4cCI6MjA3MDU5MzI3Nn0.g93OsXDpO3V9DToU7s-Z3SwBBnB84rBv0JMv-idgSME';

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearQuizStatus() {
  console.log('🔄 Clearing quiz status for benhowardmagic@hotmail.com...');
  
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
    
    // Set the next_quiz_due date to yesterday to make the quiz available immediately
    // and clear the last_required_quiz_at field to make it appear as if no quiz has been taken
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Update the master_users table
    const { error: updateError } = await supabase
      .from('master_users')
      .update({
        next_quiz_due: yesterday.toISOString(),
        last_required_quiz_at: null // Clear the last quiz completion date
      })
      .eq('auth_user_id', userId);
    
    if (updateError) {
      console.error('❌ Error resetting quiz status:', updateError);
      return;
    }
    
    console.log('✅ Quiz status reset successfully!');
    
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
    
    console.log('📊 Updated quiz status:');
    console.log(`Next quiz due: ${verifyData.next_quiz_due}`);
    console.log(`Last required quiz: ${verifyData.last_required_quiz_at || 'Not completed'}`);
    
    console.log('🎯 The user can now take a new quiz!');
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

clearQuizStatus();