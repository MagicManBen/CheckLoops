#!/usr/bin/env node
/*
 Simple script to call the Supabase RPC function `admin.export_everything()`
 and save the JSON result to `supabaseinfo.txt` at the repository root.

 Usage:
  - create a .env or provide SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the environment
  - node scripts/export_supabase.js [--pretty]
*/

import fs from 'fs'
import path from 'path'
import minimist from 'minimist'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const argv = minimist(process.argv.slice(2))
const pretty = argv.pretty || argv.p

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.')
  console.error('Create a .env with SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or export them in your environment.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  // use the service role key to ensure RPC can run if it's restricted to authenticated requests
  auth: { persistSession: false }
})

async function run() {
  try {
    // call RPC - note schema-qualified function can be used
    const { data, error } = await supabase.rpc('export_everything')
    if (error) throw error

    const outPath = path.resolve(process.cwd(), 'supabaseinfo.txt')
    const contents = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data)
    fs.writeFileSync(outPath, contents, 'utf8')
    console.log('Wrote export to', outPath)
  } catch (err) {
    console.error('Export failed:', err.message || err)
    process.exitCode = 2
  }
}

run()
