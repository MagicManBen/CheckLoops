import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://unveoqnlqnobufhublyw.supabase.co'
const SERVICE_KEY = 'sb_secret_nV3xSrLVHL50Zqp_DeZsgA_lLAYAaQs'

// Create a Supabase client with the service key for admin access
const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

async function checkTables() {
  console.log('Checking master_users table...')
  const { data: masterUsers, error: masterError } = await supabase
    .from('master_users')
    .select('*')
  
  if (masterError) {
    console.error('Error querying master_users:', masterError)
  } else {
    console.log(`Found ${masterUsers?.length || 0} rows in master_users:`)
    console.log(JSON.stringify(masterUsers, null, 2))
  }

  console.log('\nChecking holidays table...')
  const { data: holidays, error: holidaysError } = await supabase
    .from('holidays')
    .select('*')
  
  if (holidaysError) {
    console.error('Error querying holidays:', holidaysError)
  } else {
    console.log(`Found ${holidays?.length || 0} rows in holidays:`)
    console.log(JSON.stringify(holidays, null, 2))
  }

  // Check table structure
  console.log('\nChecking table structures...')
  const { data: tables } = await supabase.rpc('get_tables_columns')
  console.log(tables)

  // Check Row Level Security policies
  console.log('\nChecking RLS policies...')
  const { data: policies } = await supabase.rpc('get_policies')
  console.log(policies)
}

checkTables().catch(console.error)