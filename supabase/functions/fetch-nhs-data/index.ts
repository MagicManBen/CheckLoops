import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get request body
    const { practice_ods_code, data_sources = ['ods', 'prescribing'] } = await req.json();

    if (!practice_ods_code) {
      throw new Error('practice_ods_code is required');
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log(`Fetching NHS data for practice: ${practice_ods_code}`);
    console.log(`Data sources requested: ${data_sources.join(', ')}`);

    const results: Record<string, any> = {};
    const errors: Record<string, string> = {};

    // 1. FETCH ODS DATA (if requested)
    if (data_sources.includes('ods')) {
      try {
        console.log('Fetching ODS data...');
        const odsUrl = `https://directory.spineservices.nhs.uk/ORD/2-0-0/organisations/${practice_ods_code}`;

        const odsResponse = await fetch(odsUrl, {
          headers: {
            'Accept': 'application/fhir+json'
          }
        });

        if (odsResponse.ok) {
          const odsData = await odsResponse.json();

          // Extract key information from ODS response
          results.ods_data = {
            organisation: odsData.Organisation || {},
            name: odsData.Organisation?.Name || null,
            status: odsData.Organisation?.Status || null,
            lastChangeDate: odsData.Organisation?.LastChangeDate || null,
            addresses: odsData.Organisation?.GeoLoc?.Location || [],
            roles: odsData.Organisation?.Roles?.Role || [],
            relationships: odsData.Organisation?.Rels?.Rel || [],
            contacts: odsData.Organisation?.Contacts?.Contact || [],
            raw_response: odsData
          };
          console.log('ODS data fetched successfully');
        } else {
          errors.ods = `ODS API error: ${odsResponse.status}`;
          console.error(errors.ods);
        }
      } catch (error) {
        errors.ods = `ODS fetch error: ${error.message}`;
        console.error(errors.ods);
      }
    }

    // 2. FETCH OPENPRESCRIBING DATA (if requested)
    if (data_sources.includes('prescribing')) {
      try {
        console.log('Fetching OpenPrescribing data...');

        // Get latest available month (usually 2-3 months behind current date)
        const today = new Date();
        const threeMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 3, 1);
        const year = threeMonthsAgo.getFullYear();
        const month = String(threeMonthsAgo.getMonth() + 1).padStart(2, '0');
        const dateParam = `${year}-${month}-01`;

        // Fetch top prescribed drugs for this practice
        const prescribingUrl = `https://openprescribing.net/api/1.0/spending_by_practice/?format=json&code=${practice_ods_code}&date=${dateParam}`;

        const prescribingResponse = await fetch(prescribingUrl);

        if (prescribingResponse.ok) {
          const prescribingData = await prescribingResponse.json();

          // Also fetch practice statistics
          const statsUrl = `https://openprescribing.net/api/1.0/org_details/?format=json&org_type=practice&org=${practice_ods_code}`;
          const statsResponse = await fetch(statsUrl);
          const statsData = statsResponse.ok ? await statsResponse.json() : null;

          results.prescribing_data = {
            spending: prescribingData,
            practice_details: statsData,
            data_month: dateParam,
            top_medications: prescribingData.slice(0, 10).map((item: any) => ({
              name: item.name,
              quantity: item.quantity,
              items: item.items,
              actual_cost: item.actual_cost
            }))
          };
          console.log('OpenPrescribing data fetched successfully');
        } else {
          errors.prescribing = `OpenPrescribing API error: ${prescribingResponse.status}`;
          console.error(errors.prescribing);
        }
      } catch (error) {
        errors.prescribing = `Prescribing fetch error: ${error.message}`;
        console.error(errors.prescribing);
      }
    }

    // 3. FETCH PRE-LOADED CSV DATA FROM NHS_Reference_Data table
    const csvDataTypes = ['qof', 'patient_survey', 'workforce', 'appointments', 'referrals'];
    const requestedCsvTypes = csvDataTypes.filter(type => data_sources.includes(type));

    if (requestedCsvTypes.length > 0) {
      console.log(`Fetching pre-loaded CSV data for: ${requestedCsvTypes.join(', ')}`);

      for (const dataType of requestedCsvTypes) {
        try {
          // Query NHS_Reference_Data for this practice and data type
          const { data: refData, error: refError } = await supabaseClient
            .from('NHS_Reference_Data')
            .select('data, period, last_updated')
            .eq('practice_code', practice_ods_code)
            .eq('data_type', dataType)
            .order('last_updated', { ascending: false })
            .limit(1)
            .single();

          if (refData && !refError) {
            results[`${dataType}_data`] = {
              ...refData.data,
              period: refData.period,
              last_updated: refData.last_updated
            };
            console.log(`${dataType} data retrieved from database`);
          } else {
            // Try alternative practice codes if main code not found
            const { data: altData, error: altError } = await supabaseClient
              .from('NHS_Reference_Data')
              .select('data, period, last_updated')
              .eq('ods_code', practice_ods_code)
              .eq('data_type', dataType)
              .order('last_updated', { ascending: false })
              .limit(1)
              .single();

            if (altData && !altError) {
              results[`${dataType}_data`] = {
                ...altData.data,
                period: altData.period,
                last_updated: altData.last_updated
              };
              console.log(`${dataType} data retrieved using ODS code`);
            } else {
              errors[dataType] = `No ${dataType} data found for practice ${practice_ods_code}`;
              console.warn(errors[dataType]);
            }
          }
        } catch (error) {
          errors[dataType] = `Error fetching ${dataType} data: ${error.message}`;
          console.error(errors[dataType]);
        }
      }
    }

    // 4. UPDATE NHS_All_GPs TABLE WITH FETCHED DATA
    try {
      console.log('Updating NHS_All_GPs table...');

      // Check if practice exists
      const { data: existingPractice, error: checkError } = await supabaseClient
        .from('NHS_All_GPs')
        .select('id')
        .eq('practice_ods_code', practice_ods_code)
        .single();

      const updateData: any = {
        practice_ods_code,
        practice_name: results.ods_data?.name || null,
        last_updated: new Date().toISOString()
      };

      // Add fetched data to update object
      if (results.ods_data) updateData.ods_data = results.ods_data;
      if (results.prescribing_data) updateData.prescribing_data = results.prescribing_data;
      if (results.qof_data) updateData.qof_data = results.qof_data;
      if (results.patient_survey_data) updateData.patient_survey_data = results.patient_survey_data;
      if (results.workforce_data) updateData.workforce_data = results.workforce_data;
      if (results.appointments_data) updateData.appointments_data = results.appointments_data;
      if (results.referrals_data) updateData.referrals_data = results.referrals_data;

      // Calculate data completeness
      const completenessScore = {
        ods_data: !!results.ods_data,
        prescribing_data: !!results.prescribing_data,
        qof_data: !!results.qof_data,
        patient_survey_data: !!results.patient_survey_data,
        workforce_data: !!results.workforce_data,
        appointments_data: !!results.appointments_data,
        referrals_data: !!results.referrals_data
      };

      const scorePercentage = (Object.values(completenessScore).filter(v => v).length / 7) * 100;
      updateData.data_completeness = completenessScore;
      updateData.data_quality_score = scorePercentage;

      let upsertResult;
      if (existingPractice && !checkError) {
        // Update existing record
        const { data, error } = await supabaseClient
          .from('NHS_All_GPs')
          .update(updateData)
          .eq('practice_ods_code', practice_ods_code)
          .select()
          .single();

        upsertResult = { data, error };
      } else {
        // Insert new record
        const { data, error } = await supabaseClient
          .from('NHS_All_GPs')
          .insert(updateData)
          .select()
          .single();

        upsertResult = { data, error };
      }

      if (upsertResult.error) {
        console.error('Database update error:', upsertResult.error);
        errors.database = `Failed to update database: ${upsertResult.error.message}`;
      } else {
        console.log('NHS_All_GPs table updated successfully');
      }
    } catch (error) {
      errors.database = `Database error: ${error.message}`;
      console.error(errors.database);
    }

    // 5. PREPARE RESPONSE
    const response = {
      success: Object.keys(errors).length === 0,
      practice_ods_code,
      data_sources_fetched: Object.keys(results),
      data: results,
      errors: Object.keys(errors).length > 0 ? errors : undefined,
      timestamp: new Date().toISOString()
    };

    console.log('NHS data fetch completed');
    console.log(`Success: ${response.success}`);
    console.log(`Data sources fetched: ${response.data_sources_fetched.join(', ')}`);
    if (response.errors) {
      console.log(`Errors encountered: ${Object.keys(response.errors).join(', ')}`);
    }

    return new Response(
      JSON.stringify(response),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        success: false
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 400
      }
    );
  }
});