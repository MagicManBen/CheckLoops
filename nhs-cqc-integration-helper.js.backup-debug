/**
 * NHS + CQC Integration Helper
 * 
 * This snippet demonstrates how to use the fixed NHS+CQC integration
 * in a sequential, reliable way.
 */

// Initialize Supabase client
const supabase = window.supabase.createClient(
  'https://unveoqnlqnobufhublyw.supabase.co', 
  'YOUR_ANON_KEY'
);

/**
 * Fetch and save both CQC and NHS data for a location in a reliable sequential flow
 * @param {string} locationId - CQC location ID
 * @param {string} odsCode - Optional ODS code (will be derived from CQC if not provided)
 * @returns {Promise<Object>} - Combined results from both phases
 */
async function fetchAndSaveCqcAndNhs(locationId, odsCode = null) {
  console.log(`Starting two-phase CQC → NHS flow for location: ${locationId}`);
  
  // Phase 1: Fetch CQC data only
  const cqcResult = await supabase.functions.invoke('fetch-nhs-data-complete', {
    body: {
      location_id: locationId,
      ods_code: odsCode,
      data_sources: ['cqc']
    }
  });
  
  console.log(`CQC phase complete, status: ${cqcResult.data?.status}`);
  
  // Extract ODS code from CQC result if not provided
  if (!odsCode) {
    // Try to extract from the CQC response
    const cqcData = cqcResult.data?.data?.cqc_data || cqcResult.data?.data || null;
    if (cqcData) {
      odsCode = cqcData.odsCode || 
                cqcData.ods_code || 
                cqcData.location?.odsCode || 
                cqcData.provider?.odsCode || 
                null;
    }
    
    // If still no ODS code, reload the row to see if it was saved by the edge function
    if (!odsCode) {
      const { data: row } = await supabase
        .from('CQC All GPs')
        .select('ods_code')
        .eq('location_id', locationId)
        .single();
        
      if (row?.ods_code) {
        odsCode = row.ods_code;
        console.log(`ODS code found in database: ${odsCode}`);
      }
    }
  }
  
  // If no ODS code after CQC phase, we can't proceed to NHS phase
  if (!odsCode) {
    console.warn('No ODS code available after CQC phase, skipping NHS phase');
    return { cqcResult, nhsResult: null };
  }
  
  // Small delay to allow DB triggers to settle
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Phase 2: Fetch NHS ODS data using the ODS code
  console.log(`Starting NHS phase with ODS code: ${odsCode}`);
  const nhsResult = await supabase.functions.invoke('fetch-nhs-data-complete', {
    body: {
      location_id: locationId,
      ods_code: odsCode,
      data_sources: ['ods']
    }
  });
  
  console.log(`NHS phase complete, status: ${nhsResult.data?.status}`);
  
  // Return both results
  return { cqcResult, nhsResult };
}

/**
 * Example usage:
 * 
 * // Fetch and save data for a location
 * const results = await fetchAndSaveCqcAndNhs('1-10288346453');
 * 
 * // Check if both phases completed successfully
 * const cqcSuccess = results.cqcResult?.data?.status === 'success';
 * const nhsSuccess = results.nhsResult?.data?.status === 'success';
 * 
 * // Check if database was updated
 * const dbUpdated = results.cqcResult?.data?.database_updated || 
 *                  results.nhsResult?.data?.database_updated;
 */