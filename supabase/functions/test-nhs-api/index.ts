import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get parameters from request
    const { ods_code } = await req.json();
    
    if (!ods_code) {
      throw new Error('ods_code is required');
    }

    // Try the new NHS API endpoint first
    console.log(`Testing NHS API for ODS code: ${ods_code}`);
    const results = {};
    
    try {
      // PRIMARY ENDPOINT - New NHS ODS API format
      const odsUrl = `https://api.nhs.uk/organisation-api/organisations/${ods_code}`;
      console.log('Fetching from primary endpoint:', odsUrl);

      const odsResponse = await fetch(odsUrl, {
        headers: { 
          'Accept': 'application/fhir+json',
          'Subscription-Key': '8f9a6c9a728348d2a02c803204a74b5a' // NHS Digital API key
        }
      });

      if (odsResponse.ok) {
        const odsData = await odsResponse.json();
        results.primary_endpoint = {
          success: true,
          status: odsResponse.status,
          data: odsData
        };
      } else {
        results.primary_endpoint = {
          success: false,
          status: odsResponse.status,
          error: await odsResponse.text()
        };
      }
    } catch (error) {
      results.primary_endpoint = {
        success: false,
        error: String(error)
      };
    }

    // Try the fallback endpoint
    try {
      const fallbackUrl = `https://directory.spineservices.nhs.uk/ORD/2-0-0/organisations/${ods_code}`;
      console.log('Fetching from fallback endpoint:', fallbackUrl);
      
      const fallbackResponse = await fetch(fallbackUrl, {
        headers: { 'Accept': 'application/fhir+json' }
      });
      
      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();
        results.fallback_endpoint = {
          success: true,
          status: fallbackResponse.status,
          data: fallbackData
        };
      } else {
        results.fallback_endpoint = {
          success: false,
          status: fallbackResponse.status,
          error: await fallbackResponse.text()
        };
      }
    } catch (error) {
      results.fallback_endpoint = {
        success: false,
        error: String(error)
      };
    }

    // Try a new directory API endpoint
    try {
      const directoryApiUrl = `https://directory-api.nhs.uk/ord/2-0-0/organisations/${ods_code}`;
      console.log('Fetching from directory-api endpoint:', directoryApiUrl);
      
      const directoryApiResponse = await fetch(directoryApiUrl, {
        headers: { 'Accept': 'application/fhir+json' }
      });
      
      if (directoryApiResponse.ok) {
        const directoryApiData = await directoryApiResponse.json();
        results.directory_api_endpoint = {
          success: true,
          status: directoryApiResponse.status,
          data: directoryApiData
        };
      } else {
        results.directory_api_endpoint = {
          success: false,
          status: directoryApiResponse.status,
          error: await directoryApiResponse.text()
        };
      }
    } catch (error) {
      results.directory_api_endpoint = {
        success: false,
        error: String(error)
      };
    }

    return new Response(
      JSON.stringify({
        success: true,
        ods_code,
        results,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: String(error), success: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
