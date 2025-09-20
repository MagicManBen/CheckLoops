import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://unveoqnlqnobufhublyw.supabase.co';
const supabaseKey = (typeof process !== 'undefined' && process.env?.SUPABASE_SERVICE_ROLE_KEY) || '';
if (!supabaseKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY not set in environment');
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabaseStructure() {
    console.log('🔍 INVESTIGATING DATABASE STRUCTURE...\n');
    console.log('=' .repeat(60));

    // Check each object by trying to query system tables
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
        unknown: [],
        errors: []
    };

    console.log('📊 Checking database objects...\n');

    // Use raw SQL to check object types
    const { data, error } = await supabase.rpc('exec_sql', {
        query: `
            SELECT
                c.relname AS name,
                CASE c.relkind
                    WHEN 'r' THEN 'TABLE'
                    WHEN 'v' THEN 'VIEW'
                    WHEN 'm' THEN 'MATERIALIZED VIEW'
                    ELSE c.relkind::text
                END AS type
            FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE n.nspname = 'public'
            AND c.relname = ANY($1::text[])
            ORDER BY c.relname
        `,
        params: [objectsToCheck]
    }).single();

    if (error) {
        console.log('⚠️  Cannot execute raw SQL via RPC. Using alternative method...\n');

        // Alternative: check each object individually
        for (const obj of objectsToCheck) {
            try {
                // Try a simple query
                const { data, error } = await supabase
                    .from(obj)
                    .select('*')
                    .limit(0);

                if (!error) {
                    // Object exists and is queryable
                    // Try to determine if it's a table or view by checking if we can insert
                    const testId = 'test-' + Date.now();
                    const { error: insertError } = await supabase
                        .from(obj)
                        .insert({ id: testId })
                        .select();

                    if (insertError) {
                        if (insertError.message.includes('cannot insert into view') ||
                            insertError.message.includes('cannot perform INSERT on relation')) {
                            results.views.push(obj);
                            console.log(`👁️  ${obj}: VIEW (RLS not applicable)`);
                        } else if (insertError.message.includes('violates')) {
                            // It's a table, just has constraints
                            results.tables.push(obj);
                            console.log(`✅ ${obj}: TABLE (RLS applicable)`);
                        } else {
                            results.unknown.push(obj);
                            console.log(`❓ ${obj}: Unknown type`);
                        }
                    } else {
                        // Insert succeeded, it's definitely a table
                        results.tables.push(obj);
                        console.log(`✅ ${obj}: TABLE (RLS applicable)`);
                        // Clean up test insert
                        await supabase.from(obj).delete().eq('id', testId);
                    }
                } else {
                    results.errors.push({ obj, error: error.message });
                    console.log(`❌ ${obj}: ${error.message}`);
                }
            } catch (err) {
                results.errors.push({ obj, error: err.message });
                console.log(`⚠️  ${obj}: ${err.message}`);
            }
        }
    } else if (data) {
        // Parse RPC results
        data.forEach(item => {
            if (item.type === 'TABLE') {
                results.tables.push(item.name);
                console.log(`✅ ${item.name}: TABLE (RLS applicable)`);
            } else if (item.type === 'VIEW') {
                results.views.push(item.name);
                console.log(`👁️  ${item.name}: VIEW (RLS not applicable)`);
            } else {
                results.unknown.push(item.name);
                console.log(`❓ ${item.name}: ${item.type}`);
            }
        });
    }

    console.log('\n' + '=' .repeat(60));
    console.log('📋 STRUCTURE ANALYSIS RESULTS\n');
    console.log(`TABLES (RLS applicable): ${results.tables.length}`);
    results.tables.forEach(t => console.log(`  - ${t}`));

    console.log(`\nVIEWS (RLS not applicable): ${results.views.length}`);
    results.views.forEach(v => console.log(`  - ${v}`));

    if (results.unknown.length > 0) {
        console.log(`\nUNKNOWN: ${results.unknown.length}`);
        results.unknown.forEach(u => console.log(`  - ${u}`));
    }

    // Generate corrected SQL script
    generateCorrectedSQL(results.tables, results.views);

    return results;
}

function generateCorrectedSQL(tables, views) {
    console.log('\n' + '=' .repeat(60));
    console.log('✅ GENERATING CORRECTED SQL SCRIPT...\n');

    let sqlScript = `-- =====================================================
-- CORRECTED RLS IMPLEMENTATION (TABLES ONLY)
-- Generated: ${new Date().toISOString()}
-- =====================================================
-- IMPORTANT: Views detected and excluded from RLS:
${views.map(v => `-- - ${v} (VIEW)`).join('\n')}
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
            sqlScript += `-- ===== Policies for ${table} =====\n`;

            // Service role always has access
            sqlScript += `CREATE POLICY "${table}_service_role" ON "${table}"
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');\n\n`;

            // Different policy patterns based on table
            if (table === 'holidays' || table === 'training_records' ||
                table === 'achievements' || table === 'quiz_attempts') {
                // User-specific data tables
                sqlScript += `CREATE POLICY "${table}_user_select" ON "${table}"
    FOR SELECT USING (
        auth.uid()::text = user_id
    );\n\n`;

                sqlScript += `CREATE POLICY "${table}_user_insert" ON "${table}"
    FOR INSERT WITH CHECK (
        auth.uid()::text = user_id
    );\n\n`;

                sqlScript += `CREATE POLICY "${table}_user_update" ON "${table}"
    FOR UPDATE USING (
        auth.uid()::text = user_id
    );\n\n`;

                sqlScript += `CREATE POLICY "${table}_admin_all" ON "${table}"
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()::text
            AND profiles.role = 'admin'
        )
    );\n\n`;
            } else if (table === 'complaints') {
                // Complaints - created_by field
                sqlScript += `CREATE POLICY "${table}_user_own" ON "${table}"
    FOR ALL USING (
        auth.uid()::text = created_by
    );\n\n`;

                sqlScript += `CREATE POLICY "${table}_admin_all" ON "${table}"
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()::text
            AND profiles.role = 'admin'
        )
    );\n\n`;
            } else if (table === 'quiz_questions' || table === 'training_types' ||
                      table === 'teams' || table === 'sites') {
                // Reference data - read for all authenticated
                sqlScript += `CREATE POLICY "${table}_authenticated_read" ON "${table}"
    FOR SELECT USING (auth.role() = 'authenticated');\n\n`;

                sqlScript += `CREATE POLICY "${table}_admin_write" ON "${table}"
    FOR INSERT, UPDATE, DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()::text
            AND profiles.role = 'admin'
        )
    );\n\n`;
            } else if (table === 'meetings') {
                // Meetings - more open access for authenticated users
                sqlScript += `CREATE POLICY "${table}_authenticated_all" ON "${table}"
    FOR SELECT USING (auth.role() = 'authenticated');\n\n`;

                sqlScript += `CREATE POLICY "${table}_admin_write" ON "${table}"
    FOR INSERT, UPDATE, DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()::text
            AND profiles.role = 'admin'
        )
    );\n\n`;
            }
        });
    }

    sqlScript += `\n-- STEP 3: VERIFICATION QUERY
SELECT
    tablename,
    rowsecurity as rls_enabled,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = pg_tables.tablename) as policy_count
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (${tables.map(t => `'${t}'`).join(', ')})
ORDER BY tablename;
`;

    // Save the corrected script
    const scriptPath = '/Users/benhoward/Desktop/CheckLoop/CheckLoops/CORRECTED_RLS_SCRIPT.sql';
    fs.writeFileSync(scriptPath, sqlScript);

    console.log(`📄 Corrected SQL script saved to: ${scriptPath}`);
    console.log('\n⚠️  IMPORTANT NOTES:');
    console.log('1. This script only applies RLS to actual TABLES, not VIEWS');
    console.log('2. Views like "profiles" inherit security from their underlying tables');
    console.log('3. Service role always has full access for system operations');

    return scriptPath;
}

// Execute the check
checkDatabaseStructure()
    .then(results => {
        console.log('\n✅ Analysis complete');
        console.log('📄 Check CORRECTED_RLS_SCRIPT.sql for the updated commands');
        console.log('\n🚨 ACTION REQUIRED:');
        console.log('1. Open: https://supabase.com/dashboard/project/unveoqnlqnobufhublyw/sql/new');
        console.log('2. Copy contents of CORRECTED_RLS_SCRIPT.sql');
        console.log('3. Paste and RUN to secure your database');
    })
    .catch(err => {
        console.error('❌ Error during analysis:', err);
    });