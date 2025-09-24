// Create table using Supabase Management API
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://unveoqnlqnobufhublyw.supabase.co';
const SUPABASE_SERVICE_KEY = 'sb_secret_nV3xSrLVHL50Zqp_DeZsgA_lLAYAaQs';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    persistSession: false,
  },
  db: {
    schema: 'public'
  }
});

async function createTable() {
  console.log('Attempting to create table via RPC...');

  // First try to use RPC to execute SQL
  const { data, error } = await supabase.rpc('exec_sql', {
    query: `
      CREATE TABLE IF NOT EXISTS gp_practices_cache (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        ods_code VARCHAR(20) UNIQUE NOT NULL,
        name VARCHAR(500) NOT NULL,
        address_line1 VARCHAR(500),
        address_line2 VARCHAR(500),
        city VARCHAR(200),
        postcode VARCHAR(20),
        phone VARCHAR(50),
        status VARCHAR(50),
        primary_role VARCHAR(100),
        last_updated TIMESTAMP DEFAULT NOW(),
        raw_data JSONB
      );
    `
  });

  if (error) {
    console.log('RPC method not available:', error.message);
    console.log('\n==============================================');
    console.log('MANUAL STEP REQUIRED:');
    console.log('==============================================');
    console.log('Please go to your Supabase dashboard:');
    console.log('https://app.supabase.com/project/unveoqnlqnobufhublyw/sql/new');
    console.log('\nAnd run this SQL:\n');
    console.log(`CREATE TABLE IF NOT EXISTS gp_practices_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ods_code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(500) NOT NULL,
  address_line1 VARCHAR(500),
  address_line2 VARCHAR(500),
  city VARCHAR(200),
  postcode VARCHAR(20),
  phone VARCHAR(50),
  status VARCHAR(50),
  primary_role VARCHAR(100),
  last_updated TIMESTAMP DEFAULT NOW(),
  raw_data JSONB
);

CREATE INDEX IF NOT EXISTS idx_gp_practices_ods_code ON gp_practices_cache(ods_code);
CREATE INDEX IF NOT EXISTS idx_gp_practices_name ON gp_practices_cache(name);
CREATE INDEX IF NOT EXISTS idx_gp_practices_postcode ON gp_practices_cache(postcode);

GRANT SELECT ON gp_practices_cache TO anon;
GRANT SELECT ON gp_practices_cache TO authenticated;
GRANT ALL ON gp_practices_cache TO service_role;`);
    console.log('\n==============================================');
    console.log('Then run: node setup-gp-practices.mjs');
    console.log('==============================================\n');
  } else {
    console.log('Table created successfully!');
  }
}

createTable().catch(console.error);