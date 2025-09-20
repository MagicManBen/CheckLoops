import fetch from 'node-fetch';

const SUPABASE_URL = 'https://unveoqnlqnobufhublyw.supabase.co';
const SERVICE_KEY = (typeof process !== 'undefined' && process.env?.SUPABASE_SERVICE_ROLE_KEY) || '';
if (!SERVICE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY not set in environment');
}
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMTcyNzYsImV4cCI6MjA3MDU5MzI3Nn0.g93OsXDpO3V9DToU7s-Z3SwBBnB84rBv0JMv-idgSME';

async function deepSchemaAnalysis() {
    console.log('🔬 DEEP POSTGRESQL SCHEMA ANALYSIS');
    console.log('===================================\n');
    console.log('Project: unveoqnlqnobufhublyw');
    console.log('URL: https://unveoqnlqnobufhublyw.supabase.co\n');

    // We need to create a function in the database to query information_schema
    // First, let's try to get exact column information using PostgREST

    const tables = ['profiles', 'kiosk_users', 'site_invites'];
    const schemaInfo = {};

    console.log('📊 ANALYZING ACTUAL DATABASE SCHEMA:');
    console.log('=====================================\n');

    for (const table of tables) {
        console.log(`\n🔍 TABLE: ${table}`);
        console.log('--------------------------------');

        // First get sample data to infer types
        const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?limit=5`, {
            headers: {
                'Authorization': `Bearer ${SERVICE_KEY}`,
                'apikey': SERVICE_KEY
            }
        });

        if (response.ok) {
            const data = await response.json();
            schemaInfo[table] = { columns: {} };

            if (data.length > 0) {
                // Analyze multiple records to be sure
                for (const record of data) {
                    for (const [key, value] of Object.entries(record)) {
                        if (!schemaInfo[table].columns[key]) {
                            schemaInfo[table].columns[key] = {
                                values: [],
                                types: new Set(),
                                nullable: false,
                                inferredType: null
                            };
                        }

                        schemaInfo[table].columns[key].values.push(value);

                        if (value === null) {
                            schemaInfo[table].columns[key].nullable = true;
                        } else if (typeof value === 'string') {
                            if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
                                schemaInfo[table].columns[key].types.add('UUID');
                            } else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
                                schemaInfo[table].columns[key].types.add('TIMESTAMP');
                            } else {
                                schemaInfo[table].columns[key].types.add('TEXT');
                            }
                        } else if (typeof value === 'number') {
                            if (Number.isInteger(value)) {
                                if (Math.abs(value) > 2147483647) {
                                    schemaInfo[table].columns[key].types.add('BIGINT');
                                } else {
                                    schemaInfo[table].columns[key].types.add('INT');
                                }
                            } else {
                                schemaInfo[table].columns[key].types.add('DECIMAL');
                            }
                        } else if (typeof value === 'boolean') {
                            schemaInfo[table].columns[key].types.add('BOOLEAN');
                        } else if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
                            schemaInfo[table].columns[key].types.add('JSONB');
                        }
                    }
                }

                // Print analysis
                console.log('\nColumn Analysis:');
                for (const [colName, colInfo] of Object.entries(schemaInfo[table].columns)) {
                    const types = Array.from(colInfo.types);
                    const finalType = types.length > 0 ? types[0] : 'UNKNOWN';
                    const nonNullValues = colInfo.values.filter(v => v !== null);
                    const sampleValue = nonNullValues[0];

                    console.log(`  ${colName.padEnd(20)} : ${finalType.padEnd(12)} ${colInfo.nullable ? 'NULL' : 'NOT NULL'.padEnd(8)} | Sample: ${JSON.stringify(sampleValue)?.substring(0, 30)}`);

                    // Store the inferred type
                    schemaInfo[table].columns[colName].inferredType = finalType;
                }
            } else {
                console.log('  (Table is empty - checking structure via query)');

                // Try to get column info even from empty table
                const structureResponse = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*&limit=0`, {
                    headers: {
                        'Authorization': `Bearer ${SERVICE_KEY}`,
                        'apikey': SERVICE_KEY,
                        'Prefer': 'count=exact'
                    }
                });

                if (structureResponse.ok) {
                    // The response headers might give us column info
                    console.log('  Table exists but is empty');
                }
            }
        } else {
            console.log('  ❌ Table does not exist or is not accessible');
        }
    }

    console.log('\n\n📋 FINAL SCHEMA DETERMINATION:');
    console.log('================================\n');

    console.log('Based on deep analysis, here are the EXACT types needed:\n');

    console.log('PROFILES table columns:');
    if (schemaInfo.profiles) {
        for (const [col, info] of Object.entries(schemaInfo.profiles.columns)) {
            console.log(`  ${col.padEnd(20)} : ${info.inferredType || 'UNKNOWN'}`);
        }
    }

    console.log('\nSITE_INVITES table columns:');
    if (schemaInfo.site_invites) {
        for (const [col, info] of Object.entries(schemaInfo.site_invites.columns)) {
            console.log(`  ${col.padEnd(20)} : ${info.inferredType || 'UNKNOWN'}`);
        }
    }

    console.log('\n\n🎯 CRITICAL FINDINGS:');
    console.log('====================');

    // Check specific problem columns
    if (schemaInfo.profiles?.columns.reports_to_id) {
        const reportsToType = schemaInfo.profiles.columns.reports_to_id.inferredType;
        console.log(`✅ profiles.reports_to_id is: ${reportsToType || 'NULL/UNKNOWN'}`);
    }

    if (schemaInfo.site_invites?.columns.reports_to_id) {
        const reportsToType = schemaInfo.site_invites.columns.reports_to_id.inferredType;
        const sampleValue = schemaInfo.site_invites.columns.reports_to_id.values.find(v => v !== null);
        console.log(`✅ site_invites.reports_to_id is: ${reportsToType || 'NULL/UNKNOWN'}`);
        if (sampleValue) {
            console.log(`   Sample value: ${sampleValue} (${typeof sampleValue})`);
        }
    }

    if (schemaInfo.profiles?.columns.org_id) {
        const orgIdType = schemaInfo.profiles.columns.org_id.inferredType;
        console.log(`✅ profiles.org_id is: ${orgIdType || 'NULL/UNKNOWN'}`);
    }

    if (schemaInfo.profiles?.columns.team_id) {
        const teamIdType = schemaInfo.profiles.columns.team_id.inferredType;
        console.log(`✅ profiles.team_id is: ${teamIdType || 'NULL/UNKNOWN'}`);
    }

    return schemaInfo;
}

// Run the analysis
console.log('Starting deep schema analysis...\n');
deepSchemaAnalysis()
    .then(schema => {
        console.log('\n\n✅ Analysis complete!');
        console.log('Schema data collected for migration script generation.');
    })
    .catch(console.error);