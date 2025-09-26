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

    // 3. UPDATE CQC All GPs TABLE WITH NHS DATA
    // Using the existing CQC table with spaces in the name
    try {
      console.log('Updating CQC All GPs table with NHS data...');

      // First check if practice exists in CQC table
      const { data: existingPractice, error: checkError } = await supabaseClient
        .from('CQC All GPs')  // Table name with correct spacing
        .select('id, ods_code')
        .or(`ods_code.eq.${practice_ods_code},practice_ods_code.eq.${practice_ods_code}`)
        .single();

      if (existingPractice && !checkError) {
        // Update existing record with NHS data
        const updateData: any = {
          nhs_last_updated: new Date().toISOString()
        };

        // Add fetched NHS data to update object
        if (results.ods_data) updateData.nhs_ods_data = results.ods_data;
        if (results.prescribing_data) updateData.nhs_prescribing_data = results.prescribing_data;

        // Calculate NHS data completeness
        const nhsCompleteness = {
          ods_data: !!results.ods_data,
          prescribing_data: !!results.prescribing_data,
          qof_data: false,  // Will be added via CSV
          patient_survey_data: false,  // Will be added via CSV
          workforce_data: false,  // Will be added via CSV
          appointments_data: false,  // Will be added via CSV
          referrals_data: false  // Will be added via CSV
        };

        const scorePercentage = (Object.values(nhsCompleteness).filter(v => v).length / 7) * 100;
        updateData.nhs_data_completeness = nhsCompleteness;
        updateData.nhs_data_quality_score = scorePercentage;

        const { data, error } = await supabaseClient
          .from('CQC All GPs')
          .update(updateData)
          .eq('id', existingPractice.id)
          .select()
          .single();

        if (error) {
          console.error('Database update error:', error);
          errors.database = `Failed to update CQC table: ${error.message}`;
        } else {
          console.log('CQC All GPs table updated successfully with NHS data');
        }
      } else {
        // Practice not found in CQC table, store in separate NHS table if it exists
        console.log('Practice not found in CQC All GPs table');
        errors.database = 'Practice not found in CQC database';
      }
    } catch (error) {
      errors.database = `Database error: ${error.message}`;
      console.error(errors.database);
    }

    // 4. PREPARE RESPONSE
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