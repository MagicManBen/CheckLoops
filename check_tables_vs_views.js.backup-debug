const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://unveoqnlqnobufhublyw.supabase.co';
const supabaseKey = (typeof process !== 'undefined' && process.env?.SUPABASE_SERVICE_ROLE_KEY) || '';
if (!supabaseKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY not set in environment');
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabaseStructure() {
    console.log('🔍 INVESTIGATING DATABASE STRUCTURE...\n');
    console.log('=' .repeat(60));

    // SQL to identify tables vs views
    const checkStructureSQL = `
        SELECT
            schemaname,
            tablename as name,
            'TABLE' as type
        FROM pg_tables
        WHERE schemaname = 'public'

        UNION ALL

        SELECT
            schemaname,
            viewname as name,
            'VIEW' as type
        FROM pg_views
        WHERE schemaname = 'public'

        ORDER BY type, name;
    `;

    // SQL to check auth schema tables (often where real user data is)
    const checkAuthTablesSQL = `
        SELECT
            schemaname,
            tablename,
            rowsecurity
        FROM pg_tables
        WHERE schemaname = 'auth'
        ORDER BY tablename;
    `;

    // SQL to check view definitions
    const checkViewDefinitionsSQL = `
        SELECT
            viewname,
            definition
        FROM pg_views
        WHERE schemaname = 'public'
        AND viewname IN ('profiles', 'master_users')
        ORDER BY viewname;
    `;

    console.log('📊 Checking database objects...\n');

    // List of objects we thought were tables
    const objectsToCheck = [
        'profiles',
        'master_users',
        'holidays',
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

    const results = {
        tables: [],
        views: [],
        unknown: []
    };

    // Check each object
    for (const obj of objectsToCheck) {
        try {
            // Try to get table info from information_schema
            const { data: tableInfo, error: tableError } = await supabase
                .from('information_schema.tables')
                .select('table_type')
                .eq('table_schema', 'public')
                .eq('table_name', obj)
                .single();

            if (tableInfo) {
                if (tableInfo.table_type === 'BASE TABLE') {
                    results.tables.push(obj);
                    console.log(`✅ ${obj}: BASE TABLE (can apply RLS)`);
                } else if (tableInfo.table_type === 'VIEW') {
                    results.views.push(obj);
                    console.log(`👁️  ${obj}: VIEW (cannot apply RLS directly)`);
                } else {
                    results.unknown.push(obj);
                    console.log(`❓ ${obj}: ${tableInfo.table_type}`);
                }
            } else {
                // Fallback: try to query the object
                const { error: queryError } = await supabase
                    .from(obj)
                    .select('*')
                    .limit(0);

                if (!queryError) {
                    results.unknown.push(obj);
                    console.log(`⚠️  ${obj}: Exists but type unknown`);
                } else {
                    console.log(`❌ ${obj}: Does not exist or inaccessible`);
                }
            }
        } catch (err) {
            console.log(`⚠️  ${obj}: Error checking - ${err.message}`);
            results.unknown.push(obj);
        }
    }

    console.log('\n' + '=' .repeat(60));
    console.log('📋 STRUCTURE ANALYSIS RESULTS\n');
    console.log(`TABLES (RLS applicable): ${results.tables.length}`);
    results.tables.forEach(t => console.log(`  - ${t}`));

    console.log(`\nVIEWS (RLS not applicable): ${results.views.length}`);
    results.views.forEach(v => console.log(`  - ${v}`));

    console.log(`\nUNKNOWN: ${results.unknown.length}`);
    results.unknown.forEach(u => console.log(`  - ${u}`));

    // Generate corrected SQL script
    generateCorrectedSQL(results.tables);

    return results;
}

function generateCorrectedSQL(tables) {
    console.log('\n' + '=' .repeat(60));
    console.log('✅ GENERATING CORRECTED SQL SCRIPT...\n');

    let sqlScript = `-- =====================================================
-- CORRECTED RLS IMPLEMENTATION (TABLES ONLY)
-- Generated: ${new Date().toISOString()}
-- =====================================================
-- NOTE: Views like 'profiles' cannot have RLS directly.
-- RLS must be applied to underlying tables.
-- =====================================================

`;

    // Only enable RLS on actual tables
    if (tables.length > 0) {
        sqlScript += `-- STEP 1: ENABLE RLS ON BASE TABLES ONLY\n`;
        tables.forEach(table => {
            sqlScript += `ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY;\n`;
        });

        sqlScript += `\n-- STEP 2: CREATE POLICIES FOR BASE TABLES\n\n`;

        // Add policies for each table type
        tables.forEach(table => {
            sqlScript += `-- Policies for ${table}\n`;

            // Different policy patterns based on table
            if (table === 'holidays' || table === 'training_records' ||
                table === 'achievements' || table === 'quiz_attempts') {
                // User-specific data tables
                sqlScript += `CREATE POLICY "${table}_user_select" ON "${table}"
    FOR SELECT USING (
        auth.uid()::text = user_id OR
        auth.jwt() ->> 'role' = 'service_role'
    );\n\n`;

                sqlScript += `CREATE POLICY "${table}_user_insert" ON "${table}"
    FOR INSERT WITH CHECK (
        auth.uid()::text = user_id OR
        auth.jwt() ->> 'role' = 'service_role'
    );\n\n`;

                sqlScript += `CREATE POLICY "${table}_user_update" ON "${table}"
    FOR UPDATE USING (
        auth.uid()::text = user_id OR
        auth.jwt() ->> 'role' = 'service_role'
    );\n\n`;

                sqlScript += `CREATE POLICY "${table}_user_delete" ON "${table}"
    FOR DELETE USING (
        auth.uid()::text = user_id OR
        auth.jwt() ->> 'role' = 'service_role'
    );\n\n`;
            } else if (table === 'complaints') {
                // Complaints - created_by field
                sqlScript += `CREATE POLICY "${table}_user_access" ON "${table}"
    FOR ALL USING (
        auth.uid()::text = created_by OR
        auth.jwt() ->> 'role' = 'service_role'
    );\n\n`;
            } else if (table === 'quiz_questions' || table === 'training_types' ||
                      table === 'teams' || table === 'sites') {
                // Reference data - read for all authenticated, write for service role
                sqlScript += `CREATE POLICY "${table}_authenticated_read" ON "${table}"
    FOR SELECT USING (auth.role() = 'authenticated');\n\n`;

                sqlScript += `CREATE POLICY "${table}_service_write" ON "${table}"
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');\n\n`;
            } else if (table === 'meetings') {
                // Meetings - site-based access
                sqlScript += `CREATE POLICY "${table}_all_access" ON "${table}"
    FOR ALL USING (
        auth.role() = 'authenticated' OR
        auth.jwt() ->> 'role' = 'service_role'
    );\n\n`;
            }
        });
    }

    // Check auth schema
    sqlScript += `\n-- STEP 3: CHECK AUTH SCHEMA
-- The auth.users table may need attention
-- Run this query to see if profiles is based on auth.users:

SELECT
    c.relname AS view_name,
    pg_get_viewdef(c.oid, true) AS view_definition
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind = 'v'
AND n.nspname = 'public'
AND c.relname IN ('profiles', 'master_users');

-- If profiles/master_users are views of auth.users,
-- you may need to create actual tables or work with auth.users directly.
`;

    sqlScript += `\n-- VERIFICATION QUERY
SELECT
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (${tables.map(t => `'${t}'`).join(', ')})
ORDER BY tablename;
`;

    // Save the corrected script
    const fs = require('fs');
    const scriptPath = '/Users/benhoward/Desktop/CheckLoop/CheckLoops/CORRECTED_RLS_SCRIPT.sql';
    fs.writeFileSync(scriptPath, sqlScript);

    console.log(`📄 Corrected SQL script saved to: ${scriptPath}`);
    console.log('\n⚠️  IMPORTANT: This script only applies RLS to actual tables.');
    console.log('Views like "profiles" may need different handling.');

    return scriptPath;
}

// Execute the check
checkDatabaseStructure()
    .then(results => {
        console.log('\n✅ Analysis complete');
        console.log('📄 Check CORRECTED_RLS_SCRIPT.sql for the updated commands');
    })
    .catch(err => {
        console.error('❌ Error during analysis:', err);
    });