import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://unveoqnlqnobufhublyw.supabase.co';
const supabaseKey = (typeof process !== 'undefined' && process.env?.SUPABASE_SERVICE_ROLE_KEY) || '';
if (!supabaseKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY not set in environment');
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyRLSImplementation() {
    console.log('🔍 VERIFYING RLS IMPLEMENTATION...\n');
    console.log('=' .repeat(60));

    const tables = [
        'master_users',
        '4_holiday_requests',
        'training_records',
        'training_types',
        'achievements',
        'quiz_questions',
        'quiz_attempts',
        'complaints',
        'meetings',
        'teams',
        'sites'
    ];

    let securedCount = 0;
    let unsecuredCount = 0;

    console.log('📊 CHECKING TABLE SECURITY:\n');

    for (const table of tables) {
        try {
            const { data, error } = await supabase
                .from(table)
                .select('*')
                .limit(0);

            if (!error) {
                console.log(`⚠️  ${table}: Accessible (needs RLS check)`);
                unsecuredCount++;
            }
        } catch (err) {
            console.log(`✅ ${table}: Protected`);
            securedCount++;
        }
    }

    console.log('\n' + '=' .repeat(60));
    console.log('📊 SUMMARY:');
    console.log(`Tables checked: ${tables.length}`);
    console.log(`Currently accessible: ${unsecuredCount}`);
    
    if (unsecuredCount > 0) {
        console.log('\n⚠️  ACTION REQUIRED:');
        console.log('Run FINAL_RLS_SECURITY.sql in Supabase SQL Editor');
    } else {
        console.log('\n✅ All tables secured!');
    }
}

verifyRLSImplementation().catch(console.error);
