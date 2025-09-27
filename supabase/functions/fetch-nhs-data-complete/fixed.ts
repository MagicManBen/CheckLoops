import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CQC_API_KEY = '5b91c30763b4466e89727c0c555e47a6';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { practice_ods_code, ods_code, location_id, ods_ccg_code, data_sources = ['ods'] } = await req.json();

    // Support both practice_ods_code and ods_code for flexibility
    const odsCodeToUse = practice_ods_code || ods_code;

    if (!odsCodeToUse && !location_id) {
      throw new Error('ods_code or location_id is required');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log(`Fetching data for: ${location_id || odsCodeToUse}, data_sources:`, data_sources);

    const results = {};
    const errors = {};
    const data_sources_fetched = [];
    let database_updated = false;
    let derivedOdsCode = odsCodeToUse;

    // 1. FETCH CQC DATA if location_id provided and cqc in data_sources
    if (location_id && data_sources.includes('cqc')) {
      try {
        const baseUrl = 'https://api.service.cqc.org.uk/public/v1';

        // Fetch location details
        const locationResponse = await fetch(`${baseUrl}/locations/${location_id}`, {
          headers: {
            'Ocp-Apim-Subscription-Key': CQC_API_KEY,
            'Accept': 'application/json'
          }
        });

        if (locationResponse.ok) {
          const locationData = await locationResponse.json();
          results.cqc_location = locationData;

          // Extract ODS code from CQC data if not provided
          if (!derivedOdsCode) {
            derivedOdsCode = locationData.odsCode || locationData.odsCcgCode || null;
          }

          // Fetch provider details if provider_id exists
          let providerData = null;
          if (locationData.providerId) {
            try {
              const providerResponse = await fetch(`${baseUrl}/providers/${locationData.providerId}`, {
                headers: {
                  'Ocp-Apim-Subscription-Key': CQC_API_KEY,
                  'Accept': 'application/json'
                }
              });
              if (providerResponse.ok) {
                providerData = await providerResponse.json();
                results.cqc_provider = providerData;

                // Try to extract ODS code from provider if still not found
                if (!derivedOdsCode && providerData) {
                  derivedOdsCode = providerData.odsCode || null;
                }
              }
            } catch (e) {
              console.log('Provider fetch error:', e.message || String(e));
            }
          }

          data_sources_fetched.push('cqc');
          console.log('CQC data fetched successfully, ods_code:', derivedOdsCode);
        } else {
          errors.cqc = `CQC API error: ${locationResponse.status}`;
        }
      } catch (error) {
        errors.cqc = `CQC fetch error: ${error.message || String(error)}`;
      }
    }

    // 2. FETCH ODS DATA
    const finalOdsCode = derivedOdsCode || odsCodeToUse;
    if (finalOdsCode && data_sources.includes('ods')) {
      try {
        // PRIMARY ENDPOINT - New NHS ODS API format
        const odsUrl = `https://api.nhs.uk/organisation-api/organisations/${finalOdsCode}`;
        console.log('Fetching ODS from primary endpoint:', odsUrl);

        const odsResponse = await fetch(odsUrl, {
          headers: { 
            'Accept': 'application/fhir+json',
            'Subscription-Key': '8f9a6c9a728348d2a02c803204a74b5a' // NHS Digital API key
          }
        });

        if (odsResponse.ok) {
          const odsData = await odsResponse.json();
          
          // Process and structure the ODS data for consistent access
          results.ods_data = {
            organisation: odsData.Organisation || odsData || {},
            name: odsData.Organisation?.Name || odsData.name || null,
            status: odsData.Organisation?.Status || odsData.status || null,
            lastChangeDate: odsData.Organisation?.LastChangeDate || odsData.lastUpdated || null,
            addresses: odsData.Organisation?.GeoLoc?.Location || odsData.address || [],
            roles: odsData.Organisation?.Roles?.Role || odsData.roles || [],
            relationships: odsData.Organisation?.Rels?.Rel || odsData.relationships || [],
            contacts: odsData.Organisation?.Contacts?.Contact || odsData.telecom || [],
            raw_response: odsData
          };
          
          data_sources_fetched.push('ods');
          console.log('ODS data fetched successfully from primary endpoint');
        } else {
          console.log(`Primary ODS API error: ${odsResponse.status}. Trying fallback...`);
          
          // FALLBACK - Try alternative ODS API endpoint
          try {
            // Try the new directory API endpoint first
            const directoryApiUrl = `https://directory-api.nhs.uk/ord/2-0-0/organisations/${finalOdsCode}`;
            console.log('Fetching ODS from directory-api endpoint:', directoryApiUrl);
            
            const directoryApiResponse = await fetch(directoryApiUrl, {
              headers: { 'Accept': 'application/fhir+json' }
            });
            
            if (directoryApiResponse.ok) {
              const directoryApiData = await directoryApiResponse.json();
              
              results.ods_data = {
                organisation: directoryApiData.Organisation || {},
                name: directoryApiData.Organisation?.Name || null,
                status: directoryApiData.Organisation?.Status || null,
                lastChangeDate: directoryApiData.Organisation?.LastChangeDate || null,
                addresses: directoryApiData.Organisation?.GeoLoc?.Location || [],
                roles: directoryApiData.Organisation?.Roles?.Role || [],
                relationships: directoryApiData.Organisation?.Rels?.Rel || [],
                contacts: directoryApiData.Organisation?.Contacts?.Contact || [],
                raw_response: directoryApiData
              };
              
              data_sources_fetched.push('ods');
              console.log('ODS data fetched successfully from directory-api endpoint');
            } else {
              // Fall back to older spine services endpoint
              console.log(`Directory API error: ${directoryApiResponse.status}. Trying original fallback...`);
              const fallbackUrl = `https://directory.spineservices.nhs.uk/ORD/2-0-0/organisations/${finalOdsCode}`;
              console.log('Fetching ODS from original fallback endpoint:', fallbackUrl);
              
              const fallbackResponse = await fetch(fallbackUrl, {
                headers: { 'Accept': 'application/fhir+json' }
              });
              
              if (fallbackResponse.ok) {
                const fallbackData = await fallbackResponse.json();
                
                results.ods_data = {
                  organisation: fallbackData.Organisation || {},
                  name: fallbackData.Organisation?.Name || null,
                  status: fallbackData.Organisation?.Status || null,
                  lastChangeDate: fallbackData.Organisation?.LastChangeDate || null,
                  addresses: fallbackData.Organisation?.GeoLoc?.Location || [],
                  roles: fallbackData.Organisation?.Roles?.Role || [],
                  relationships: fallbackData.Organisation?.Rels?.Rel || [],
                  contacts: fallbackData.Organisation?.Contacts?.Contact || [],
                  raw_response: fallbackData
                };
                
                data_sources_fetched.push('ods');
                console.log('ODS data fetched successfully from original fallback endpoint');
              } else {
                // Create minimal data as last resort
                console.log(`All API endpoints failed. Creating minimal data.`);
                results.ods_data = {
                  organisation: { OrgId: { extension: finalOdsCode } },
                  name: null,
                  status: "active",
                  raw_response: { 
                    resourceType: "Organization",
                    id: finalOdsCode,
                    identifier: [{ system: "https://fhir.nhs.uk/Id/ods-organization-code", value: finalOdsCode }],
                    active: true
                  },
                  fallback: true,
                  fallback_reason: `All API endpoints failed`,
                  ods_code: finalOdsCode
                };
                
                data_sources_fetched.push('ods');
                console.log('Created minimal ODS data with code only as all endpoints failed');
                
                errors.ods = `ODS API errors: All endpoints failed. Using minimal data.`;
              }
            }
          } catch (fallbackError) {
            errors.ods = `ODS fetch errors: ${fallbackError.message || String(fallbackError)}`;
          }
        }
      } catch (error) {
        errors.ods = `ODS fetch error: ${error.message || String(error)}`;
      }
    }

    // 3. FETCH OPENPRESCRIBING DATA (if requested)
    if (finalOdsCode && data_sources.includes('prescribing')) {
      try {
        const today = new Date();
        const threeMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 3, 1);
        const year = threeMonthsAgo.getFullYear();
        const month = String(threeMonthsAgo.getMonth() + 1).padStart(2, '0');
        const dateParam = `${year}-${month}-01`;

        const prescribingUrl = `https://openprescribing.net/api/1.0/spending_by_practice/?format=json&code=${finalOdsCode}&date=${dateParam}`;
        const prescribingResponse = await fetch(prescribingUrl);

        if (prescribingResponse.ok) {
          const prescribingData = await prescribingResponse.json();
          const statsUrl = `https://openprescribing.net/api/1.0/org_details/?format=json&org_type=practice&org=${finalOdsCode}`;
          const statsResponse = await fetch(statsUrl);
          const statsData = statsResponse.ok ? await statsResponse.json() : null;

          results.prescribing_data = {
            spending: prescribingData,
            practice_details: statsData,
            data_month: dateParam,
            top_medications: prescribingData.slice(0, 10).map((item) => ({
              name: item.name,
              quantity: item.quantity,
              items: item.items,
              actual_cost: item.actual_cost
            }))
          };
          data_sources_fetched.push('prescribing');
          console.log('OpenPrescribing data fetched successfully');
        } else {
          errors.prescribing = `OpenPrescribing API error: ${prescribingResponse.status}`;
        }
      } catch (error) {
        errors.prescribing = `Prescribing fetch error: ${error.message || String(error)}`;
      }
    }

    // 4. UPDATE DATABASE - CQC All GPs table
    if (location_id && (data_sources_fetched.includes('cqc') || data_sources_fetched.includes('ods'))) {
      try {
        const updateData = {
          updated_at: new Date().toISOString()
        };

        // Handle CQC data update
        if (data_sources_fetched.includes('cqc') && results.cqc_location) {
          const locationData = results.cqc_location;
          const providerData = results.cqc_provider;

          // Store raw API responses - ensure these are always stored fully as JSONB
          updateData.location_source = locationData;
          updateData.provider_source = providerData;

          // Flatten CQC fields
          updateData.location_name = locationData.name || null;
          updateData.provider_id = locationData.providerId || null;
          updateData.organisation_type = locationData.organisationType || null;
          updateData.location_type = locationData.type || null;
          updateData.region = locationData.region || null;

          // Address fields
          updateData.address_line_1 = locationData.postalAddressLine1 || null;
          updateData.address_line_2 = locationData.postalAddressLine2 || null;
          updateData.town_city = locationData.postalAddressTownCity || null;
          updateData.county = locationData.postalAddressCounty || null;
          updateData.postcode = locationData.postalCode || null;
          updateData.uprn = locationData.uprn || null;

          // Geographic data
          updateData.latitude = locationData.onspdLatitude ? String(locationData.onspdLatitude) : null;
          updateData.longitude = locationData.onspdLongitude ? String(locationData.onspdLongitude) : null;

          // Contact info
          updateData.main_phone_number = locationData.mainPhoneNumber || null;
          updateData.website = locationData.website || null;
          updateData.number_of_beds = locationData.numberOfBeds !== undefined ? locationData.numberOfBeds : null;

          // Administrative data
          updateData.constituency = locationData.constituency || null;
          updateData.local_authority = locationData.localAuthority || null;
          updateData.inspection_directorate = locationData.inspectionDirectorate || null;

          // NHS/CCG/ICB information from CQC
          updateData.onspd_ccg_code = locationData.onspdCcgCode || null;
          updateData.onspd_ccg_name = locationData.onspdCcgName || null;
          updateData.ods_ccg_code = locationData.odsCcgCode || null;
          updateData.ods_ccg_name = locationData.odsCcgName || null;
          updateData.onspd_icb_code = locationData.onspdIcbCode || null;
          updateData.onspd_icb_name = locationData.onspdIcbName || null;

          // Registration and status
          updateData.registration_date = locationData.registrationDate || null;
          updateData.registration_status = locationData.registrationStatus || null;
          updateData.deregistration_date = locationData.deregistrationDate || null;
          updateData.dormancy = locationData.dormancy || null;
          updateData.care_home = locationData.careHome || null;

          // Ratings and inspection
          updateData.overall_rating = locationData.currentRatings?.overall?.rating || null;
          updateData.current_ratings = locationData.currentRatings || null;
          updateData.key_question_ratings = locationData.currentRatings?.overall?.keyQuestionRatings || null;
          updateData.last_inspection_date = locationData.lastInspection?.date || null;
          updateData.last_report_date = locationData.lastReport?.publicationDate || null;

          // Complex data as JSONB
          updateData.regulated_activities = locationData.regulatedActivities || null;
          updateData.relationships = locationData.relationships || null;
          updateData.location_types = locationData.locationTypes || null;
          updateData.gac_service_types = locationData.gacServiceTypes || null;
          updateData.specialisms = locationData.specialisms || null;
          updateData.inspection_categories = locationData.inspectionCategories || null;
          updateData.inspection_areas = locationData.inspectionAreas || null;
          updateData.reports = locationData.reports || null;
          updateData.contacts = locationData.contacts || null;

          // Extract and set ODS code
          const extractedOdsCode = locationData.odsCode ||
                                  providerData?.odsCode ||
                                  locationData.odsCcgCode ||
                                  null;
          if (extractedOdsCode) {
            updateData.ods_code = extractedOdsCode;
            derivedOdsCode = extractedOdsCode;
          }

          // Provider fields if available
          if (providerData) {
            updateData.provider_name = providerData.name || null;
            updateData.provider_type = providerData.type || null;
            updateData.ownership_type = providerData.ownershipType || null;
            updateData.companies_house_number = providerData.companiesHouseNumber || null;
            updateData.provider_registration_date = providerData.registrationDate || null;
            updateData.provider_registration_status = providerData.registrationStatus || null;
            updateData.provider_brand_id = providerData.brandId || null;
            updateData.provider_brand_name = providerData.brandName || null;
            updateData.provider_location_ids = providerData.locationIds || null;
            updateData.provider_address_line_1 = providerData.postalAddressLine1 || null;
            updateData.provider_address_line_2 = providerData.postalAddressLine2 || null;
            updateData.provider_town_city = providerData.postalAddressTownCity || null;
            updateData.provider_county = providerData.postalAddressCounty || null;
            updateData.provider_postcode = providerData.postalCode || null;
            updateData.provider_region = providerData.region || null;
            updateData.provider_uprn = providerData.uprn || null;
            updateData.provider_latitude = providerData.onspdLatitude ? String(providerData.onspdLatitude) : null;
            updateData.provider_longitude = providerData.onspdLongitude ? String(providerData.onspdLongitude) : null;
            updateData.provider_constituency = providerData.constituency || null;
            updateData.provider_local_authority = providerData.localAuthority || null;
            updateData.provider_inspection_directorate = providerData.inspectionDirectorate || null;
            updateData.provider_main_phone_number = providerData.mainPhoneNumber || null;
            updateData.provider_website = providerData.website || null;
            updateData.provider_onspd_icb_code = providerData.onspdIcbCode || null;
            updateData.provider_onspd_icb_name = providerData.onspdIcbName || null;
            updateData.provider_inspection_areas = providerData.inspectionAreas || null;
          }
        }

        // Handle ODS data update
        if (data_sources_fetched.includes('ods') && results.ods_data) {
          const odsData = results.ods_data;

          // Save full ODS JSON
          updateData.nhs_ods_data = odsData;
          updateData.last_nhs_update = new Date().toISOString();
          updateData.nhs_last_updated = new Date().toISOString();

          // Set ODS code if not already set
          if (!updateData.ods_code && finalOdsCode) {
            updateData.ods_code = finalOdsCode;
          }

          // Extract and flatten ODS fields (only if not already set by CQC)
          const org = odsData.organisation;

          // Extract phone from contacts - handle both old and new API formats
          if (!updateData.main_phone_number && odsData.contacts?.length > 0) {
            const phoneContact = odsData.contacts.find((c) =>
              c.type?.toLowerCase() === 'tel' || 
              c.system?.toLowerCase() === 'phone' ||
              c.value?.startsWith('0') || 
              c.value?.startsWith('+44'));
              
            if (phoneContact) {
              updateData.main_phone_number = phoneContact.value || phoneContact.valueString || phoneContact.valueUrl;
            }
          }

          // Extract website from contacts - handle both old and new API formats
          if (!updateData.website && odsData.contacts?.length > 0) {
            const webContact = odsData.contacts.find((c) =>
              c.type?.toLowerCase() === 'url' || 
              c.system?.toLowerCase() === 'url' ||
              (c.value && (c.value.startsWith('http') || c.value.includes('www.'))) ||
              (c.valueUrl && c.valueUrl.startsWith('http')));
              
            if (webContact) {
              updateData.website = webContact.value || webContact.valueUrl;
            }
          }

          // Extract address from addresses/GeoLoc - handle both old and new API formats
          if (odsData.addresses?.length > 0) {
            const primaryAddr = odsData.addresses[0];
            
            // Handle traditional ORD format
            if (primaryAddr.AddrLn1 && !updateData.address_line_1) {
              updateData.address_line_1 = primaryAddr.AddrLn1;
            }
            if (primaryAddr.AddrLn2 && !updateData.address_line_2) {
              updateData.address_line_2 = primaryAddr.AddrLn2;
            }
            if (primaryAddr.Town && !updateData.town_city) {
              updateData.town_city = primaryAddr.Town;
            }
            if (primaryAddr.County && !updateData.county) {
              updateData.county = primaryAddr.County;
            }
            if (primaryAddr.PostCode && !updateData.postcode) {
              updateData.postcode = primaryAddr.PostCode;
            }
            
            // Handle FHIR format address
            if (primaryAddr.line && Array.isArray(primaryAddr.line) && !updateData.address_line_1) {
              updateData.address_line_1 = primaryAddr.line[0] || null;
              if (primaryAddr.line.length > 1 && !updateData.address_line_2) {
                updateData.address_line_2 = primaryAddr.line[1];
              }
            }
            if (primaryAddr.city && !updateData.town_city) {
              updateData.town_city = primaryAddr.city;
            }
            if (primaryAddr.district && !updateData.county) {
              updateData.county = primaryAddr.district;
            }
            if (primaryAddr.postalCode && !updateData.postcode) {
              updateData.postcode = primaryAddr.postalCode;
            }
            
            // Additional geographic data from NHS
            if (primaryAddr.Latitude && !updateData.latitude) {
              updateData.latitude = String(primaryAddr.Latitude);
            } else if (primaryAddr.position?.latitude && !updateData.latitude) {
              updateData.latitude = String(primaryAddr.position.latitude);
            }
            
            if (primaryAddr.Longitude && !updateData.longitude) {
              updateData.longitude = String(primaryAddr.Longitude);
            } else if (primaryAddr.position?.longitude && !updateData.longitude) {
              updateData.longitude = String(primaryAddr.position.longitude);
            }
          } 
          // Try to extract address from raw response if addresses array not found
          else if (odsData.raw_response?.address) {
            const rawAddr = Array.isArray(odsData.raw_response.address) 
                            ? odsData.raw_response.address[0] 
                            : odsData.raw_response.address;
                            
            if (rawAddr) {
              if (rawAddr.line && Array.isArray(rawAddr.line) && !updateData.address_line_1) {
                updateData.address_line_1 = rawAddr.line[0] || null;
                if (rawAddr.line.length > 1 && !updateData.address_line_2) {
                  updateData.address_line_2 = rawAddr.line[1];
                }
              }
              if (rawAddr.city && !updateData.town_city) {
                updateData.town_city = rawAddr.city;
              }
              if (rawAddr.district && !updateData.county) {
                updateData.county = rawAddr.district;
              }
              if (rawAddr.postalCode && !updateData.postcode) {
                updateData.postcode = rawAddr.postalCode;
              }
            }
          }

          // Set name if not already set
          if (!updateData.location_name && odsData.name) {
            updateData.location_name = odsData.name;
          }

          // Set region if not already set
          if (!updateData.region && org?.GeoLoc?.Region) {
            updateData.region = org.GeoLoc.Region;
          }
        }

        // Handle prescribing data update
        if (data_sources_fetched.includes('prescribing') && results.prescribing_data) {
          updateData.nhs_prescribing_data = results.prescribing_data;
        }

        // Perform the update
        console.log('Updating CQC All GPs with:', Object.keys(updateData).length, 'fields');

        const { error: updateError } = await supabaseClient
          .from('CQC All GPs')
          .update(updateData)
          .eq('location_id', location_id);

        if (updateError) {
          console.error('Database update error:', updateError);
          errors.database = `Database update failed: ${updateError.message}`;
        } else {
          database_updated = true;
          console.log('Successfully updated CQC All GPs table');
        }
      } catch (e) {
        console.error('Database operation error:', e);
        errors.database = `Database error: ${e.message || String(e)}`;
      }
    }

    return new Response(
      JSON.stringify({
        status: Object.keys(errors).length === 0 ? 'success' : 'partial',
        location_id,
        ods_code: derivedOdsCode,
        data_sources_fetched,
        data: results,
        errors: Object.keys(errors).length > 0 ? errors : null,
        database_updated,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: error.message || String(error), success: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});