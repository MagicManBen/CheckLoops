import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://unveoqnlqnobufhublyw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMTcyNzYsImV4cCI6MjA3MDU5MzI3Nn0.g93OsXDpO3V9DToU7s-Z3SwBBnB84rBv0JMv-idgSME';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyQuizStatus() {
  console.log('Verifying quiz status for benhowardmagic@hotmail.com...');
  
  try {
    // Login as admin first
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'benhowardmagic@hotmail.com',
      password: 'Hello1!'
    });

    if (authError) {
      console.error('Auth error:', authError);
      return;
    }

    console.log('Successfully logged in as admin');
    
    // Get current quiz status
    const { data: masterUser, error: userError } = await supabase
      .from('master_users')
      .select('next_quiz_due, last_required_quiz_at')
      .eq('auth_user_id', authData.user.id)
      .maybeSingle();
    
    if (userError) {
      console.error('Error fetching user data:', userError);
      return;
    }
    
    console.log('Current quiz status:');
    console.log(`Next quiz due: ${masterUser.next_quiz_due}`);
    console.log(`Last required quiz: ${masterUser.last_required_quiz_at}`);
    
    // Check if quiz is completed
    if (masterUser.last_required_quiz_at) {
      const completedDate = new Date(masterUser.last_required_quiz_at);
      const formattedDate = completedDate.toLocaleString();
      console.log(`Quiz completed on: ${formattedDate}`);
    } else {
      console.log('No quiz completion record found.');
    }
    
    // Check if quiz is due
    const now = new Date();
    const nextDue = new Date(masterUser.next_quiz_due);
    
    if (now >= nextDue) {
      console.log('QUIZ STATUS: Due now! The user can take the quiz.');
    } else {
      const daysUntilDue = Math.ceil((nextDue - now) / (1000 * 60 * 60 * 24));
      console.log(`QUIZ STATUS: Not due yet. Due in ${daysUntilDue} days.`);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

verifyQuizStatus();