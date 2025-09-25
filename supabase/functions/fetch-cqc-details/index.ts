import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { location_id, provider_id } = await req.json()

    if (!location_id) {
      throw new Error('location_id is required')
    }

    const CQC_API_KEY = Deno.env.get('CQC_API_KEY')
    if (!CQC_API_KEY) {
      throw new Error('CQC API key not configured')
    }

    const baseUrl = 'https://api.service.cqc.org.uk/public/v1'

    const locationDetails = await fetch(`${baseUrl}/locations/${location_id}`, {
      headers: {
        'Ocp-Apim-Subscription-Key': CQC_API_KEY,
        'Accept': 'application/json'
      }
    })

    if (!locationDetails.ok) {
      throw new Error(`Failed to fetch location details: ${locationDetails.status}`)
    }

    const locationData = await locationDetails.json()

    let providerData = null
    let providerAssessmentData = null

    if (provider_id) {
      // Fetch basic provider details
      const providerDetails = await fetch(`${baseUrl}/providers/${provider_id}`, {
        headers: {
          'Ocp-Apim-Subscription-Key': CQC_API_KEY,
          'Accept': 'application/json'
        }
      })

      if (providerDetails.ok) {
        providerData = await providerDetails.json()
      }

      // Fetch provider assessment data (ratings, reports, historic data)
      try {
        const assessmentUrl = `${baseUrl}/providers/${provider_id}/assessment?partnerCode=CheckLoops`
        console.log('Fetching provider assessment from:', assessmentUrl)

        const providerAssessment = await fetch(assessmentUrl, {
          headers: {
            'Ocp-Apim-Subscription-Key': CQC_API_KEY,
            'Accept': 'application/json'
          }
        })

        if (providerAssessment.ok) {
          providerAssessmentData = await providerAssessment.json()
          console.log('Provider assessment data fetched successfully')
        } else {
          console.log(`Provider assessment not available: ${providerAssessment.status}`)
        }
      } catch (assessmentError) {
        console.log('Error fetching provider assessment:', assessmentError)
      }
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // First, try with all columns (if they exist)
    // If this fails, we'll fall back to basic columns only
    const fullUpdateData = {
      // Store raw API responses
      location_source: locationData,
      provider_source: providerData,

      // Basic location information
      location_name: locationData.name || null,
      organisation_type: locationData.organisationType || null,
      location_type: locationData.type || null,
      also_known_as: locationData.alsoKnownAs || null,
      brand_id: locationData.brandId || null,
      brand_name: locationData.brandName || null,
      ods_code: locationData.odsCode || null,
      ods_ccg_code: locationData.odsCcgCode || null,
      ods_ccg_name: locationData.odsCcgName || null,
      website: locationData.website || null,

      // Address information
      address_line_1: locationData.postalAddressLine1 || null,
      address_line_2: locationData.postalAddressLine2 || null,
      town_city: locationData.postalAddressTownCity || null,
      county: locationData.postalAddressCounty || null,
      region: locationData.region || null,
      postcode: locationData.postalCode || null,

      // Geographic and administrative data
      latitude: locationData.onspdLatitude || null,
      longitude: locationData.onspdLongitude || null,
      uprn: locationData.uprn || null,
      constituency: locationData.constituency || null,
      local_authority: locationData.localAuthority || null,

      // NHS/CCG/ICB information
      onspd_ccg_code: locationData.onspdCcgCode || null,
      onspd_ccg_name: locationData.onspdCcgName || null,
      onspd_icb_code: locationData.onspdIcbCode || null,
      onspd_icb_name: locationData.onspdIcbName || null,

      // Registration and status
      registration_date: locationData.registrationDate || null,
      registration_status: locationData.registrationStatus || null,
      deregistration_date: locationData.deregistrationDate || null,
      dormancy: locationData.dormancy || null,

      // Service characteristics
      care_home: locationData.careHome || null,
      inspection_directorate: locationData.inspectionDirectorate || null,
      number_of_beds: locationData.numberOfBeds !== undefined ? locationData.numberOfBeds : null, // Capture 0 as valid value
      main_phone_number: locationData.mainPhoneNumber || null,

      // Inspection and rating dates
      last_inspection_date: locationData.lastInspection?.date || null,
      last_report_date: locationData.lastReport?.publicationDate || null,

      // Provider information (if available)
      provider_id: locationData.providerId || null,
      provider_name: providerData?.name || null,
      provider_type: providerData?.type || null,
      ownership_type: providerData?.ownershipType || null,
      companies_house_number: providerData?.companiesHouseNumber || null,
      provider_registration_date: providerData?.registrationDate || null,
      provider_registration_status: providerData?.registrationStatus || null,
      provider_brand_id: providerData?.brandId || null,
      provider_brand_name: providerData?.brandName || null,

      // Additional provider fields
      provider_location_ids: providerData?.locationIds || null,
      provider_address_line_1: providerData?.postalAddressLine1 || null,
      provider_address_line_2: providerData?.postalAddressLine2 || null,
      provider_town_city: providerData?.postalAddressTownCity || null,
      provider_county: providerData?.postalAddressCounty || null,
      provider_postcode: providerData?.postalCode || null,
      provider_region: providerData?.region || null,
      provider_uprn: providerData?.uprn || null,
      provider_latitude: providerData?.onspdLatitude || null,
      provider_longitude: providerData?.onspdLongitude || null,
      provider_constituency: providerData?.constituency || null,
      provider_local_authority: providerData?.localAuthority || null,
      provider_inspection_directorate: providerData?.inspectionDirectorate || null,
      provider_main_phone_number: providerData?.mainPhoneNumber || null,
      provider_website: providerData?.website || null,
      provider_onspd_icb_code: providerData?.onspdIcbCode || null,
      provider_onspd_icb_name: providerData?.onspdIcbName || null,
      provider_inspection_areas: providerData?.inspectionAreas || null,

      // Complex data as JSONB
      overall_rating: locationData.currentRatings?.overall?.rating || null,
      current_ratings: locationData.currentRatings || null,
      key_question_ratings: locationData.currentRatings?.overall?.keyQuestionRatings || null,
      ratings: locationData.currentRatings || null, // Keep for backward compatibility
      regulated_activities: locationData.regulatedActivities || null,
      relationships: locationData.relationships || null,
      location_types: locationData.locationTypes || null,
      gac_service_types: locationData.gacServiceTypes || null,
      specialisms: locationData.specialisms || null,
      inspection_categories: locationData.inspectionCategories || null,
      inspection_areas: locationData.inspectionAreas || null,
      reports: locationData.reports || null,
      contacts: locationData.contacts || null,

      // Provider assessment data (if available)
      provider_assessment_source: providerAssessmentData || null,
      provider_current_ratings: providerAssessmentData?.currentRatings || null,
      provider_historic_ratings: providerAssessmentData?.historicRatings || null,
      provider_reports: providerAssessmentData?.reports || null,
      provider_last_report_date: providerAssessmentData?.lastReport?.publicationDate || null,
      provider_overall_rating: providerAssessmentData?.currentRatings?.overall?.rating || null,
      provider_key_question_ratings: providerAssessmentData?.currentRatings?.overall?.keyQuestionRatings || null,

      // Detailed assessment data (from 2025 assessment)
      assessment_plan_id: providerAssessmentData?.assessment?.[0]?.ratings?.asgRatings?.[0]?.assessmentPlanId || null,
      assessment_plan_published_date: providerAssessmentData?.assessment?.[0]?.assessmentPlanPublishedDateTime || null,
      assessment_plan_status: providerAssessmentData?.assessment?.[0]?.ratings?.asgRatings?.[0]?.assessmentPlanStatus || null,
      assessment_title: providerAssessmentData?.assessment?.[0]?.ratings?.asgRatings?.[0]?.title || null,
      assessment_date: providerAssessmentData?.assessment?.[0]?.ratings?.asgRatings?.[0]?.assessmentDate || null,
      assessment_commentary: providerAssessmentData?.assessment?.[0]?.ratings?.asgRatings?.[0]?.commentary || null,
      assessment_commentary_date: providerAssessmentData?.assessment?.[0]?.ratings?.asgRatings?.[0]?.commentaryDate || null,
      assessment_narrative: providerAssessmentData?.assessment?.[0]?.ratings?.asgRatings?.[0]?.narrative || null,
      assessment_people_experience: providerAssessmentData?.assessment?.[0]?.ratings?.asgRatings?.[0]?.overallPeopleExperience || null,
      assessment_people_experience_date: providerAssessmentData?.assessment?.[0]?.ratings?.asgRatings?.[0]?.overallPeopleExperienceDate || null,
      assessment_service_groups: providerAssessmentData?.assessmentServiceGroup || null,
      assessment_ratings: providerAssessmentData?.assessment?.[0]?.ratings || null,
      assessment_key_questions: providerAssessmentData?.assessment?.[0]?.ratings?.asgRatings?.[0]?.keyQuestionRatings || null,

      // Extract topic areas and evidence categories from key questions
      assessment_topic_areas: providerAssessmentData?.assessment?.[0]?.ratings?.asgRatings?.[0]?.keyQuestionRatings?.map(kq => ({
        name: kq.name,
        percentageScore: kq.percentageScore,
        topicAreas: kq.topicareas
      })) || null,

      assessment_evidence_categories: providerAssessmentData?.assessment?.[0]?.ratings?.asgRatings?.[0]?.keyQuestionRatings?.reduce((acc, kq) => {
        if (kq.topicareas) {
          kq.topicareas.forEach(topic => {
            if (topic.evidenceCategory) {
              topic.evidenceCategory.forEach(ec => {
                acc.push({
                  keyQuestion: kq.name,
                  topicArea: topic.name,
                  evidenceCategoryId: ec.evidenceCategoryId,
                  commentary: ec.commentary,
                  commentaryDate: ec.commentaryDate
                })
              })
            }
          })
        }
        return acc
      }, []) || null,

      // MHA/MCA compliance (extract from commentary if structured data not available)
      mha_compliance_percentage: null, // Would need to parse from commentary
      mca_compliance_percentage: null, // Would need to parse from commentary
      mha_compliance_narrative: null,
      mca_compliance_narrative: null,

      // Performance and staffing data (would be in specific key question evidence)
      staffing_data: null, // Would need to extract from evidence categories
      performance_metrics: null, // Would need to extract from evidence categories
      consultant_cover_notes: null,
      governance_notes: null,
      action_plan_notes: null,

      assessment_fetched_at: providerAssessmentData ? new Date().toISOString() : null,

      // Timestamps
      updated_at: new Date().toISOString(),
      last_seen_at: new Date().toISOString()
    }

    // Basic update data with only columns we know exist
    const basicUpdateData = {
      location_source: locationData,
      provider_source: providerData,
      location_name: locationData.name || null,
      address_line_1: locationData.postalAddressLine1 || null,
      address_line_2: locationData.postalAddressLine2 || null,
      town_city: locationData.postalAddressTownCity || null,
      county: locationData.postalAddressCounty || null,
      region: locationData.region || null,
      postcode: locationData.postalCode || null,
      latitude: locationData.onspdLatitude || null,
      longitude: locationData.onspdLongitude || null,
      provider_id: locationData.providerId || null,
      overall_rating: locationData.currentRatings?.overall?.rating || null,
      last_inspection_date: locationData.lastInspection?.date || null,
      registration_date: locationData.registrationDate || null,
      registration_status: locationData.registrationStatus || null,
      deregistration_date: locationData.deregistrationDate || null,
      number_of_beds: locationData.numberOfBeds !== undefined ? locationData.numberOfBeds : null, // Fix to capture 0
      ratings: locationData.currentRatings || null,
      regulated_activities: locationData.regulatedActivities || null,
      contacts: locationData.contacts || null,
      inspection_areas: locationData.inspectionAreas || null,
      reports: locationData.reports || null,
      updated_at: new Date().toISOString(),
      last_seen_at: new Date().toISOString()
    }

    // Try updating with all columns first
    let updateError = null
    let updateType = 'full'

    const { error: fullUpdateError } = await supabase
      .from('CQC All GPs')
      .update(fullUpdateData)
      .eq('location_id', location_id)

    if (fullUpdateError && fullUpdateError.message?.includes('column')) {
      // If we get a column error, fall back to basic columns
      console.log('Full update failed, falling back to basic columns:', fullUpdateError)

      const { error: basicUpdateError } = await supabase
        .from('CQC All GPs')
        .update(basicUpdateData)
        .eq('location_id', location_id)

      updateError = basicUpdateError
      updateType = 'basic'

      if (!basicUpdateError) {
        console.log('Basic update succeeded. Some columns may be missing from the database.')
      }
    } else {
      updateError = fullUpdateError
    }

    if (updateError) {
      throw updateError
    }

    return new Response(
      JSON.stringify({
        success: true,
        updateType: updateType,
        message: updateType === 'basic'
          ? 'Data fetched successfully. Note: Only basic columns were updated. Run SQL migration for full data capture.'
          : 'All data fetched and stored successfully.',
        data: {
          location: locationData,
          provider: providerData,
          providerAssessment: providerAssessmentData
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({
        error: error.message,
        details: error.toString(),
        hint: 'If you see column does not exist errors, please run the SQL migration script in Supabase SQL editor'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})