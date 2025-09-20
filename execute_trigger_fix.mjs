// Execute the FIX_INSTEAD_OF_TRIGGERS.sql to resolve duplicate key constraint violations
import fetch from 'node-fetch';
import { readFileSync } from 'fs';

const SUPABASE_URL = 'https://unveoqnlqnobufhublyw.supabase.co';
const SERVICE_ROLE_KEY = (typeof process !== 'undefined' && process.env?.SUPABASE_SERVICE_ROLE_KEY) || '';
if (!SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY not set in environment');
}

async function executeTriggerFix() {
    console.log('🔧 Executing INSTEAD OF trigger fixes...\n');

    try {
        // Read the SQL file content
        const sqlContent = readFileSync('./FIX_INSTEAD_OF_TRIGGERS.sql', 'utf8');

        // Split into individual statements (rough split on semicolons followed by newlines)
        const statements = sqlContent
            .split(/;\s*\n/)
            .map(stmt => stmt.trim())
            .filter(stmt => stmt && !stmt.startsWith('--') && stmt !== '');

        console.log(`📋 Found ${statements.length} SQL statements to execute\n`);

        // Execute each statement
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i] + (statements[i].endsWith(';') ? '' : ';');

            console.log(`🔨 Executing statement ${i + 1}/${statements.length}:`);
            console.log(`   ${statement.substring(0, 60)}${statement.length > 60 ? '...' : ''}`);

            try {
                const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
                        'Content-Type': 'application/json',
                        'apikey': SERVICE_ROLE_KEY
                    },
                    body: JSON.stringify({
                        sql: statement
                    })
                });

                if (response.ok) {
                    console.log('   ✅ Success');
                } else {
                    const error = await response.text();
                    console.log('   ❌ Failed:', error);

                    // Try alternative approach
                    console.log('   🔄 Trying alternative execution...');
                    const altResponse = await fetch(`${SUPABASE_URL}/sql`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
                            'Content-Type': 'text/plain',
                            'apikey': SERVICE_ROLE_KEY
                        },
                        body: statement
                    });

                    if (altResponse.ok) {
                        console.log('   ✅ Success (alternative method)');
                    } else {
                        console.log('   ❌ Alternative also failed:', await altResponse.text());
                    }
                }
            } catch (error) {
                console.log('   ❌ Error:', error.message);
            }

            console.log('');
        }

        // Verify the fixes worked
        console.log('🧪 Testing if triggers are now working...');
        await testTriggers();

    } catch (error) {
        console.error('❌ Error reading or executing SQL:', error.message);
    }
}

async function testTriggers() {
    try {
        // Try a simple upsert to profiles view to test if the trigger works
        const testData = {
            user_id: '00000000-0000-0000-0000-000000000001', // Test UUID
            site_id: 1,
            full_name: 'Test Trigger User',
            role: 'staff',
            active: true
        };

        const response = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
                'Content-Type': 'application/json',
                'apikey': SERVICE_ROLE_KEY,
                'Prefer': 'resolution=merge-duplicates'
            },
            body: JSON.stringify(testData)
        });

        if (response.ok) {
            console.log('✅ Trigger test successful! Upsert worked.');

            // Clean up test data
            await fetch(`${SUPABASE_URL}/rest/v1/master_users?auth_user_id=eq.00000000-0000-0000-0000-000000000001`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
                    'apikey': SERVICE_ROLE_KEY
                }
            });
            console.log('🧹 Test data cleaned up.');

        } else {
            const error = await response.text();
            console.log('❌ Trigger test failed:', error);
        }

    } catch (error) {
        console.log('❌ Error testing triggers:', error.message);
    }
}

// Run the fix
executeTriggerFix().catch(console.error);