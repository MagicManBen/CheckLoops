// Script to delete the user from the identified tables
// Save as delete_user.js

import { createClient } from '@supabase/supabase-js';

// Supabase credentials
const SUPABASE_URL = 'https://unveoqnlqnobufhublyw.supabase.co';
const SUPABASE_KEY = 'sb_secret_ylIhDtikpno4LTTUmpDJvw_Ov7BtIEp';
const EMAIL = 'ben.howard@stoke.nhs.uk';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function deleteFromTable(tableName, id) {
  try {
    console.log(`Deleting from ${tableName} where id = ${id}...`);
    
    const { data, error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', id);
    
    if (error) {
      console.log(`Error deleting from ${tableName}:`, error.message);
      return false;
    }
    
    console.log(`Successfully deleted from ${tableName}`);
    return true;
  } catch (err) {
    console.log(`Exception deleting from ${tableName}:`, err.message);
    return false;
  }
}

async function deleteFromProfiles() {
  try {
    console.log(`Deleting from profiles where email = ${EMAIL}...`);
    
    const { data, error } = await supabase
      .from('profiles')
      .delete()
      .eq('email', EMAIL);
    
    if (error) {
      console.log(`Error deleting from profiles:`, error.message);
      return false;
    }
    
    console.log(`Successfully deleted from profiles`);
    return true;
  } catch (err) {
    console.log(`Exception deleting from profiles:`, err.message);
    return false;
  }
}

async function verifyDeletion() {
  try {
    console.log(`\nVerifying deletion from site_invites...`);
    const { data: inviteData, error: inviteError } = await supabase
      .from('site_invites')
      .select('*')
      .eq('email', EMAIL);
    
    if (inviteError) {
      console.log(`Error checking site_invites:`, inviteError.message);
    } else {
      if (inviteData && inviteData.length > 0) {
        console.log(`WARNING: Email still exists in site_invites:`, inviteData);
      } else {
        console.log(`Email successfully removed from site_invites`);
      }
    }
    
    console.log(`\nVerifying deletion from profiles...`);
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', EMAIL);
    
    if (profileError) {
      console.log(`Error checking profiles:`, profileError.message);
    } else {
      if (profileData && profileData.length > 0) {
        console.log(`WARNING: Email still exists in profiles:`, profileData);
      } else {
        console.log(`Email successfully removed from profiles`);
      }
    }
  } catch (err) {
    console.log(`Exception during verification:`, err.message);
  }
}

async function main() {
  console.log(`Deleting ${EMAIL} from identified tables...`);
  
  // Delete from site_invites
  await deleteFromTable('site_invites', 1);
  
  // Delete from profiles
  await deleteFromProfiles();
  
  // Verify deletion
  await verifyDeletion();
}

main().catch(err => console.error('Error in main execution:', err));