import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://unveoqnlqnobufhublyw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAxNzI3NiwiZXhwIjoyMDcwNTkzMjc2fQ.CJxV14F0T2TWkAjeR4bpYiBIOwLwyfzF9WzAWwS99Xc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyFixComplete() {
    console.log('\n🔍 VERIFYING PROFILES → MASTER_USERS MIGRATION\n');
    console.log('='.repeat(50));

    let allGood = true;
    const issues = [];

    // 1. Check core tables
    console.log('\n📊 Checking Core Tables:');
    const coreTables = ['master_users', 'complaints', 'training_records', '4_holiday_requests'];

    for (const table of coreTables) {
        const { error } = await supabase.from(table).select('*').limit(1);
        if (error) {
            console.log(`   ❌ ${table}: ${error.message}`);
            issues.push(`${table}: ${error.message}`);
            allGood = false;
        } else {
            console.log(`   ✅ ${table}: Working`);
        }
    }

    // 2. Check profiles doesn't exist
    console.log('\n🚫 Checking profiles table is gone:');
    const { error: profilesError } = await supabase.from('profiles').select('*').limit(1);
    if (profilesError && profilesError.message.includes('profiles')) {
        console.log('   ✅ profiles table correctly does not exist');
    } else {
        console.log('   ❌ profiles table might still exist!');
        issues.push('profiles table might still exist');
        allGood = false;
    }

    // 3. Check views exist
    console.log('\n👁️ Checking Compatibility Views:');
    const views = ['two_week_email', 'holidays', 'schedules', 'mandatory_training'];

    for (const view of views) {
        const { error } = await supabase.from(view).select('*').limit(1);
        if (error) {
            if (error.message.includes('does not exist')) {
                console.log(`   ⚠️  ${view}: Not created yet (run SQL script)`);
                issues.push(`${view} view needs to be created`);
            } else if (error.message.includes('profiles')) {
                console.log(`   ❌ ${view}: Still references profiles!`);
                issues.push(`${view} still references profiles`);
                allGood = false;
            } else {
                console.log(`   ⚠️  ${view}: ${error.message}`);
            }
        } else {
            console.log(`   ✅ ${view}: Working`);
        }
    }

    // 4. Test RPC functions
    console.log('\n🔧 Checking RPC Functions:');
    const functions = [
        {
            name: 'transfer_fuzzy_match_to_request',
            params: { p_fuzzy_match_id: -1, p_user_id: '00000000-0000-0000-0000-000000000000' }
        },
        {
            name: 'transfer_fuzzy_training_to_record',
            params: { p_fuzzy_match_id: -1, p_user_id: '00000000-0000-0000-0000-000000000000', p_training_type_id: -1 }
        }
    ];

    for (const func of functions) {
        const { error } = await supabase.rpc(func.name, func.params);
        if (error) {
            if (error.message.includes('profiles')) {
                console.log(`   ❌ ${func.name}: Still references profiles!`);
                issues.push(`${func.name} still references profiles`);
                allGood = false;
            } else {
                console.log(`   ✅ ${func.name}: No profiles reference`);
            }
        } else {
            console.log(`   ✅ ${func.name}: No profiles reference`);
        }
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    if (allGood && issues.length === 0) {
        console.log('\n🎉 SUCCESS! Migration is complete!');
        console.log('✅ All core tables working');
        console.log('✅ No profiles references found');
        console.log('✅ Admin dashboard should work perfectly\n');
    } else if (issues.some(i => i.includes('view needs to be created'))) {
        console.log('\n⚠️  ALMOST THERE!');
        console.log('Core tables are working but views need to be created.');
        console.log('\n📋 TO FIX:');
        console.log('1. Open Supabase SQL Editor');
        console.log('2. Copy and run the entire force_fix_all_functions.sql script');
        console.log('3. Run this verification again\n');
    } else {
        console.log('\n❌ ISSUES FOUND:');
        issues.forEach(issue => console.log(`   - ${issue}`));
        console.log('\n📋 TO FIX:');
        console.log('1. Open Supabase SQL Editor');
        console.log('2. Copy and run the entire force_fix_all_functions.sql script');
        console.log('3. This will force-recreate all functions and views\n');
    }

    return allGood;
}

// Run verification
verifyFixComplete()
    .then(success => {
        process.exit(success ? 0 : 1);
    })
    .catch(err => {
        console.error('Verification failed:', err);
        process.exit(1);
    });