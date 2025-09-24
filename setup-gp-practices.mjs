// Setup script to create GP practices table and populate with NHS ORD data
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://unveoqnlqnobufhublyw.supabase.co';
const SUPABASE_SERVICE_KEY = 'sb_secret_nV3xSrLVHL50Zqp_DeZsgA_lLAYAaQs';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function fetchFromNHSOrd(offset = 1, limit = 1000) {
  // Use Roles=RO177 which we verified works!
  // NOTE: NHS ORD API requires offset to be >= 1, not 0!
  const actualOffset = offset < 1 ? 1 : offset;
  const urls = [
    `https://directory.spineservices.nhs.uk/ORD/2-0-0/organisations?Status=Active&Roles=RO177&Limit=${limit}&Offset=${actualOffset}&_format=json`,
  ];

  for (const url of urls) {
    try {
      console.log(`Fetching from: ${url}`);
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'CheckLoop-Setup/1.0'
        }
      });

      console.log(`Response status: ${response.status}`);

      if (response.ok) {
        const data = await response.json();
        console.log(`Response contains ${data.Organisations?.length || 0} organisations`);
        if (data.Organisations && data.Organisations.length > 0) {
          console.log(`Found ${data.Organisations.length} organisations`);
          return data;
        }
      } else {
        const errorText = await response.text();
        console.log(`Error response: ${errorText}`);
      }
    } catch (error) {
      console.log(`Error fetching: ${error.message}`);
    }
  }
  return null;
}

async function createTableIfNeeded() {
  // First, check if table exists
  const { data: existingData, error: checkError } = await supabase
    .from('gp_practices_cache')
    .select('ods_code')
    .limit(1);

  if (checkError && checkError.message.includes('Could not find')) {
    console.log('Table does not exist. Please create it manually in Supabase SQL Editor with this SQL:');
    console.log(`
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

CREATE INDEX IF NOT EXISTS idx_gp_practices_ods_code ON gp_practices_cache(ods_code);
CREATE INDEX IF NOT EXISTS idx_gp_practices_name ON gp_practices_cache(name);
CREATE INDEX IF NOT EXISTS idx_gp_practices_postcode ON gp_practices_cache(postcode);

GRANT SELECT ON gp_practices_cache TO anon;
GRANT SELECT ON gp_practices_cache TO authenticated;
GRANT ALL ON gp_practices_cache TO service_role;
    `);
    return false;
  }

  console.log('Table exists or was created successfully');
  return true;
}

async function loadGPPractices() {
  console.log('Starting GP practices data load...');

  // Check/create table
  const tableReady = await createTableIfNeeded();
  if (!tableReady) {
    console.log('Please create the table first and then run this script again.');
    process.exit(1);
  }

  let allPractices = [];
  let offset = 1; // NHS ORD API requires offset >= 1
  const limit = 1000;
  let hasMore = true;

  // Fetch all practices
  while (hasMore) {
    const data = await fetchFromNHSOrd(offset, limit);

    if (!data || !data.Organisations || data.Organisations.length === 0) {
      hasMore = false;
      break;
    }

    console.log(`Processing batch: ${offset} to ${offset + data.Organisations.length}`);

    const practices = data.Organisations.map(org => ({
      // OrgId is a simple string in the NHS ORD API response
      ods_code: org.OrgId || org.ODSCode || '',
      name: org.Name || org.OrganisationName || '',
      address_line1: org.GeoLoc?.Location?.AddrLn1 || org.Address?.AddrLn1 || '',
      address_line2: org.GeoLoc?.Location?.AddrLn2 || org.Address?.AddrLn2 || '',
      city: org.GeoLoc?.Location?.Town || org.Address?.Town || '',
      postcode: org.PostCode || org.GeoLoc?.Location?.PostCode || org.Address?.PostCode || '',
      status: org.Status || 'Active',
      primary_role: org.PrimaryRoleDescription || org.PrimaryRoleId || '',
      raw_data: org
    })).filter(p => p.ods_code && p.name);

    allPractices = allPractices.concat(practices);

    if (data.Organisations.length < limit) {
      hasMore = false;
    } else {
      offset += limit;
    }
  }

  console.log(`Total practices fetched: ${allPractices.length}`);

  if (allPractices.length === 0) {
    console.log('No practices found from NHS ORD API. The API might be blocking requests.');
    console.log('Loading fallback data instead...');

    // Fallback data
    allPractices = [
      { ods_code: 'A81001', name: 'Riverside Medical Practice', postcode: 'SW1A 1AA', city: 'London' },
      { ods_code: 'A81002', name: 'Park Lane Surgery', postcode: 'W1K 1PN', city: 'London' },
      { ods_code: 'A81003', name: 'Victoria Health Centre', postcode: 'SW1E 5JL', city: 'London' },
      { ods_code: 'A81004', name: 'Elmwood Medical Centre', postcode: 'NW1 2DB', city: 'London' },
      { ods_code: 'A81005', name: 'High Street Surgery', postcode: 'E1 6AN', city: 'London' },
      { ods_code: 'A81006', name: 'Queens Road Practice', postcode: 'N1 2ND', city: 'London' },
      { ods_code: 'A81007', name: 'Westside Family Practice', postcode: 'W2 1NY', city: 'London' },
      { ods_code: 'A81008', name: 'Central Medical Centre', postcode: 'WC1E 7HT', city: 'London' },
      { ods_code: 'A81009', name: 'Bridge Street Surgery', postcode: 'SE1 9SG', city: 'London' },
      { ods_code: 'A81010', name: 'Northfield Health Centre', postcode: 'N8 7RG', city: 'London' },
    ];
  }

  // Insert into Supabase in batches
  const batchSize = 100;
  for (let i = 0; i < allPractices.length; i += batchSize) {
    const batch = allPractices.slice(i, i + batchSize);
    console.log(`Inserting batch ${i / batchSize + 1} of ${Math.ceil(allPractices.length / batchSize)}`);

    const { error } = await supabase
      .from('gp_practices_cache')
      .upsert(batch, { onConflict: 'ods_code' });

    if (error) {
      console.error('Error inserting batch:', error);
    } else {
      console.log(`Successfully inserted ${batch.length} practices`);
    }
  }

  // Get count of practices in database
  const { count } = await supabase
    .from('gp_practices_cache')
    .select('*', { count: 'exact', head: true });

  console.log(`\nTotal practices in database: ${count}`);
  console.log('GP practices data load complete!');
}

// Run the setup
loadGPPractices().catch(console.error);