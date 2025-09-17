// Test if the user_id column was successfully added to kiosk_users
import fetch from 'node-fetch';

const SUPABASE_URL = 'https://unveoqnlqnobufhublyw.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAxNzI3NiwiZXhwIjoyMDcwNTkzMjc2fQ.CJxV14F0T2TWkAjeR4bpYiBIOwLwyfzF9WzAWwS99Xc';

async function testUserIdColumn() {
    console.log('🔍 Testing if user_id column was added to kiosk_users...\n');

    try {
        // Test if we can query by user_id
        const response = await fetch(`${SUPABASE_URL}/rest/v1/kiosk_users?select=id,user_id,holiday_approved&limit=5`, {
            headers: {
                'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
                'apikey': SERVICE_ROLE_KEY
            }
        });

        if (response.ok) {
            const data = await response.json();
            console.log('✅ user_id column exists!');
            console.log(`📊 Found ${data.length} records in kiosk_users`);
            
            if (data.length > 0) {
                console.log('📋 Sample records:');
                data.forEach((record, index) => {
                    console.log(`   ${index + 1}. ID: ${record.id}, user_id: ${record.user_id || 'NULL'}, holiday_approved: ${record.holiday_approved}`);
                });
                
                // Check if any records have user_id populated
                const recordsWithUserId = data.filter(r => r.user_id);
                console.log(`\n📈 ${recordsWithUserId.length} out of ${data.length} records have user_id populated`);
                
                if (recordsWithUserId.length === 0) {
                    console.log('\n⚠️ All user_id fields are NULL - need to populate them');
                    console.log('💡 The approval system needs user_id to link auth users to kiosk records');
                }
            } else {
                console.log('📭 No records in kiosk_users table');
            }
            
            return true;
            
        } else {
            const error = await response.text();
            console.log('❌ user_id column does not exist:', error);
            
            if (error.includes('user_id') && error.includes('does not exist')) {
                console.log('\n🔧 SOLUTION: You still need to run this SQL in Supabase:');
                console.log('   ALTER TABLE kiosk_users ADD COLUMN user_id UUID;');
            }
            
            return false;
        }

    } catch (error) {
        console.error('❌ Error testing user_id column:', error.message);
        return false;
    }
}

async function populateUserIds() {
    console.log('\n🔧 Attempting to populate user_id fields...');
    
    try {
        // Get all profiles with user_id and full_name
        const profilesResponse = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=user_id,full_name,site_id`, {
            headers: {
                'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
                'apikey': SERVICE_ROLE_KEY
            }
        });

        if (!profilesResponse.ok) {
            console.log('❌ Cannot access profiles table');
            return;
        }

        const profiles = await profilesResponse.json();
        console.log(`📊 Found ${profiles.length} profiles`);

        // Get all kiosk_users
        const kioskResponse = await fetch(`${SUPABASE_URL}/rest/v1/kiosk_users?select=id,full_name,site_id,user_id`, {
            headers: {
                'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
                'apikey': SERVICE_ROLE_KEY
            }
        });

        if (!kioskResponse.ok) {
            console.log('❌ Cannot access kiosk_users table');
            return;
        }

        const kioskUsers = await kioskResponse.json();
        console.log(`📊 Found ${kioskUsers.length} kiosk users`);

        // Match profiles to kiosk users by full_name and site_id
        let matchedCount = 0;
        for (const kiosk of kioskUsers) {
            if (kiosk.user_id) {
                console.log(`✅ ${kiosk.full_name} already has user_id`);
                continue;
            }

            // Find matching profile
            const matchingProfile = profiles.find(p => 
                p.full_name === kiosk.full_name && 
                p.site_id === kiosk.site_id
            );

            if (matchingProfile) {
                console.log(`🔗 Matching ${kiosk.full_name} (kiosk ID: ${kiosk.id}) with user_id: ${matchingProfile.user_id}`);
                
                // Update the kiosk record
                const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/kiosk_users?id=eq.${kiosk.id}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
                        'Content-Type': 'application/json',
                        'apikey': SERVICE_ROLE_KEY
                    },
                    body: JSON.stringify({
                        user_id: matchingProfile.user_id
                    })
                });

                if (updateResponse.ok) {
                    console.log(`✅ Updated ${kiosk.full_name} with user_id`);
                    matchedCount++;
                } else {
                    const error = await updateResponse.text();
                    console.log(`❌ Failed to update ${kiosk.full_name}: ${error}`);
                }
            } else {
                console.log(`⚠️ No matching profile found for ${kiosk.full_name} (site: ${kiosk.site_id})`);
            }
        }

        console.log(`\n📈 Successfully matched ${matchedCount} out of ${kioskUsers.length} kiosk users`);

    } catch (error) {
        console.error('❌ Error populating user_id fields:', error.message);
    }
}

// Run the tests
async function runTests() {
    const hasUserIdColumn = await testUserIdColumn();
    
    if (hasUserIdColumn) {
        await populateUserIds();
        
        // Re-test after population
        console.log('\n🔍 Final verification...');
        await testUserIdColumn();
    } else {
        console.log('\n❗ Cannot proceed - user_id column needs to be added first');
        console.log('📋 Run this SQL in Supabase SQL Editor:');
        console.log('   ALTER TABLE kiosk_users ADD COLUMN user_id UUID;');
    }
}

runTests().catch(console.error);