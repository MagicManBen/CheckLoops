import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://unveoqnlqnobufhublyw.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAxNzI3NiwiZXhwIjoyMDcwNTkzMjc2fQ.CJxV14F0T2TWkAjeR4bpYiBIOwLwyfzF9WzAWwS99Xc';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function createNHSTables() {
    console.log('Creating NHS tables...');

    try {
        // Execute SQL commands one by one
        const commands = [
            // Create NHS_All_GPs table
            `CREATE TABLE IF NOT EXISTS public."NHS_All_GPs" (
                id SERIAL PRIMARY KEY,
                practice_ods_code TEXT NOT NULL,
                practice_name TEXT,
                last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                ods_data JSONB,
                qof_data JSONB,
                patient_survey_data JSONB,
                workforce_data JSONB,
                prescribing_data JSONB,
                appointments_data JSONB,
                referrals_data JSONB,
                practice_code TEXT,
                data_quality_score NUMERIC(5,2),
                data_completeness JSONB,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                CONSTRAINT unique_practice_ods_code UNIQUE (practice_ods_code)
            )`,

            // Create NHS_Reference_Data table
            `CREATE TABLE IF NOT EXISTS public."NHS_Reference_Data" (
                id SERIAL PRIMARY KEY,
                data_type TEXT NOT NULL,
                practice_code TEXT,
                ods_code TEXT,
                data JSONB NOT NULL,
                period TEXT,
                source_file TEXT,
                import_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                record_count INTEGER,
                last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                CONSTRAINT unique_reference_data UNIQUE (data_type, practice_code, period)
            )`,

            // Create NHS_CSV_Import_Log table
            `CREATE TABLE IF NOT EXISTS public."NHS_CSV_Import_Log" (
                id SERIAL PRIMARY KEY,
                data_type TEXT NOT NULL,
                filename TEXT NOT NULL,
                period TEXT,
                records_imported INTEGER,
                import_status TEXT,
                error_message TEXT,
                imported_by TEXT,
                import_started TIMESTAMP WITH TIME ZONE,
                import_completed TIMESTAMP WITH TIME ZONE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )`,

            // Create NHS_Practice_Codes table
            `CREATE TABLE IF NOT EXISTS public."NHS_Practice_Codes" (
                id SERIAL PRIMARY KEY,
                ods_code TEXT UNIQUE NOT NULL,
                practice_code TEXT,
                alternative_codes JSONB,
                practice_name TEXT,
                status TEXT,
                last_verified TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )`
        ];

        for (const sql of commands) {
            console.log('Executing: ' + sql.substring(0, 50) + '...');
            const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

            if (error) {
                // Try direct approach if RPC doesn't work
                const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': SERVICE_ROLE_KEY,
                        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
                    },
                    body: JSON.stringify({
                        query: sql
                    })
                });

                if (!response.ok) {
                    console.error(`Failed to execute: ${sql.substring(0, 50)}...`);
                } else {
                    console.log('✓ Success');
                }
            } else {
                console.log('✓ Success');
            }
        }

        // Verify tables were created
        const { data, error } = await supabase
            .from('NHS_All_GPs')
            .select('count', { count: 'exact', head: true });

        if (error) {
            console.error('Error verifying NHS_All_GPs table:', error);
        } else {
            console.log('\n✅ NHS_All_GPs table created successfully!');
        }

        const { data: refData, error: refError } = await supabase
            .from('NHS_Reference_Data')
            .select('count', { count: 'exact', head: true });

        if (refError) {
            console.error('Error verifying NHS_Reference_Data table:', refError);
        } else {
            console.log('✅ NHS_Reference_Data table created successfully!');
        }

    } catch (error) {
        console.error('Error creating NHS tables:', error);
    }
}

createNHSTables();