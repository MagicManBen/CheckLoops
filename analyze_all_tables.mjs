import fetch from 'node-fetch';

const SUPABASE_URL = 'https://unveoqnlqnobufhublyw.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAxNzI3NiwiZXhwIjoyMDcwNTkzMjc2fQ.CJxV14F0T2TWkAjeR4bpYiBIOwLwyfzF9WzAWwS99Xc';

async function analyzeAllTables() {
    console.log('🔍 Analyzing all user-related tables in Supabase...\n');

    // List of potential user-related tables based on common patterns
    const tablesToCheck = [
        'kiosk_users',
        'profiles',
        'site_invites',
        'users',
        'staff',
        'employees',
        'auth.users',
        'holiday_requests',
        'holiday_entitlements',
        'admin_users',
        'user_roles',
        'user_teams',
        'user_access',
        'invitations',
        'pins',
        'user_pins',
        'working_hours',
        'staff_working_hours',
        'teams',
        'departments',
        'roles',
        'access_types',
        'submissions',
        'time_entries',
        'staff_meetings',
        'achievements',
        'training',
        'quiz_results'
    ];

    const existingTables = [];
    const tableStructures = {};

    for (const table of tablesToCheck) {
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?limit=1`, {
                headers: {
                    'Authorization': `Bearer ${SERVICE_KEY}`,
                    'apikey': SERVICE_KEY,
                    'Prefer': 'count=exact'
                }
            });

            if (response.ok) {
                const data = await response.json();
                const count = response.headers.get('content-range');

                existingTables.push(table);
                console.log(`✅ Found table: ${table}`);

                if (data.length > 0) {
                    tableStructures[table] = {
                        columns: Object.keys(data[0]),
                        sampleData: data[0],
                        totalRecords: count ? count.split('/')[1] : 'unknown'
                    };
                    console.log(`   Columns: ${Object.keys(data[0]).join(', ')}`);
                    console.log(`   Records: ${tableStructures[table].totalRecords}`);
                } else {
                    console.log(`   (Table is empty)`);
                    // Try to get schema even for empty tables
                    tableStructures[table] = {
                        columns: [],
                        sampleData: null,
                        totalRecords: '0'
                    };
                }
            }
        } catch (error) {
            // Table doesn't exist or error accessing it
        }
    }

    console.log('\n📊 Summary of existing tables:');
    console.log('================================');
    console.log(`Found ${existingTables.length} user-related tables:`);
    existingTables.forEach(table => console.log(`  - ${table}`));

    console.log('\n🔍 Detailed analysis of user-related columns:');
    console.log('==============================================');

    for (const [table, structure] of Object.entries(tableStructures)) {
        console.log(`\n📋 Table: ${table}`);
        console.log(`   Total records: ${structure.totalRecords}`);

        if (structure.columns.length > 0) {
            console.log(`   Columns (${structure.columns.length}):`);

            // Identify user-related columns
            const userColumns = structure.columns.filter(col =>
                col.toLowerCase().includes('user') ||
                col.toLowerCase().includes('email') ||
                col.toLowerCase().includes('name') ||
                col.toLowerCase().includes('role') ||
                col.toLowerCase().includes('team') ||
                col.toLowerCase().includes('access') ||
                col.toLowerCase().includes('pin') ||
                col.toLowerCase().includes('invite') ||
                col.toLowerCase().includes('holiday') ||
                col.toLowerCase().includes('staff') ||
                col === 'id' ||
                col === 'uid'
            );

            userColumns.forEach(col => {
                const value = structure.sampleData ? structure.sampleData[col] : 'N/A';
                console.log(`     • ${col}: ${typeof value} (sample: ${JSON.stringify(value)?.substring(0, 50)}...)`);
            });
        }
    }

    // Now let's analyze relationships
    console.log('\n🔗 Analyzing potential relationships:');
    console.log('======================================');

    // Look for common ID patterns
    const idColumns = {};
    for (const [table, structure] of Object.entries(tableStructures)) {
        if (structure.columns.length > 0) {
            structure.columns.forEach(col => {
                if (col.includes('id') || col.includes('_id') || col.includes('Id')) {
                    if (!idColumns[col]) idColumns[col] = [];
                    idColumns[col].push(table);
                }
            });
        }
    }

    console.log('\n📍 Common ID columns across tables:');
    for (const [col, tables] of Object.entries(idColumns)) {
        if (tables.length > 1) {
            console.log(`   ${col}: found in ${tables.join(', ')}`);
        }
    }

    return { existingTables, tableStructures };
}

// Run the analysis
analyzeAllTables()
    .then(result => {
        console.log('\n✅ Analysis complete!');
        console.log('\n📝 Next steps for master_users table:');
        console.log('1. Create master_users table with all necessary columns');
        console.log('2. Migrate data from existing tables');
        console.log('3. Update all references in the application code');
        console.log('4. Test thoroughly before removing old tables');
    })
    .catch(console.error);