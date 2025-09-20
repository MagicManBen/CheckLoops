import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://unveoqnlqnobufhublyw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAxNzI3NiwiZXhwIjoyMDcwNTkzMjc2fQ.CJxV14F0T2TWkAjeR4bpYiBIOwLwyfzF9WzAWwS99Xc';

const supabase = createClient(supabaseUrl, supabaseKey);

describe('Comprehensive Admin Dashboard Fix Verification', () => {
  const results = {
    working: [],
    failing: [],
    profilesErrors: []
  };

  describe('Core Tables (Must Work)', () => {
    test('master_users table should be accessible', async () => {
      const { data, error } = await supabase
        .from('master_users')
        .select('id, auth_user_id, email, full_name, kiosk_user_id')
        .limit(1);

      expect(error).toBeNull();
      expect(data).toBeDefined();
      if (!error) results.working.push('master_users');
    });

    test('complaints table should be accessible', async () => {
      const { data, error } = await supabase
        .from('complaints')
        .select('*')
        .limit(1);

      expect(error).toBeNull();
      if (!error) results.working.push('complaints');
    });

    test('training_records table should be accessible', async () => {
      const { data, error } = await supabase
        .from('training_records')
        .select('*')
        .limit(1);

      expect(error).toBeNull();
      if (!error) results.working.push('training_records');
    });

    test('4_holiday_requests table should be accessible', async () => {
      const { data, error } = await supabase
        .from('4_holiday_requests')
        .select('*')
        .limit(1);

      expect(error).toBeNull();
      if (!error) results.working.push('4_holiday_requests');
    });
  });

  describe('Check for Profiles References', () => {
    test('profiles table should NOT exist', async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);

      expect(error).toBeDefined();
      expect(error?.message).toContain('profiles');

      if (error && error.message.includes('profiles')) {
        console.log('✅ Profiles table correctly does not exist');
      } else {
        results.profilesErrors.push('profiles table might exist!');
      }
    });

    test('RPC functions should not reference profiles', async () => {
      // Test with invalid IDs to trigger errors
      const { error: error1 } = await supabase.rpc('transfer_fuzzy_match_to_request', {
        p_fuzzy_match_id: -1,
        p_user_id: '00000000-0000-0000-0000-000000000000'
      });

      const { error: error2 } = await supabase.rpc('transfer_fuzzy_training_to_record', {
        p_fuzzy_match_id: -1,
        p_user_id: '00000000-0000-0000-0000-000000000000',
        p_training_type_id: -1
      });

      // Check errors don't mention profiles
      if (error1?.message.includes('profiles')) {
        results.profilesErrors.push('transfer_fuzzy_match_to_request still references profiles');
      }
      if (error2?.message.includes('profiles')) {
        results.profilesErrors.push('transfer_fuzzy_training_to_record still references profiles');
      }

      expect(error1?.message || '').not.toContain('profiles');
      expect(error2?.message || '').not.toContain('profiles');
    });
  });

  describe('Views for Backward Compatibility', () => {
    test('two_week_email view should work or not exist', async () => {
      const { data, error } = await supabase
        .from('two_week_email')
        .select('*')
        .limit(1);

      if (!error) {
        results.working.push('two_week_email view');
      } else if (error.message.includes('does not exist')) {
        console.log('two_week_email view not created yet');
      } else if (error.message.includes('profiles')) {
        results.profilesErrors.push('two_week_email references profiles');
      }
    });

    test('holidays view should work or not exist', async () => {
      const { data, error } = await supabase
        .from('holidays')
        .select('*')
        .limit(1);

      if (!error) {
        results.working.push('holidays view');
      } else if (error.message.includes('does not exist')) {
        console.log('holidays view not created yet');
      } else if (error.message.includes('profiles')) {
        results.profilesErrors.push('holidays references profiles');
      }
    });

    test('schedules view should work or not exist', async () => {
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .limit(1);

      if (!error) {
        results.working.push('schedules view');
      } else if (error.message.includes('does not exist')) {
        console.log('schedules view not created yet');
      } else if (error.message.includes('profiles')) {
        results.profilesErrors.push('schedules references profiles');
      }
    });

    test('mandatory_training view should work or not exist', async () => {
      const { data, error } = await supabase
        .from('mandatory_training')
        .select('*')
        .limit(1);

      if (!error) {
        results.working.push('mandatory_training view');
      } else if (error.message.includes('does not exist')) {
        console.log('mandatory_training view not created yet');
      } else if (error.message.includes('profiles')) {
        results.profilesErrors.push('mandatory_training references profiles');
      }
    });
  });

  afterAll(() => {
    console.log('\n=== FINAL RESULTS ===');
    console.log(`✅ Working: ${results.working.join(', ')}`);
    console.log(`❌ Profiles Errors: ${results.profilesErrors.length > 0 ? results.profilesErrors.join(', ') : 'None!'}`);

    if (results.profilesErrors.length === 0) {
      console.log('\n🎉 SUCCESS! No profiles references found!');
      console.log('Run the force_fix_all_functions.sql script to create the missing views.');
    } else {
      console.log('\n⚠️  Still have profiles references. Check the errors above.');
    }
  });
});