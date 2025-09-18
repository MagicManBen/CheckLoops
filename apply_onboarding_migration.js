#!/usr/bin/env node

/**
 * Script to apply onboarding_complete migration to Supabase database
 * 
 * Usage:
 *   1. Via Supabase Dashboard (recommended):
 *      - Go to https://supabase.com/dashboard/project/unveoqnlqnobufhublyw/sql/new
 *      - Copy the SQL from supabase/migrations/20250911124430_add_onboarding_complete_column.sql
 *      - Click "Run"
 * 
 *   2. Via Supabase CLI:
 *      - Set your database password: export SUPABASE_DB_PASSWORD=your_password
 *      - Run: supabase db push --password $SUPABASE_DB_PASSWORD
 * 
 *   3. Via this script (requires service role key):
 *      - Set environment variables:
 *        export SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
 *      - Run: node apply_onboarding_migration.js
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const SUPABASE_URL = 'https://unveoqnlqnobufhublyw.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.log('❌ SUPABASE_SERVICE_ROLE_KEY not set');
  console.log('\n📋 Instructions to apply migration:');
  console.log('\n1. Via Supabase Dashboard (RECOMMENDED):');
  console.log('   - Go to: https://supabase.com/dashboard/project/unveoqnlqnobufhublyw/sql/new');
  console.log('   - Copy the SQL from: supabase/migrations/20250911124430_add_onboarding_complete_column.sql');
  console.log('   - Click "Run"');
  console.log('\n2. Via Supabase CLI:');
  console.log('   - Run: supabase db push');
  console.log('   - Enter your database password when prompted');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Read the migration SQL
const migrationPath = path.join(__dirname, 'supabase/migrations/20250911124430_add_onboarding_complete_column.sql');
const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

console.log('📦 Migration SQL to be applied:');
console.log('================================');
console.log(migrationSQL);
console.log('================================\n');

console.log('⚠️  This script cannot directly execute DDL statements.');
console.log('Please apply the migration using one of these methods:\n');
console.log('1. Supabase Dashboard SQL Editor:');
console.log('   https://supabase.com/dashboard/project/unveoqnlqnobufhublyw/sql/new\n');
console.log('2. Supabase CLI:');
console.log('   supabase db push\n');

// We can check if the column already exists
async function checkMigrationStatus() {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('onboarding_complete')
      .limit(1);
    
    if (error && error.message.includes('column "onboarding_complete" does not exist')) {
      console.log('❌ Column onboarding_complete does not exist yet - migration needed');
      return false;
    }
    
    if (!error) {
      console.log('✅ Column onboarding_complete already exists - migration may have been applied');
      return true;
    }
    
    console.log('⚠️  Unable to determine migration status:', error.message);
    return null;
  } catch (err) {
    console.error('Error checking migration status:', err);
    return null;
  }
}

console.log('\n🔍 Checking current migration status...');
const status = await checkMigrationStatus();

if (status === true) {
  console.log('\n✨ Migration appears to be already applied!');
} else if (status === false) {
  console.log('\n⏳ Migration needs to be applied using one of the methods above.');
}

process.exit(0);