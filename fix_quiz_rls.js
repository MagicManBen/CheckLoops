import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://unveoqnlqnobufhublyw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMTcyNzYsImV4cCI6MjA3MDU5MzI3Nn0.g93OsXDpO3V9DToU7s-Z3SwBBnB84rBv0JMv-idgSME';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixQuizAttemptsRLS() {
  console.log('🔐 Logging in as admin...');

  // Login as admin first
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'benhowardmagic@hotmail.com',
    password: 'Hello1!'
  });

  if (authError) {
    console.error('❌ Auth error:', authError);
    process.exit(1);
  }

  console.log('✅ Logged in successfully');
  console.log('🔧 Applying RLS policies for quiz_attempts table...');

  const sql = fs.readFileSync('fix_quiz_attempts_rls.sql', 'utf8');

  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql: sql });
    
    if (error) {
      console.error('❌ Error applying RLS policies:', error);
    } else {
      console.log('✅ RLS policies applied successfully!');
      
      // Verify the policies were created
      const verifyResult = await supabase.rpc('exec_sql', {
        sql: "SELECT polname, polcmd FROM pg_policy WHERE polrelid = 'public.quiz_attempts'::regclass;"
      });
      
      if (verifyResult.data) {
        console.log('📋 Current policies on quiz_attempts table:');
        verifyResult.data.forEach(policy => {
          console.log(`  - ${policy.polname} (${policy.polcmd})`);
        });
      }
      
      // Test if we can now insert a quiz attempt
      console.log('\n🧪 Testing quiz attempt insertion...');
      
      const testData = {
        user_id: authData.user.id,
        site_id: 2,
        participant_name: authData.user.email || 'Test User',
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        total_questions: 1,
        correct_answers: 1,
        is_practice: false
      };
      
      const { data: insertData, error: insertError } = await supabase
        .from('quiz_attempts')
        .insert(testData)
        .select();
        
      if (insertError) {
        console.error('❌ Test insertion failed:', insertError);
      } else {
        console.log('✅ Test insertion successful!', insertData[0]?.id);
        
        // Clean up the test record
        await supabase
          .from('quiz_attempts')
          .delete()
          .eq('id', insertData[0]?.id);
        console.log('🧹 Cleaned up test record');
      }
    }
  } catch (err) {
    console.error('💥 Exception:', err);
  }
}

fixQuizAttemptsRLS();