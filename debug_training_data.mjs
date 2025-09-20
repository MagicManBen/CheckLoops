#!/usr/bin/env node

// Debug script to check training data in the database
import { createClient } from '@supabase/supabase-js';

// Node.js compatible config
const CONFIG = {
  SUPABASE_URL: 'https://unveoqnlqnobufhublyw.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMTcyNzYsImV4cCI6MjA3MDU5MzI3Nn0.g93OsXDpO3V9DToU7s-Z3SwBBnB84rBv0JMv-idgSME'
};

const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);

async function debugTrainingData() {
  console.log('🔍 Debugging training data...\n');
  
  try {
    // 1. Check staff_training_records table
    console.log('1. Checking staff_training_records table:');
    const { data: staffTraining, error: staffError } = await supabase
      .from('staff_training_records')
      .select('*')
      .limit(10);
    
    if (staffError) {
      console.log('   ❌ Error:', staffError.message);
    } else {
      console.log(`   ✅ Found ${staffTraining?.length || 0} records`);
      if (staffTraining && staffTraining.length > 0) {
        console.log('   Sample record:', JSON.stringify(staffTraining[0], null, 2));
      }
    }
    
    console.log('\n2. Checking training_records table:');
    const { data: trainingRecords, error: trainingError } = await supabase
      .from('training_records')
      .select('*')
      .limit(10);
    
    if (trainingError) {
      console.log('   ❌ Error:', trainingError.message);
    } else {
      console.log(`   ✅ Found ${trainingRecords?.length || 0} records`);
      if (trainingRecords && trainingRecords.length > 0) {
        console.log('   Sample record:', JSON.stringify(trainingRecords[0], null, 2));
      }
    }
    
    console.log('\n3. Checking training_types table:');
    const { data: trainingTypes, error: typesError } = await supabase
      .from('training_types')
      .select('*')
      .eq('active', true)
      .limit(10);
    
    if (typesError) {
      console.log('   ❌ Error:', typesError.message);
    } else {
      console.log(`   ✅ Found ${trainingTypes?.length || 0} active training types`);
      if (trainingTypes && trainingTypes.length > 0) {
        console.log('   Sample type:', JSON.stringify(trainingTypes[0], null, 2));
      }
    }
    
    console.log('\n4. Checking master_users and user auth:');
    
    // Get current session from auth if possible (we can't do this from Node, so let's work backwards from training records)
    console.log('\n5. Analyzing training records in detail:');
    const { data: allTrainingRecords, error: allError } = await supabase
      .from('training_records')
      .select('*');
    
    if (!allError && allTrainingRecords) {
      console.log(`   ✅ Total training records: ${allTrainingRecords.length}`);
      
      // Group by user_id
      const userGroups = {};
      allTrainingRecords.forEach(record => {
        const userId = record.user_id || 'null';
        if (!userGroups[userId]) {
          userGroups[userId] = [];
        }
        userGroups[userId].push(record);
      });
      
      console.log('   Records by user_id:');
      for (const [userId, records] of Object.entries(userGroups)) {
        console.log(`     User ${userId}: ${records.length} records`);
        
        if (userId !== 'null') {
          // Get user details from master_users
          const { data: masterUser } = await supabase
            .from('master_users')
            .select('full_name, site_id, training_compliance_pct, training_percent')
            .eq('auth_user_id', userId)
            .maybeSingle();
          
          if (masterUser) {
            console.log(`       Name: ${masterUser.full_name}`);
            console.log(`       Site ID: ${masterUser.site_id}`);
            console.log(`       Training compliance: ${masterUser.training_compliance_pct}%`);
            console.log(`       Training percent: ${masterUser.training_percent}%`);
          }
          
          // Show sample record for this user
          console.log(`       Sample record:`, {
            training_type_id: records[0].training_type_id,
            completion_date: records[0].completion_date,
            expiry_date: records[0].expiry_date,
            site_id: records[0].site_id
          });
        }
      }
    }
    
    console.log('\n6. Computing compliance for all users:');
    // Get all training types for site 2
    const { data: siteTrainingTypes } = await supabase
      .from('training_types')
      .select('*')
      .eq('site_id', 2)
      .eq('active', true);
    
    if (siteTrainingTypes) {
      console.log(`   Site 2 has ${siteTrainingTypes.length} required training types`);
      
      // For each user with training records, compute compliance
      if (allTrainingRecords) {
        const userIds = [...new Set(allTrainingRecords.map(r => r.user_id).filter(Boolean))];
        
        for (const userId of userIds) {
          const userRecords = allTrainingRecords.filter(r => r.user_id === userId);
          
          // Simple compliance calculation
          let compliant = 0;
          let total = siteTrainingTypes.length;
          
          siteTrainingTypes.forEach(type => {
            const hasRecord = userRecords.some(record => record.training_type_id === type.id);
            if (hasRecord) compliant++;
          });
          
          const percentage = total > 0 ? Math.round((compliant / total) * 100) : 0;
          console.log(`   User ${userId}: ${compliant}/${total} types complete = ${percentage}%`);
        }
      }
    }
    
    console.log('\n✅ Debug complete');
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugTrainingData();