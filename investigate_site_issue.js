// Investigation script for site display issue
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://unveoqnlqnobufhublyw.supabase.co';
const supabaseKey = (typeof process !== 'undefined' && process.env?.SUPABASE_SERVICE_ROLE_KEY) || '';
if (!supabaseKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY not set in environment');
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function investigateSiteIssue() {
    console.log('=== INVESTIGATING SITE DISPLAY ISSUE ===\n');

    try {
        // 1. Check sites table structure and data
        console.log('1. Checking sites table:');
        const { data: sites, error: sitesError } = await supabase
            .from('sites')
            .select('*');

        if (sitesError) {
            console.log('Sites table error:', sitesError);
        } else {
            console.log('Sites table data:', sites);
        }

        // 2. Check master_users table for site_id = 2
        console.log('\n2. Checking master_users with site_id = 2:');
        const { data: users, error: usersError } = await supabase
            .from('master_users')
            .select('*')
            .eq('site_id', 2);

        if (usersError) {
            console.log('Master_users error:', usersError);
        } else {
            console.log('Master_users with site_id 2:', users);
        }

        // 3. Check if there's a site with id = 2
        console.log('\n3. Checking specific site with id = 2:');
        const { data: site2, error: site2Error } = await supabase
            .from('sites')
            .select('*')
            .eq('id', 2);

        if (site2Error) {
            console.log('Site id=2 error:', site2Error);
        } else {
            console.log('Site with id=2:', site2);
        }

        // 4. Look for Harley Street Medical Centre
        console.log('\n4. Searching for Harley Street Medical Centre:');
        const { data: harleyStreet, error: harleyError } = await supabase
            .from('sites')
            .select('*')
            .ilike('name', '%harley%');

        if (harleyError) {
            console.log('Harley Street search error:', harleyError);
        } else {
            console.log('Harley Street sites:', harleyStreet);
        }

        // 5. Check all sites to understand the data
        console.log('\n5. All sites in database:');
        const { data: allSites, error: allSitesError } = await supabase
            .from('sites')
            .select('*')
            .order('id');

        if (allSitesError) {
            console.log('All sites error:', allSitesError);
        } else {
            console.log('All sites:', allSites);
        }

    } catch (error) {
        console.error('Investigation failed:', error);
    }
}

investigateSiteIssue();