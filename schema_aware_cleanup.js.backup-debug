// Check actual table schemas and clean up properly
const SUPABASE_URL = 'https://unveoqnlqnobufhublyw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMTcyNzYsImV4cCI6MjA3MDU5MzI3Nn0.g93OsXDpO3V9DToU7s-Z3SwBBnB84rBv0JMv-idgSME';

async function checkAndCleanup() {
    const testEmail = 'benhowardmagic@hotmail.com';
    
    console.log(`Checking and cleaning up for ${testEmail}...`);
    
    try {
        // Authenticate
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
        const accessToken = authData.access_token;
        const userId = authData.user.id;
        console.log('✅ Authentication successful, User ID:', userId);
        
        // Check master_users current state
        console.log('\n📊 Checking master_users current state...');
        const userResponse = await fetch(`${SUPABASE_URL}/rest/v1/master_users?email=eq.${testEmail}&select=*`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'apikey': SUPABASE_ANON_KEY
            }
        });
        
        if (userResponse.ok) {
            const userData = await userResponse.json();
            console.log('   Current user data:', JSON.stringify(userData[0], null, 2));
            
            // Reset quiz-related fields that exist
            const resetFields = {};
            if (userData[0].quiz_completion !== undefined) resetFields.quiz_completion = null;
            if (userData[0].quiz_score !== undefined) resetFields.quiz_score = null;
            if (userData[0].quiz_completed_at !== undefined) resetFields.quiz_completed_at = null;
            
            if (Object.keys(resetFields).length > 0) {
                console.log('🔄 Resetting fields:', Object.keys(resetFields));
                const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/master_users?email=eq.${testEmail}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'apikey': SUPABASE_ANON_KEY,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(resetFields)
                });
                
                if (updateResponse.ok) {
                    console.log('✅ Successfully reset quiz fields in master_users');
                } else {
                    console.log('❌ Error updating master_users:', await updateResponse.text());
                }
            }
        }
        
        // Check quiz_practices with proper column
        console.log('\n📊 Checking quiz_practices...');
        const practiceResponse = await fetch(`${SUPABASE_URL}/rest/v1/quiz_practices?user_id=eq.${userId}&select=*`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'apikey': SUPABASE_ANON_KEY
            }
        });
        
        if (practiceResponse.ok) {
            const practiceData = await practiceResponse.json();
            console.log('   Found practice attempts:', practiceData.length);
            
            if (practiceData.length > 0) {
                console.log('🗑️ Removing practice attempts...');
                const deleteResponse = await fetch(`${SUPABASE_URL}/rest/v1/quiz_practices?user_id=eq.${userId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'apikey': SUPABASE_ANON_KEY
                    }
                });
                
                if (deleteResponse.ok) {
                    console.log('✅ Successfully removed practice attempts');
                } else {
                    console.log('❌ Error removing practice attempts:', await deleteResponse.text());
                }
            }
        } else {
            console.log('⚠️ Could not fetch quiz_practices:', await practiceResponse.text());
        }
        
        console.log('\n🎉 Cleanup complete! Ready for fresh testing.');
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

checkAndCleanup();