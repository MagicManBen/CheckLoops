// Simple database schema check using curl
const SUPABASE_URL = 'https://unveoqnlqnobufhublyw.supabase.co';
const SERVICE_ROLE_KEY = (typeof process !== 'undefined' && process.env?.SUPABASE_SERVICE_ROLE_KEY) || '';
if (!SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY not set in environment');
}

console.log('🔍 Checking database schema via REST API...\n');

// Function to make API calls using curl
async function curlQuery(table, select = '*', limit = 1) {
  return new Promise((resolve) => {
    const { spawn } = require('child_process');
    
    const curl = spawn('curl', [
      '-s',
      '-X', 'GET',
      `${SUPABASE_URL}/rest/v1/${table}?select=${select}&limit=${limit}`,
      '-H', `apikey: ${SERVICE_ROLE_KEY}`,
      '-H', `Authorization: Bearer ${SERVICE_ROLE_KEY}`,
      '-H', 'Content-Type: application/json'
    ]);
    
    let stdout = '';
    let stderr = '';
    
    curl.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    curl.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    curl.on('close', (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(stdout);
          resolve({ data: result, error: null });
        } catch (e) {
          resolve({ data: null, error: { message: `JSON parse error: ${e.message}`, raw: stdout } });
        }
      } else {
        resolve({ data: null, error: { message: `curl failed with code ${code}`, stderr, stdout } });
      }
    });
  });
}

async function investigate() {
  // 1. Check master_users table
  console.log('📋 1. Checking master_users table...');
  const masterResult = await curlQuery('master_users');
  
  if (masterResult.error) {
    console.log(`   ❌ Error: ${masterResult.error.message}`);
  } else if (masterResult.data && masterResult.data.length > 0) {
    console.log('   ✅ master_users exists');
    const columns = Object.keys(masterResult.data[0]);
    console.log(`   📝 Columns (${columns.length}): ${columns.join(', ')}`);
    
    const pinColumns = columns.filter(col => col.toLowerCase().includes('pin'));
    if (pinColumns.length > 0) {
      console.log(`   🔑 PIN columns: ${pinColumns.join(', ')}`);
    }
  } else {
    console.log('   📝 master_users exists but empty');
  }
  
  // 2. Check master_users table
  console.log('\n📋 2. Checking master_users table...');
  const kioskResult = await curlQuery('kiosk_users');
  
  if (kioskResult.error) {
    console.log(`   ❌ Error: ${kioskResult.error.message}`);
  } else if (kioskResult.data && kioskResult.data.length > 0) {
    console.log('   ✅ kiosk_users exists');
    const columns = Object.keys(kioskResult.data[0]);
    console.log(`   📝 Columns: ${columns.join(', ')}`);
    
    if (columns.includes('holiday_approved')) {
      console.log('   ✅ holiday_approved column EXISTS');
    } else {
      console.log('   ❌ holiday_approved column MISSING');
    }
  } else {
    console.log('   📝 kiosk_users exists but empty');
  }
  
  // 3. Check master_users table
  console.log('\n📋 3. Checking master_users table...');
  const profilesResult = await curlQuery('profiles');
  
  if (profilesResult.error) {
    console.log(`   ❌ Error: ${profilesResult.error.message}`);
  } else if (profilesResult.data && profilesResult.data.length > 0) {
    console.log('   ✅ profiles exists');
    const columns = Object.keys(profilesResult.data[0]);
    
    const pinColumns = columns.filter(col => 
      col.toLowerCase().includes('pin') || 
      col.toLowerCase().includes('hash')
    );
    
    if (pinColumns.length > 0) {
      console.log(`   🔑 PIN/hash columns: ${pinColumns.join(', ')}`);
    } else {
      console.log('   ⚠️  No PIN/hash columns found');
    }
    
    console.log(`   📄 Sample columns: ${columns.slice(0, 10).join(', ')}`);
  } else {
    console.log('   📝 profiles exists but empty');
  }
  
  console.log('\n🎯 Investigation complete!');
}

investigate().catch(console.error);