import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://unveoqnlqnobufhublyw.supabase.co';
const supabaseKey = (typeof process !== 'undefined' && process.env?.SUPABASE_SERVICE_ROLE_KEY) || '';
if (!supabaseKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY not set in environment');
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function findAllProfilesReferences() {
    console.log('\n=== COMPREHENSIVE SCAN FOR PROFILES REFERENCES ===\n');

    // 1. Check all functions
    console.log('1. Checking Functions...');
    try {
        const { data: functions, error } = await supabase.rpc('exec_sql', {
            sql: `
                SELECT
                    p.proname AS function_name,
                    CASE
                        WHEN pg_get_functiondef(p.oid) LIKE '%profiles%'
                        THEN 'REFERENCES PROFILES'
                        ELSE 'OK'
                    END as status
                FROM pg_proc p
                JOIN pg_namespace n ON p.pronamespace = n.oid
                WHERE n.nspname = 'public'
                AND pg_get_functiondef(p.oid) LIKE '%profiles%'
            `
        });

        if (functions && functions.length > 0) {
            console.log('❌ Functions still referencing profiles:');
            functions.forEach(f => console.log(`   - ${f.function_name}: ${f.status}`));
        } else {
            console.log('✅ No functions reference profiles');
        }
    } catch (e) {
        // Try alternative approach
        console.log('Checking specific functions...');
        const functionsToCheck = [
            'transfer_fuzzy_match_to_request',
            'transfer_fuzzy_training_to_record'
        ];

        for (const funcName of functionsToCheck) {
            try {
                // Try to get function definition
                const { data, error } = await supabase.rpc('exec_sql', {
                    sql: `SELECT pg_get_functiondef(p.oid) as definition
                          FROM pg_proc p
                          JOIN pg_namespace n ON p.pronamespace = n.oid
                          WHERE n.nspname = 'public' AND p.proname = '${funcName}'`
                });

                if (data && data.length > 0) {
                    const def = data[0].definition;
                    if (def && def.includes('profiles')) {
                        console.log(`❌ ${funcName}: STILL REFERENCES PROFILES`);
                        console.log('   Found in definition:', def.substring(def.indexOf('profiles') - 20, def.indexOf('profiles') + 30));
                    } else {
                        console.log(`✅ ${funcName}: OK`);
                    }
                }
            } catch (err) {
                console.log(`   Could not check ${funcName}:`, err.message);
            }
        }
    }

    // 2. Check all views
    console.log('\n2. Checking Views...');
    try {
        const { data: views, error } = await supabase.rpc('exec_sql', {
            sql: `
                SELECT viewname
                FROM pg_views
                WHERE schemaname = 'public'
                AND pg_get_viewdef((schemaname||'.'||viewname)::regclass) LIKE '%profiles%'
            `
        });

        if (views && views.length > 0) {
            console.log('❌ Views referencing profiles:', views.map(v => v.viewname).join(', '));
        } else {
            console.log('✅ No views reference profiles');
        }
    } catch (e) {
        console.log('Could not check views:', e.message);
    }

    // 3. Check all triggers
    console.log('\n3. Checking Triggers...');
    try {
        const { data: triggers, error } = await supabase.rpc('exec_sql', {
            sql: `
                SELECT t.tgname
                FROM pg_trigger t
                WHERE NOT t.tgisinternal
                AND pg_get_triggerdef(t.oid) LIKE '%profiles%'
            `
        });

        if (triggers && triggers.length > 0) {
            console.log('❌ Triggers referencing profiles:', triggers.map(t => t.tgname).join(', '));
        } else {
            console.log('✅ No triggers reference profiles');
        }
    } catch (e) {
        console.log('Could not check triggers:', e.message);
    }

    // 4. Check RLS policies
    console.log('\n4. Checking RLS Policies...');
    try {
        const { data: policies, error } = await supabase.rpc('exec_sql', {
            sql: `
                SELECT DISTINCT tablename, policyname
                FROM pg_policies
                WHERE schemaname = 'public'
                AND (qual::text LIKE '%profiles%' OR with_check::text LIKE '%profiles%')
            `
        });

        if (policies && policies.length > 0) {
            console.log('❌ Policies referencing profiles:');
            policies.forEach(p => console.log(`   - ${p.tablename}.${p.policyname}`));
        } else {
            console.log('✅ No policies reference profiles');
        }
    } catch (e) {
        console.log('Could not check policies:', e.message);
    }

    // 5. Test specific problem areas
    console.log('\n5. Testing Problem Areas...');
    const problemQueries = [
        { name: 'master_users', query: () => supabase.from('master_users').select('*').limit(1) },
        { name: 'complaints', query: () => supabase.from('complaints').select('*').limit(1) },
        { name: 'training_records', query: () => supabase.from('training_records').select('*').limit(1) },
        { name: 'profiles (should fail)', query: () => supabase.from('profiles').select('*').limit(1) }
    ];

    for (const test of problemQueries) {
        try {
            const { data, error } = await test.query();
            if (error) {
                if (test.name.includes('profiles')) {
                    console.log(`✅ ${test.name}: Correctly fails with "${error.message}"`);
                } else {
                    console.log(`❌ ${test.name}: ERROR - ${error.message}`);
                }
            } else {
                console.log(`✅ ${test.name}: Works`);
            }
        } catch (e) {
            console.log(`❌ ${test.name}: ${e.message}`);
        }
    }

    console.log('\n=== END SCAN ===\n');
}

findAllProfilesReferences().catch(console.error);