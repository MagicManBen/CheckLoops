import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://unveoqnlqnobufhublyw.supabase.co';
const supabaseKey = (typeof process !== 'undefined' && process.env?.SUPABASE_SERVICE_ROLE_KEY) || '';
if (!supabaseKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY not set in environment');
}

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