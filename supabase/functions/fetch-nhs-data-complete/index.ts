import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { practice_ods_code, location_id, data_sources = ['ods', 'prescribing'] } = await req.json();

    if (!practice_ods_code && !location_id) {
      throw new Error('practice_ods_code or location_id is required');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log(`Fetching NHS data for: ${practice_ods_code || location_id}`);

    const results: Record<string, any> = {};
    const errors: Record<string, string> = {};

    // 1. FETCH CQC DATA if location_id provided
    if (location_id && data_sources.includes('cqc')) {
      try {
        const CQC_API_KEY = '5b91c30763b4466e89727c0c555e47a6';
        const baseUrl = 'https://api.service.cqc.org.uk/public/v1';

        const response = await fetch(`${baseUrl}/locations/${location_id}`, {
          headers: {
            'Ocp-Apim-Subscription-Key': CQC_API_KEY,
            'Accept': 'application/json'
          }
        });

        if (response.ok) {
          results.cqc_data = await response.json();
          console.log('CQC data fetched successfully');
        } else {
          errors.cqc = `CQC API error: ${response.status}`;
        }
      } catch (error) {
        errors.cqc = `CQC fetch error: ${error.message}`;
      }
    }

    // 2. FETCH ODS DATA
    if (practice_ods_code && data_sources.includes('ods')) {
      try {
        const odsUrl = `https://directory.spineservices.nhs.uk/ORD/2-0-0/organisations/${practice_ods_code}`;
        const odsResponse = await fetch(odsUrl, {
          headers: { 'Accept': 'application/fhir+json' }
        });

        if (odsResponse.ok) {
          const odsData = await odsResponse.json();
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
        }
      } catch (error) {
        errors.ods = `ODS fetch error: ${error.message}`;
      }
    }

    // 3. FETCH OPENPRESCRIBING DATA
    if (practice_ods_code && data_sources.includes('prescribing')) {
      try {
        const today = new Date();
        const threeMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 3, 1);
        const year = threeMonthsAgo.getFullYear();
        const month = String(threeMonthsAgo.getMonth() + 1).padStart(2, '0');
        const dateParam = `${year}-${month}-01`;

        const prescribingUrl = `https://openprescribing.net/api/1.0/spending_by_practice/?format=json&code=${practice_ods_code}&date=${dateParam}`;
        const prescribingResponse = await fetch(prescribingUrl);

        if (prescribingResponse.ok) {
          const prescribingData = await prescribingResponse.json();
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
        }
      } catch (error) {
        errors.prescribing = `Prescribing fetch error: ${error.message}`;
      }
    }

    // 4. UPDATE DATABASE - Try both tables
    let dbUpdateSuccess = false;

    // Try NHS_All_GPs table first
    if (practice_ods_code) {
      try {
        const updateData = {
          practice_ods_code,
          last_updated: new Date().toISOString(),
          ods_data: results.ods_data || null,
          prescribing_data: results.prescribing_data || null,
          data_completeness: {
            ods_data: !!results.ods_data,
            prescribing_data: !!results.prescribing_data
          }
        };

        await supabaseClient
          .from('NHS_All_GPs')
          .upsert(updateData, { onConflict: 'practice_ods_code' });

        dbUpdateSuccess = true;
        console.log('Updated NHS_All_GPs table');
      } catch (e) {
        console.log('NHS_All_GPs update failed, trying CQC table');
      }
    }

    // Try CQC All GPs table as fallback
    if (!dbUpdateSuccess && (practice_ods_code || location_id)) {
      try {
        const { data: existingPractice } = await supabaseClient
          .from('CQC All GPs')
          .select('*')
          .or(`ods_code.eq.${practice_ods_code},location_id.eq.${location_id}`)
          .single();

        if (existingPractice) {
          const updateData = {
            nhs_last_updated: new Date().toISOString(),
            nhs_ods_data: results.ods_data || existingPractice.nhs_ods_data,
            nhs_prescribing_data: results.prescribing_data || existingPractice.nhs_prescribing_data,
            nhs_data_completeness: {
              ods_data: !!results.ods_data,
              prescribing_data: !!results.prescribing_data
            },
            nhs_data_quality_score: (Object.keys(results).length / 3) * 100
          };

          await supabaseClient
            .from('CQC All GPs')
            .update(updateData)
            .or(`ods_code.eq.${practice_ods_code},location_id.eq.${location_id}`);

          dbUpdateSuccess = true;
          console.log('Updated CQC All GPs table');
        }
      } catch (e) {
        errors.database = `Database update failed: ${e.message}`;
      }
    }

    return new Response(
      JSON.stringify({
        success: Object.keys(errors).length === 0,
        practice_ods_code,
        location_id,
        data_sources_fetched: Object.keys(results),
        data: results,
        errors: Object.keys(errors).length > 0 ? errors : undefined,
        database_updated: dbUpdateSuccess,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: error.message, success: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});