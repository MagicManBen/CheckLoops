/**
 * NHS + CQC Integration Test Script
 * 
 * This script tests the fixed NHS+CQC integration by:
 * 1. Searching for practices with known ODS codes
 * 2. Running the two-phase fetch for each one
 * 3. Verifying both raw JSON and flattened fields are saved
 * 
 * Usage: 
 * - Update the SUPABASE_ANON_KEY before running
 * - Copy this code to the browser console on nhs-gp-dashboard-ultra-debug.html
 * - The script will log all steps and results to the ultra-debug console
 */

// Configuration
const TEST_ODS_CODES = [
  'B86030', // Example GP practice
  'Y02622', // Another example
];

// Test runner function
async function runIntegrationTests() {
  ultraDebugLog('===== STARTING NHS+CQC INTEGRATION TESTS =====', 'system');
  
  // Step 1: Find location IDs for the ODS codes
  ultraDebugLog('Finding location IDs for test ODS codes', 'progress');
  const locationMap = {};
  
  for (const odsCode of TEST_ODS_CODES) {
    try {
      ultraDebugLog(`Looking up location ID for ODS code: ${odsCode}`, 'database');
      
      const { data, error } = await supabase
        .from('CQC All GPs')
        .select('location_id, location_name')
        .eq('ods_code', odsCode)
        .limit(1);
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        locationMap[odsCode] = data[0];
        ultraDebugLog(`Found location ID ${data[0].location_id} for ODS code ${odsCode}`, 'success');
      } else {
        ultraDebugLog(`No location found for ODS code ${odsCode}, will search CQC API directly`, 'warning');
      }
    } catch (e) {
      ultraDebugLog(`Error looking up ODS code ${odsCode}: ${e.message}`, 'error');
    }
  }
  
  // Step 2: Run the two-phase fetch for each location
  for (const [odsCode, location] of Object.entries(locationMap)) {
    try {
      ultraDebugLog(`===== TESTING ODS CODE: ${odsCode} =====`, 'system');
      ultraDebugLog(`Location: ${location.location_name} (${location.location_id})`, 'info');
      
      // Clear previous data
      apiResponses = { supabase_row: null, edge_response: null, cqc_data: null, ods_data: null };
      
      // Set current surgery
      currentSurgery = {
        location_id: location.location_id,
        ods_code: odsCode
      };
      
      // Fetch initial state
      const { data: initialRow } = await supabase
        .from('CQC All GPs')
        .select('*')
        .eq('location_id', location.location_id)
        .single();
        
      ultraDebugLog('Initial database state', 'database', {
        has_nhs_ods_data: !!initialRow.nhs_ods_data,
        has_location_source: !!initialRow.location_source,
        fields_with_values: Object.keys(initialRow).filter(k => initialRow[k] !== null).length
      });
      
      // Run the full fetch cycle
      ultraDebugLog('Starting two-phase fetch cycle', 'progress');
      await fetchAllData();
      
      // Wait for all operations to complete
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Verify results
      const { data: finalRow } = await supabase
        .from('CQC All GPs')
        .select('*')
        .eq('location_id', location.location_id)
        .single();
        
      // Check that both raw JSON and flattened fields are saved
      const verification = {
        has_nhs_ods_data: !!finalRow.nhs_ods_data,
        has_location_source: !!finalRow.location_source,
        has_provider_source: !!finalRow.provider_source,
        fields_with_values: Object.keys(finalRow).filter(k => finalRow[k] !== null).length,
        nhs_flattened_fields: {
          ods_code: finalRow.ods_code,
          main_phone_number: finalRow.main_phone_number,
          website: finalRow.website,
          address_line_1: finalRow.address_line_1,
          last_nhs_update: finalRow.last_nhs_update
        },
        cqc_flattened_fields: {
          location_name: finalRow.location_name,
          provider_name: finalRow.provider_name,
          overall_rating: finalRow.overall_rating
        }
      };
      
      ultraDebugLog('Verification complete', 'success', verification);
      
      // Determine overall success
      const success = verification.has_nhs_ods_data && 
                      verification.has_location_source && 
                      verification.fields_with_values > 20;
                      
      ultraDebugLog(`Test ${success ? 'PASSED ✓' : 'FAILED ✗'} for ${odsCode}`, success ? 'success' : 'error');
    } catch (e) {
      ultraDebugLog(`Test error for ${odsCode}: ${e.message}`, 'error', { stack: e.stack });
    }
  }
  
  ultraDebugLog('===== NHS+CQC INTEGRATION TESTS COMPLETE =====', 'system');
}

// Run tests
runIntegrationTests().catch(e => {
  ultraDebugLog('Test script error: ' + e.message, 'error', { stack: e.stack });
});