import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://unveoqnlqnobufhublyw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU4NzY5ODksImV4cCI6MjA0MTQ1Mjk4OX0.H1gJ8lYqD0aIsGkxgNiO1dTv7KMOeR_8kD2z6m-3UGc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function disableRLS() {
    const tables = [
        'holiday_entitlements',
        'holiday_requests', 
        'holiday_request_days',
        'profiles'
    ];

    console.log('🔓 Disabling Row Level Security on holiday tables...');
    
    for (const table of tables) {
        try {
            console.log(`⚙️ Disabling RLS on ${table}...`);
            
            // Disable RLS using raw SQL
            const { error } = await supabase.rpc('exec_sql', {
                sql: `ALTER TABLE ${table} DISABLE ROW LEVEL SECURITY;`
            });
            
            if (error) {
                console.error(`❌ Error disabling RLS on ${table}:`, error);
            } else {
                console.log(`✅ RLS disabled on ${table}`);
            }
        } catch (err) {
            console.error(`❌ Exception disabling RLS on ${table}:`, err);
        }
    }
}

// Run the disable function
disableRLS().then(() => {
    console.log('🎉 RLS disable process completed');
}).catch(err => {
    console.error('💥 RLS disable failed:', err);
});