// Use the correct Supabase credentials
const SUPABASE_URL = 'https://unveoqnlqnobufhublyw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMTcyNzYsImV4cCI6MjA3MDU5MzI3Nn0.g93OsXDpO3V9DToU7s-Z3SwBBnB84rBv0JMv-idgSME';

async function removeTestAttempts() {
    const testEmail = 'benhowardmagic@hotmail.com';
    
    console.log(`Removing quiz attempts for ${testEmail}...`);
    
    try {
        // First authenticate
        console.log('🔐 Authenticating...');
        const authResponse = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: testEmail,
                password: 'Hello1!'
            })
        });
        
        const authData = await authResponse.json();
        if (!authResponse.ok) {
            console.error('Authentication failed:', authData);
            return;
        }
        
        const accessToken = authData.access_token;
        const userId = authData.user.id;
        console.log('✅ Authentication successful');
        
        // First, let's see what attempts exist in quiz_attempts
        console.log('\n🔍 Checking existing quiz_attempts...');
        const fetchResponse = await fetch(`${SUPABASE_URL}/rest/v1/quiz_attempts?user_id=eq.${userId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'apikey': SUPABASE_ANON_KEY,
                'Content-Type': 'application/json'
            }
        });
        
        if (fetchResponse.ok) {
            const existingAttempts = await fetchResponse.json();
            console.log('   Found attempts in quiz_attempts:', existingAttempts.length);
            
            if (existingAttempts.length > 0) {
                // Delete attempts
                console.log('🗑️ Removing quiz_attempts...');
                const deleteResponse = await fetch(`${SUPABASE_URL}/rest/v1/quiz_attempts?user_id=eq.${userId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'apikey': SUPABASE_ANON_KEY
                    }
                });
                
                if (deleteResponse.ok) {
                    console.log('✅ Successfully removed attempts from quiz_attempts');
                } else {
                    console.log('❌ Error deleting from quiz_attempts:', await deleteResponse.text());
                }
            }
        } else {
            console.log('⚠️ Could not fetch from quiz_attempts (might be the kiosk_users issue)');
        }
        
        // Check and clean quiz_practices table
        console.log('\n🔍 Checking existing quiz_practices...');
        const practiceResponse = await fetch(`${SUPABASE_URL}/rest/v1/quiz_practices?email=eq.${testEmail}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'apikey': SUPABASE_ANON_KEY,
                'Content-Type': 'application/json'
            }
        });
        
        if (practiceResponse.ok) {
            const practiceAttempts = await practiceResponse.json();
            console.log('   Found attempts in quiz_practices:', practiceAttempts.length);
            
            if (practiceAttempts.length > 0) {
                console.log('🗑️ Removing quiz_practices...');
                const deletePracticeResponse = await fetch(`${SUPABASE_URL}/rest/v1/quiz_practices?email=eq.${testEmail}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'apikey': SUPABASE_ANON_KEY
                    }
                });
                
                if (deletePracticeResponse.ok) {
                    console.log('✅ Successfully removed attempts from quiz_practices');
                } else {
                    console.log('❌ Error deleting from quiz_practices:', await deletePracticeResponse.text());
                }
            }
        } else {
            console.log('⚠️ Could not fetch from quiz_practices:', await practiceResponse.text());
        }
        
        // Reset quiz completion status in master_users
        console.log('\n🔄 Resetting quiz status in master_users...');
        const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/master_users?email=eq.${testEmail}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'apikey': SUPABASE_ANON_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                quiz_completion: null,
                quiz_score: null,
                quiz_completed_at: null
            })
        });
        
        if (updateResponse.ok) {
            console.log('✅ Successfully reset quiz status in master_users');
        } else {
            console.log('❌ Error updating master_users:', await updateResponse.text());
        }
        
        console.log('\n🎉 Cleanup complete! You can now test quiz submissions fresh.');
        
    } catch (error) {
        console.error('❌ Unexpected error:', error);
    }
}

removeTestAttempts();