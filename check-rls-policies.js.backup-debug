#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://unveoqnlqnobufhublyw.supabase.co';
const SERVICE_KEY = 'sb_secret_ylIhDtikpno4LTTUmpDJvw_Ov7BtIEp';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

console.log('=== Current RLS Policies for CQC All GPs ===\n');

async function checkPolicies() {
  // Query to check RLS policies
  const { data, error } = await supabase.rpc('get_policies', {
    table_name: 'CQC All GPs'
  }).single();

  if (error) {
    // Try alternative query
    const { data: policies, error: err2 } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'CQC All GPs');

    if (err2) {
      console.log('Cannot directly query policies. Checking with a test...\n');
      return false;
    }

    if (policies && policies.length > 0) {
      console.log('Found policies:', policies);
      return true;
    }
  }

  if (data) {
    console.log('Policies:', data);
    return true;
  }

  return false;
}

async function testRLSStatus() {
  // Check if RLS is enabled
  const { data, error } = await supabase.rpc('check_rls_enabled', {
    table_name: 'CQC All GPs'
  }).single();

  if (!error && data) {
    console.log('RLS Enabled:', data.rls_enabled);
  } else {
    // Alternative: Try to detect RLS by behavior
    console.log('Detecting RLS status by behavior...\n');

    // Test with anon permissions
    const anonClient = createClient(SUPABASE_URL, 'sb_publishable_wpy7lxfbI2HwvsznlWJVKg_Zx7HnAc4');

    // Test SELECT
    const { data: selectData, error: selectError } = await anonClient
      .from('CQC All GPs')
      .select('location_id')
      .limit(1);

    const canRead = !selectError && selectData && selectData.length > 0;

    // Test UPDATE
    const { data: updateData } = await anonClient
      .from('CQC All GPs')
      .update({ updated_at: new Date().toISOString() })
      .eq('location_id', '1-10240838706')
      .select();

    const canUpdate = updateData && updateData.length > 0;

    console.log('RLS Behavior Detection:');
    console.log(`  ✅ Anon can READ: ${canRead}`);
    console.log(`  ❌ Anon can UPDATE: ${canUpdate}`);
    console.log('\n  This confirms RLS is enabled and blocking updates.\n');
  }
}

async function showSolution() {
  console.log('=== SOLUTION: Fix RLS Policies ===\n');
  console.log('Run this SQL in Supabase SQL Editor:\n');
  console.log(`-- Allow anon users to UPDATE rows
CREATE POLICY "anon_update_all" ON "CQC All GPs"
    FOR UPDATE
    TO anon
    USING (true)
    WITH CHECK (true);

-- Verify it worked
SELECT policyname, roles, cmd
FROM pg_policies
WHERE tablename = 'CQC All GPs'
ORDER BY policyname;`);
}

async function main() {
  await testRLSStatus();
  await checkPolicies();
  showSolution();
}

main().catch(console.error);