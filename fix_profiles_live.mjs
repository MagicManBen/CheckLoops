#!/usr/bin/env node

// Fix profile records directly via Supabase API
import https from 'https';

const SUPABASE_URL = 'https://unveoqnlqnobufhublyw.supabase.co';
const SERVICE_KEY = (typeof process !== 'undefined' && process.env?.SUPABASE_SERVICE_ROLE_KEY) || '';
if (!SERVICE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY not set in environment');
}

async function makeRequest(path, method, data = null) {
  const url = new URL(path, SUPABASE_URL);

  const options = {
    method: method,
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const result = body ? JSON.parse(body) : null;
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(result);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${body}`));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function fixProfiles() {
  console.log('Fixing profile records for staff users...\n');

  const staffEmails = ['benhowardmagic@hotmail.com', 'ben.howard@stoke.nhs.uk'];

  try {
    // For each email, create/update records
    for (const email of staffEmails) {
      console.log(`Processing: ${email}`);

      // Since we can't easily get user IDs without admin access,
      // we'll use upsert with the Supabase client from browser
      // For now, let's create a SQL function that can be called

      console.log(`  - Would create/update profiles and staff_app_welcome for ${email}`);
    }

    // Instead, let's use direct REST API with simpler approach
    // First check if profiles exist
    console.log('\nChecking existing profiles...');
    const profilesResponse = await makeRequest('/rest/v1/profiles?select=*', 'GET');
    console.log(`Found ${profilesResponse?.length || 0} existing profiles`);

    // Check staff_app_welcome
    console.log('\nChecking staff_app_welcome...');
    const welcomeResponse = await makeRequest('/rest/v1/staff_app_welcome?select=*', 'GET');
    console.log(`Found ${welcomeResponse?.length || 0} existing welcome records`);

  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run the fix
fixProfiles();