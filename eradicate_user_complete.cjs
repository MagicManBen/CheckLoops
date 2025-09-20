const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://unveoqnlqnobufhublyw.supabase.co';
const supabaseKey = (typeof process !== 'undefined' && process.env?.SUPABASE_SERVICE_ROLE_KEY) || '';
if (!supabaseKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY not set in environment');
}

const supabase = createClient(supabaseUrl, supabaseKey);

const TARGET_EMAIL = 'ben.howard@stoke.nhs.uk';
const TARGET_USER_ID = 'a995b5a7-17c4-49af-b36a-cc9e0ee1ba50';

async function confirmDeletion() {
  console.log('⚠️  CRITICAL OPERATION: COMPLETE USER DATA DELETION');
  console.log('='.repeat(60));
  console.log(`Target Email: ${TARGET_EMAIL}`);
  console.log(`Target User ID: ${TARGET_USER_ID}`);
  console.log('');
  console.log('This will PERMANENTLY DELETE all data for this user from:');
  console.log('  - master_users table (2 records)');
  console.log('  - holidays table (1 record)');  
  console.log('  - auth.users table (auth account)');
  console.log('');
  console.log('🚨 THIS OPERATION CANNOT BE UNDONE!');
  console.log('');
  
  // In a real scenario, you might want to add a confirmation prompt
  // For automation, we'll proceed directly
  return true;
}

async function deleteFromMasterUsers() {
  console.log('🗑️  Deleting from master_users table...');
  
  try {
    // Delete by auth_user_id
    const { data: deletedByAuthId, error: authIdError } = await supabase
      .from('master_users')
      .delete()
      .eq('auth_user_id', TARGET_USER_ID)
      .select();
    
    if (authIdError) {
      throw new Error(`Failed to delete by auth_user_id: ${authIdError.message}`);
    }
    
    console.log(`   ✅ Deleted ${deletedByAuthId?.length || 0} record(s) by auth_user_id`);
    
    // Delete by email as backup
    const { data: deletedByEmail, error: emailError } = await supabase
      .from('master_users')
      .delete()
      .eq('email', TARGET_EMAIL)
      .select();
    
    if (emailError) {
      console.warn(`   ⚠️  Warning deleting by email: ${emailError.message}`);
    } else {
      console.log(`   ✅ Deleted ${deletedByEmail?.length || 0} additional record(s) by email`);
    }
    
    return true;
  } catch (err) {
    console.error('   ❌ Error deleting from master_users:', err.message);
    return false;
  }
}

async function deleteFromHolidays() {
  console.log('🗑️  Deleting from holidays table...');
  
  try {
    const { data: deletedHolidays, error } = await supabase
      .from('holidays')
      .delete()
      .eq('user_id', TARGET_USER_ID)
      .select();
    
    if (error) {
      throw new Error(`Failed to delete holidays: ${error.message}`);
    }
    
    console.log(`   ✅ Deleted ${deletedHolidays?.length || 0} holiday record(s)`);
    return true;
  } catch (err) {
    console.error('   ❌ Error deleting from holidays:', err.message);
    return false;
  }
}

async function deleteFromAuth() {
  console.log('🗑️  Deleting from auth.users (final step)...');
  
  try {
    const { data, error } = await supabase.auth.admin.deleteUser(TARGET_USER_ID);
    
    if (error) {
      throw new Error(`Failed to delete auth user: ${error.message}`);
    }
    
    console.log('   ✅ Successfully deleted user from auth system');
    return true;
  } catch (err) {
    console.error('   ❌ Error deleting from auth system:', err.message);
    return false;
  }
}

async function verifyDeletion() {
  console.log('🔍 Verifying complete removal...');
  
  const checks = [];
  
  // Check auth system
  try {
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    const stillExists = authUsers.users.find(user => user.id === TARGET_USER_ID || user.email === TARGET_EMAIL);
    
    if (stillExists) {
      checks.push('❌ User still exists in auth system');
    } else {
      checks.push('✅ User removed from auth system');
    }
  } catch (err) {
    checks.push('⚠️  Could not verify auth system');
  }
  
  // Check master_users
  try {
    const { data: masterUsers } = await supabase
      .from('master_users')
      .select('*')
      .or(`auth_user_id.eq.${TARGET_USER_ID},email.eq.${TARGET_EMAIL}`);
    
    if (masterUsers && masterUsers.length > 0) {
      checks.push(`❌ ${masterUsers.length} record(s) still in master_users`);
    } else {
      checks.push('✅ No records in master_users');
    }
  } catch (err) {
    checks.push('⚠️  Could not verify master_users');
  }
  
  // Check holidays
  try {
    const { data: holidays } = await supabase
      .from('holidays')
      .select('*')
      .eq('user_id', TARGET_USER_ID);
    
    if (holidays && holidays.length > 0) {
      checks.push(`❌ ${holidays.length} record(s) still in holidays`);
    } else {
      checks.push('✅ No records in holidays');
    }
  } catch (err) {
    checks.push('⚠️  Could not verify holidays');
  }
  
  console.log('\n📋 VERIFICATION RESULTS:');
  checks.forEach(check => console.log(`   ${check}`));
  
  const failed = checks.filter(check => check.includes('❌'));
  return failed.length === 0;
}

async function eradicateUser() {
  console.log('🚀 Starting complete user eradication...');
  console.log('='.repeat(50));
  
  // Step 1: Confirm operation
  const confirmed = await confirmDeletion();
  if (!confirmed) {
    console.log('❌ Operation cancelled');
    return;
  }
  
  // Step 2: Delete from data tables first
  const masterUsersSuccess = await deleteFromMasterUsers();
  const holidaysSuccess = await deleteFromHolidays();
  
  // Step 3: Delete from auth system last
  const authSuccess = await deleteFromAuth();
  
  // Step 4: Verify complete removal
  console.log('');
  const verificationPassed = await verifyDeletion();
  
  // Final summary
  console.log('\n🏁 ERADICATION SUMMARY');
  console.log('='.repeat(30));
  console.log(`Master Users: ${masterUsersSuccess ? '✅ DELETED' : '❌ FAILED'}`);
  console.log(`Holidays: ${holidaysSuccess ? '✅ DELETED' : '❌ FAILED'}`);
  console.log(`Auth System: ${authSuccess ? '✅ DELETED' : '❌ FAILED'}`);
  console.log(`Verification: ${verificationPassed ? '✅ CLEAN' : '❌ INCOMPLETE'}`);
  
  if (masterUsersSuccess && holidaysSuccess && authSuccess && verificationPassed) {
    console.log('\n🎉 SUCCESS: User ben.howard@stoke.nhs.uk has been completely eradicated!');
  } else {
    console.log('\n⚠️  WARNING: Eradication incomplete - manual cleanup may be required');
  }
}

// Execute the eradication
eradicateUser()
  .then(() => {
    console.log('\n✅ Eradication process complete!');
    process.exit(0);
  })
  .catch(err => {
    console.error('\n💥 Eradication failed:', err);
    process.exit(1);
  });