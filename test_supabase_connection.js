#!/usr/bin/env node
/*
 Quick test to see what's available in your Supabase
*/

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false }
})

async function testConnection() {
  try {
    console.log('Testing Supabase connection...')
    console.log('URL:', SUPABASE_URL)
    console.log('Using key type:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'service_role' : process.env.SUPABASE_ANON_KEY ? 'anon' : 'unknown')
    
    // Try to query a simple table to test connection
    console.log('\nTesting basic connection...')
    const { data: sites, error: sitesError } = await supabase
      .from('sites')
      .select('*')
      .limit(1)
    
    if (sitesError) {
      console.log('Sites query error:', sitesError.message)
    } else {
      console.log('✅ Basic connection works! Found', sites?.length || 0, 'sites')
    }
    
    // Test if we can run any RPC functions
    console.log('\nTesting RPC access...')
    try {
      const { data: rpcTest, error: rpcError } = await supabase.rpc('non_existent_function')
      console.log('RPC error (expected):', rpcError?.message)
    } catch (e) {
      console.log('RPC test result:', e.message)
    }
    
  } catch (err) {
    console.error('Connection test failed:', err.message)
  }
}

testConnection()