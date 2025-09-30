const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://unveoqnlqnobufhublyw.supabase.co';
const supabaseServiceKey = 'sb_secret_nV3xSrLVHL50Zqp_DeZsgA_lLAYAaQs';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createCQCTable() {
  try {
    // Drop old table if exists and create new CQC_List table
    const { data, error } = await supabase.rpc('exec_sql', {
      query: `
        -- Drop the old table if it exists
        DROP TABLE IF EXISTS public.gp_practices CASCADE;

        -- Create table for CQC List (GP practices from CQC API)
        CREATE TABLE IF NOT EXISTS public.CQC_List (
            id SERIAL PRIMARY KEY,
            provider_id VARCHAR(255) UNIQUE NOT NULL,
            provider_name TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
        );

        -- Create indexes for faster lookups
        CREATE INDEX IF NOT EXISTS idx_cqc_list_provider_id ON public.CQC_List(provider_id);
        CREATE INDEX IF NOT EXISTS idx_cqc_list_provider_name ON public.CQC_List(provider_name);

        -- Add RLS policies
        ALTER TABLE public.CQC_List ENABLE ROW LEVEL SECURITY;

        -- Drop existing policy if it exists and create new one
        DROP POLICY IF EXISTS "Allow public read access" ON public.CQC_List;
        CREATE POLICY "Allow public read access" ON public.CQC_List
            FOR SELECT USING (true);
      `
    });

    if (error) {
      console.error('Error creating table:', error);
      return;
    }

    console.log('Successfully created CQC_List table');

    // Check if the table was created
    const { data: checkData, error: checkError } = await supabase
      .from('CQC_List')
      .select('*')
      .limit(1);

    if (checkError) {
      console.error('Error checking table:', checkError);
    } else {
      console.log('Table CQC_List exists and is accessible');
    }

  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

createCQCTable();