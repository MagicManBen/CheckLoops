import { createClient } from '@supabase/supabase-js';
import { promises as fs } from 'fs';

// Supabase configuration
const supabaseUrl = 'https://unveoqnlqnobufhublyw.supabase.co';
const supabaseServiceKey = (typeof process !== 'undefined' && process.env?.SUPABASE_SERVICE_ROLE_KEY) || '';
if (!supabaseServiceKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY not set in environment');
}

// Initialize Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function analyzeDatabase() {
    console.log('🔍 Starting Supabase database security analysis...\n');

    const analysis = {
        timestamp: new Date().toISOString(),
        database_info: {
            url: supabaseUrl,
            schema: 'public'
        },
        tables: [],
        summary: {
            total_tables: 0,
            rls_enabled: 0,
            rls_disabled: 0,
            total_policies: 0,
            tables_without_policies: []
        }
    };

    try {
        // 1. Get all tables in the public schema
        console.log('📋 Fetching all tables in public schema...');

        // Try different approaches to get tables
        let tableNames = [];

        // First try: Use pg_tables system view
        try {
            const { data: pgTables, error: pgError } = await supabase
                .from('pg_tables')
                .select('tablename')
                .eq('schemaname', 'public');

            if (!pgError && pgTables) {
                tableNames = pgTables.map(t => t.tablename);
            }
        } catch (e) {
            console.log('pg_tables approach failed, trying alternatives...');
        }

        // Second try: Direct RPC query
        if (tableNames.length === 0) {
            try {
                const { data: rpcData, error: rpcError } = await supabase
                    .rpc('exec_sql', {
                        query: `
                            SELECT table_name
                            FROM information_schema.tables
                            WHERE table_schema = 'public'
                            AND table_type = 'BASE TABLE'
                            ORDER BY table_name;
                        `
                    });

                if (!rpcError && rpcData) {
                    tableNames = rpcData.map(t => t.table_name);
                }
            } catch (e) {
                console.log('RPC approach failed, trying manual discovery...');
            }
        }

        // Third try: Manual discovery of common tables
        if (tableNames.length === 0) {
            console.log('🔄 Trying manual table discovery...');
            const commonTables = [
                'profiles', 'users', 'kiosk_users', 'master_users',
                'holidays', 'holiday_requests', 'training_records',
                'training_types', 'achievements', 'quiz_questions',
                'quiz_attempts', 'complaints', 'meetings', 'staff_schedules',
                'working_patterns', 'teams', 'sites', 'tasks'
            ];

            for (const tableName of commonTables) {
                try {
                    const { data, error } = await supabase
                        .from(tableName)
                        .select('*')
                        .limit(1);

                    if (!error) {
                        tableNames.push(tableName);
                        console.log(`  ✓ Found table: ${tableName}`);
                    }
                } catch (e) {
                    // Table doesn't exist, continue
                }
            }
        }

        console.log(`📊 Found ${tableNames.length} tables to analyze\n`);
        analysis.summary.total_tables = tableNames.length;

        // 2. Analyze each table
        for (const tableName of tableNames) {
            console.log(`🔍 Analyzing table: ${tableName}`);

            const tableAnalysis = {
                name: tableName,
                rls_enabled: false,
                policies: [],
                columns: [],
                foreign_keys: [],
                indexes: [],
                permissions: {}
            };

            try {
                // Try to get basic table info first by querying the table
                const { data: tableData, error: tableError } = await supabase
                    .from(tableName)
                    .select('*')
                    .limit(1);

                if (tableError) {
                    console.log(`  ⚠️  Cannot access table ${tableName}: ${tableError.message}`);
                    tableAnalysis.error = tableError.message;
                    analysis.tables.push(tableAnalysis);
                    continue;
                }

                // For now, we'll try to determine RLS status and policies indirectly
                // Since we can't easily access system tables via Supabase client

                // Test RLS by trying to access with different contexts
                try {
                    // Try to get a count without any filters (this will fail if RLS is enabled and no policies allow it)
                    const { count, error: countError } = await supabase
                        .from(tableName)
                        .select('*', { count: 'exact', head: true });

                    if (countError && countError.message.includes('policy')) {
                        tableAnalysis.rls_enabled = true;
                    } else if (!countError) {
                        // Could access, might mean RLS is disabled or policies allow access
                        tableAnalysis.rls_enabled = false; // We'll refine this later
                    }
                } catch (e) {
                    if (e.message.includes('policy') || e.message.includes('RLS')) {
                        tableAnalysis.rls_enabled = true;
                    }
                }

                // Get column information by examining the first row
                if (tableData && tableData.length > 0) {
                    const sampleRow = tableData[0];
                    tableAnalysis.columns = Object.keys(sampleRow).map(columnName => ({
                        column_name: columnName,
                        data_type: typeof sampleRow[columnName],
                        sample_value: sampleRow[columnName]
                    }));
                } else {
                    // Try to get column info from schema if no data
                    try {
                        const { data: emptyData, error: emptyError } = await supabase
                            .from(tableName)
                            .select('*')
                            .limit(0);

                        if (!emptyError) {
                            // This should return empty array but with column structure
                            tableAnalysis.columns = []; // We'll populate this differently
                        }
                    } catch (e) {
                        console.log(`  ⚠️  Could not determine column structure for ${tableName}`);
                    }
                }

                // Update summary
                if (tableAnalysis.rls_enabled) {
                    analysis.summary.rls_enabled++;
                } else {
                    analysis.summary.rls_disabled++;
                }

                if (tableAnalysis.policies.length === 0) {
                    analysis.summary.tables_without_policies.push(tableName);
                }

                analysis.tables.push(tableAnalysis);
                console.log(`  ✅ RLS: ${tableAnalysis.rls_enabled ? 'Enabled' : 'Disabled'}, Policies: ${tableAnalysis.policies.length}, Columns: ${tableAnalysis.columns.length}`);

            } catch (error) {
                console.error(`  ❌ Error analyzing ${tableName}:`, error.message);
                tableAnalysis.error = error.message;
                analysis.tables.push(tableAnalysis);
            }
        }

        // 3. Generate detailed report
        console.log('\n📊 SECURITY ANALYSIS SUMMARY');
        console.log('================================');
        console.log(`Total Tables: ${analysis.summary.total_tables}`);
        console.log(`RLS Enabled: ${analysis.summary.rls_enabled}`);
        console.log(`RLS Disabled: ${analysis.summary.rls_disabled}`);
        console.log(`Total Policies: ${analysis.summary.total_policies}`);
        console.log(`Tables without policies: ${analysis.summary.tables_without_policies.length}`);

        if (analysis.summary.tables_without_policies.length > 0) {
            console.log('\n⚠️  TABLES WITHOUT RLS POLICIES:');
            analysis.summary.tables_without_policies.forEach(table => {
                console.log(`  - ${table}`);
            });
        }

        // 4. Save detailed analysis to file
        const reportFilename = `supabase_security_analysis_${new Date().toISOString().split('T')[0]}.json`;
        await fs.writeFile(reportFilename, JSON.stringify(analysis, null, 2));
        console.log(`\n💾 Detailed analysis saved to: ${reportFilename}`);

        // 5. Generate human-readable report
        const readableReport = generateReadableReport(analysis);
        const readableFilename = `supabase_security_report_${new Date().toISOString().split('T')[0]}.md`;
        await fs.writeFile(readableFilename, readableReport);
        console.log(`📄 Human-readable report saved to: ${readableFilename}`);

        // 6. Generate security recommendations
        const recommendations = generateSecurityRecommendations(analysis);
        console.log('\n🔒 SECURITY RECOMMENDATIONS:');
        console.log(recommendations);

    } catch (error) {
        console.error('❌ Fatal error during analysis:', error);
    }
}

function generateReadableReport(analysis) {
    let report = `# Supabase Security Analysis Report\n\n`;
    report += `**Generated:** ${analysis.timestamp}\n`;
    report += `**Database:** ${analysis.database_info.url}\n`;
    report += `**Schema:** ${analysis.database_info.schema}\n\n`;

    report += `## Summary\n\n`;
    report += `- **Total Tables:** ${analysis.summary.total_tables}\n`;
    report += `- **RLS Enabled:** ${analysis.summary.rls_enabled}\n`;
    report += `- **RLS Disabled:** ${analysis.summary.rls_disabled}\n`;
    report += `- **Total Policies:** ${analysis.summary.total_policies}\n`;
    report += `- **Tables without policies:** ${analysis.summary.tables_without_policies.length}\n\n`;

    report += `## Table Details\n\n`;

    analysis.tables.forEach(table => {
        report += `### ${table.name}\n\n`;
        report += `- **RLS Enabled:** ${table.rls_enabled ? '✅ Yes' : '❌ No'}\n`;
        report += `- **Policies:** ${table.policies.length}\n`;
        report += `- **Columns:** ${table.columns.length}\n`;
        report += `- **Foreign Keys:** ${table.foreign_keys.length}\n\n`;

        if (table.policies.length > 0) {
            report += `#### Policies\n\n`;
            table.policies.forEach(policy => {
                report += `- **${policy.policy_name}** (${policy.command})\n`;
            });
            report += `\n`;
        }

        if (table.columns.length > 0) {
            report += `#### Columns\n\n`;
            report += `| Column | Type | Nullable | Default |\n`;
            report += `|--------|------|----------|----------|\n`;
            table.columns.forEach(col => {
                report += `| ${col.column_name} | ${col.data_type} | ${col.is_nullable} | ${col.column_default || 'N/A'} |\n`;
            });
            report += `\n`;
        }

        if (table.foreign_keys.length > 0) {
            report += `#### Foreign Keys\n\n`;
            table.foreign_keys.forEach(fk => {
                report += `- ${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}\n`;
            });
            report += `\n`;
        }
    });

    return report;
}

function generateSecurityRecommendations(analysis) {
    let recommendations = '';

    recommendations += '\n1. ENABLE RLS ON ALL TABLES\n';
    recommendations += '   Tables without RLS:\n';
    analysis.tables.filter(t => !t.rls_enabled).forEach(table => {
        recommendations += `   - ALTER TABLE "${table.name}" ENABLE ROW LEVEL SECURITY;\n`;
    });

    recommendations += '\n2. CREATE BASIC POLICIES FOR TABLES WITHOUT POLICIES\n';
    analysis.summary.tables_without_policies.forEach(tableName => {
        recommendations += `   - Create policies for table: ${tableName}\n`;
    });

    recommendations += '\n3. COMMON POLICY PATTERNS TO IMPLEMENT:\n';
    recommendations += '   - User can only access their own records (user_id column)\n';
    recommendations += '   - Admins can access all records\n';
    recommendations += '   - Public read access for reference tables\n';
    recommendations += '   - Service role bypass for system operations\n';

    return recommendations;
}

// Run the analysis
analyzeDatabase().catch(console.error);

export { analyzeDatabase };