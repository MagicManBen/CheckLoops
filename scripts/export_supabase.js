#!/usr/bin/env node
/*
 Simple script to call the Supabase RPC function `admin.export_everything()`
 and save the JSON result to `SupabaseInfo.txt` exactly as it comes from the database.

 Usage:
  - Make sure you have a .env file with SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
  - node scripts/export_supabase.js [--pretty]
  - node scripts/export_supabase.js --output customname.txt

 This will export EVERYTHING exactly as stored in Supabase - no changes, no hiding anything.
*/

import fs from 'fs'
import path from 'path'
import minimist from 'minimist'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const argv = minimist(process.argv.slice(2))
const pretty = argv.pretty || argv.p
const outputPathArg = argv.output || argv.o

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE key environment variables.')
  console.error('Found in .env:')
  console.error('- SUPABASE_URL:', process.env.SUPABASE_URL ? 'YES' : 'NO')
  console.error('- SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'YES' : 'NO')
  console.error('- SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? 'YES' : 'NO')
  console.error('- SUPABASE_KEY:', process.env.SUPABASE_KEY ? 'YES' : 'NO')
  console.error('')
  console.error('The script will try to use whatever key is available.')
  console.error('If export_everything() fails, you may need the service role key.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  // use the service role key to ensure RPC can run if it's restricted to authenticated requests
  auth: { persistSession: false }
})

async function run() {
  try {
    console.log('Connecting to Supabase...')
    console.log('Calling export function...')
    
    // Try the public wrapper function first
    let { data, error } = await supabase.rpc('export_everything_wrapper')
    
    if (error && error.message.includes('Could not find the function')) {
      console.log('Wrapper function not found. You need to create it first.')
      console.log('Run this SQL in your Supabase SQL editor:')
      console.log('')
      console.log('CREATE OR REPLACE FUNCTION public.export_everything_wrapper()')
      console.log('RETURNS jsonb')
      console.log('SECURITY DEFINER')
      console.log('SET search_path = public, admin')
      console.log('AS $$')
      console.log('BEGIN')
      console.log('  RETURN admin.export_everything();')
      console.log('END;')
      console.log('$$ LANGUAGE plpgsql;')
      console.log('')
      console.log('Then run this script again.')
      process.exit(1)
    }
    
    if (error) throw error
    
    console.log('Export data received, writing to file...')
    const outPath = path.resolve(process.cwd(), outputPathArg || 'SupabaseInfo.txt')
    const contents = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data)
    fs.writeFileSync(outPath, contents + '\n', 'utf8')
    console.log('Export complete! Wrote to:', outPath)
  } catch (err) {
    console.error('Export failed:', err.message || err)
    process.exitCode = 2
  }
}

run()
