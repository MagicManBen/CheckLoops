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
    // Get parameters from request
    const { practice_ods_code, ods_code, location_id, data_sources = ['ods'] } = await req.json();
    
    // Support both practice_ods_code and ods_code for flexibility
    const odsCodeToUse = practice_ods_code || ods_code;
    
    if (!odsCodeToUse && !location_id) {
      throw new Error('ods_code or location_id is required');
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // This function specifically focuses on fixing the NHS ODS API integration
    if (odsCodeToUse && data_sources.includes('ods')) {
      console.log(`Testing NHS ODS API for code: ${odsCodeToUse}`);

      // Try multiple NHS API endpoints in sequence until one works
      try {
        // PRIMARY ENDPOINT - New NHS API format
        const odsUrl = `https://api.nhs.uk/organisation-api/organisations/${odsCodeToUse}`;
        console.log('Fetching from primary endpoint:', odsUrl);

        const odsResponse = await fetch(odsUrl, {
          headers: { 
            'Accept': 'application/fhir+json',
            'Subscription-Key': '8f9a6c9a728348d2a02c803204a74b5a' 
          }
        });

        if (odsResponse.ok) {
          const odsData = await odsResponse.json();
          console.log('Primary NHS API endpoint successful');
          
          // Return success with primary endpoint data
          return new Response(
            JSON.stringify({
              success: true,
              message: "NHS API fix working successfully with primary endpoint",
              ods_code: odsCodeToUse,
              endpoint: "primary",
              data: odsData,
              timestamp: new Date().toISOString()
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else {
          console.log(`Primary endpoint failed with status ${odsResponse.status}, trying directory-api endpoint`);
          
          // Try the new directory API endpoint
          const directoryApiUrl = `https://directory-api.nhs.uk/ord/2-0-0/organisations/${odsCodeToUse}`;
          console.log('Fetching from directory-api endpoint:', directoryApiUrl);
          
          const directoryApiResponse = await fetch(directoryApiUrl, {
            headers: { 'Accept': 'application/fhir+json' }
          });
          
          if (directoryApiResponse.ok) {
            const directoryApiData = await directoryApiResponse.json();
            console.log('Directory API endpoint successful');
            
            // Return success with directory-api endpoint data
            return new Response(
              JSON.stringify({
                success: true,
                message: "NHS API fix working successfully with directory-api endpoint",
                ods_code: odsCodeToUse,
                endpoint: "directory-api",
                data: directoryApiData,
                timestamp: new Date().toISOString()
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          } else {
            console.log(`Directory-api endpoint failed with status ${directoryApiResponse.status}, trying fallback endpoint`);
            
            // Try the original fallback endpoint as last resort
            const fallbackUrl = `https://directory.spineservices.nhs.uk/ORD/2-0-0/organisations/${odsCodeToUse}`;
            console.log('Fetching from fallback endpoint:', fallbackUrl);
            
            const fallbackResponse = await fetch(fallbackUrl, {
              headers: { 'Accept': 'application/fhir+json' }
            });
            
            if (fallbackResponse.ok) {
              const fallbackData = await fallbackResponse.json();
              console.log('Fallback endpoint successful');
              
              // Return success with fallback endpoint data
              return new Response(
                JSON.stringify({
                  success: true,
                  message: "NHS API fix working successfully with fallback endpoint",
                  ods_code: odsCodeToUse,
                  endpoint: "fallback",
                  data: fallbackData,
                  timestamp: new Date().toISOString()
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              );
            } else {
              // All endpoints failed
              return new Response(
                JSON.stringify({
                  success: false,
                  message: "NHS API fix deployed but all endpoints failed",
                  ods_code: odsCodeToUse,
                  error: "All NHS API endpoints failed",
                  status_codes: {
                    primary: odsResponse.status,
                    directory_api: directoryApiResponse.status,
                    fallback: fallbackResponse.status
                  },
                  timestamp: new Date().toISOString()
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              );
            }
          }
        }
      } catch (error) {
        console.error('NHS API fetch error:', error);
        
        return new Response(
          JSON.stringify({
            success: false,
            message: "NHS API fix deployed but encountered an error",
            ods_code: odsCodeToUse,
            error: String(error),
            timestamp: new Date().toISOString()
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
    }
    
    // If we get here, we didn't have an ODS code to test with
    return new Response(
      JSON.stringify({
        success: true,
        message: "NHS API fix deployed successfully",
        note: "No ODS code provided for testing",
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: String(error),
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});