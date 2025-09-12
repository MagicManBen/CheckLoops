import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://unveoqnlqnobufhublyw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMTcyNzYsImV4cCI6MjA3MDU5MzI3Nn0.g93OsXDpO3V9DToU7s-Z3SwBBnB84rBv0JMv-idgSME'
);

// First sign in as admin to check data
const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
  email: 'benhowardmagic@hotmail.com',
  password: 'Hello1!'
});

if (authError) {
  console.error('Auth error:', authError);
  process.exit(1);
}

console.log('Logged in as:', authData.user.email);
console.log('User ID:', authData.user.id);
console.log('User metadata:', JSON.stringify(authData.user.user_metadata, null, 2));
console.log('User role from metadata:', authData.user.user_metadata?.role);

// Check profiles table
const { data: profiles, error: profileError } = await supabase
  .from('profiles')
  .select('*')
  .eq('user_id', authData.user.id);

console.log('\nProfile data:', JSON.stringify(profiles, null, 2));

// Check site info  
const siteId = authData.user.user_metadata?.site_id || 2;
const { data: sites, error: siteError } = await supabase
  .from('sites')
  .select('*')
  .eq('id', siteId);

console.log('\nSite data:', JSON.stringify(sites, null, 2));

process.exit(0);
