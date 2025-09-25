import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const withDetails = url.searchParams.get('details') === 'true'
    const maxDetails = parseInt(url.searchParams.get('limit') || '100')
    const startFrom = parseInt(url.searchParams.get('start') || '0')

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const cqcApiKey = '5b91c30763b4466e89727c0c555e47a6'

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    let allProviders: any[] = []
    let page = 1
    let hasMore = true
    const perPage = 100

    console.log('Starting to fetch GP practices from CQC API...')

    // First, get all provider basic info
    while (hasMore) {
      const cqcUrl = `https://api.service.cqc.org.uk/public/v1/providers?primaryInspectionCategoryName=GP%20Practices&perPage=${perPage}&page=${page}`

      const response = await fetch(cqcUrl, {
        headers: {
          'Accept': 'application/json',
          'Ocp-Apim-Subscription-Key': cqcApiKey,
          'User-Agent': 'CheckLoops/1.0'
        }
      })

      if (!response.ok) {
        throw new Error(`CQC API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      if (data.providers && data.providers.length > 0) {
        allProviders = allProviders.concat(data.providers)
        console.log(`Fetched page ${page}/${data.totalPages} - Total providers so far: ${allProviders.length}`)
      }

      hasMore = data.nextPageUri !== null
      page++

      if (page > 100) {
        console.log('Limiting to first 100 pages for safety')
        break
      }
    }

    console.log(`Total GP practices found: ${allProviders.length}`)

    // Map basic provider data
    const providersToInsert = allProviders.map(provider => ({
      provider_id: provider.providerId,
      provider_name: provider.providerName || 'Unknown',
      // Initialize other fields as null - they'll be populated later
      organisation_type: null,
      ownership_type: null,
      type: null,
      registration_status: null,
      registration_date: null,
      deregistration_date: null,
      website: null,
      main_phone_number: null,
      postal_address_line1: null,
      postal_address_line2: null,
      postal_address_town_city: null,
      postal_address_county: null,
      postal_code: null,
      region: null,
      uprn: null,
      onspd_latitude: null,
      onspd_longitude: null,
      onspd_icb_code: null,
      onspd_icb_name: null,
      constituency: null,
      local_authority: null,
      inspection_directorate: null,
      last_inspection_date: null,
      inspection_categories: [],
      primary_inspection_category_code: null,
      primary_inspection_category_name: 'GP Practices',
      current_ratings: {},
      overall_rating: null,
      location_ids: [],
      contacts: [],
      relationships: [],
      regulated_activities: [],
      inspection_areas: []
    }))

    // Insert basic data in batches
    const batchSize = 100
    let insertedCount = 0
    let errors = []

    for (let i = 0; i < providersToInsert.length; i += batchSize) {
      const batch = providersToInsert.slice(i, i + batchSize)

      const { data, error } = await supabase
        .from('CQC_List')
        .upsert(batch, {
          onConflict: 'provider_id',
          ignoreDuplicates: false
        })
        .select()

      if (error) {
        console.error(`Error inserting batch starting at ${i}:`, error)
        errors.push({ batch: i, error: error.message })
      } else {
        insertedCount += data?.length || 0
        console.log(`Inserted/updated ${insertedCount}/${providersToInsert.length} practices`)
      }
    }

    let detailsFetched = 0

    // Optionally fetch detailed information for a subset
    if (withDetails) {
      const providersToDetail = allProviders.slice(startFrom, startFrom + maxDetails)

      console.log(`Fetching details for ${providersToDetail.length} providers (from ${startFrom} to ${startFrom + providersToDetail.length})`)

      for (const provider of providersToDetail) {
        try {
          const detailUrl = `https://api.service.cqc.org.uk/public/v1/providers/${provider.providerId}`

          const detailResponse = await fetch(detailUrl, {
            headers: {
              'Accept': 'application/json',
              'Ocp-Apim-Subscription-Key': cqcApiKey,
              'User-Agent': 'CheckLoops/1.0'
            }
          })

          if (detailResponse.ok) {
            const detailData = await detailResponse.json()

            // Extract primary inspection category
            const primaryCategory = detailData.inspectionCategories?.find((cat: any) => cat.primary === 'true' || cat.primary === true)

            // Extract overall rating from current ratings if available
            const overallRating = detailData.currentRatings?.overall?.rating || null

            // Update with detailed data
            const { error } = await supabase
              .from('CQC_List')
              .update({
                organisation_type: detailData.organisationType || null,
                ownership_type: detailData.ownershipType || null,
                type: detailData.type || null,
                registration_status: detailData.registrationStatus || null,
                registration_date: detailData.registrationDate || null,
                deregistration_date: detailData.deregistrationDate || null,
                website: detailData.website || null,
                main_phone_number: detailData.mainPhoneNumber || null,
                postal_address_line1: detailData.postalAddressLine1 || null,
                postal_address_line2: detailData.postalAddressLine2 || null,
                postal_address_town_city: detailData.postalAddressTownCity || null,
                postal_address_county: detailData.postalAddressCounty || null,
                postal_code: detailData.postalCode || null,
                region: detailData.region || null,
                uprn: detailData.uprn || null,
                onspd_latitude: detailData.onspdLatitude || null,
                onspd_longitude: detailData.onspdLongitude || null,
                onspd_icb_code: detailData.onspdIcbCode || null,
                onspd_icb_name: detailData.onspdIcbName || null,
                constituency: detailData.constituency || null,
                local_authority: detailData.localAuthority || null,
                inspection_directorate: detailData.inspectionDirectorate || null,
                last_inspection_date: detailData.lastInspection?.date || null,
                inspection_categories: detailData.inspectionCategories || [],
                primary_inspection_category_code: primaryCategory?.code || null,
                primary_inspection_category_name: primaryCategory?.name || null,
                current_ratings: detailData.currentRatings || {},
                overall_rating: overallRating,
                location_ids: detailData.locationIds || [],
                contacts: detailData.contacts || [],
                relationships: detailData.relationships || [],
                regulated_activities: detailData.regulatedActivities || [],
                inspection_areas: detailData.inspectionAreas || []
              })
              .eq('provider_id', provider.providerId)

            if (!error) {
              detailsFetched++
              console.log(`Updated details for ${provider.providerId} (${detailsFetched}/${providersToDetail.length})`)
            }
          }

          // Small delay to avoid rate limiting
          if (detailsFetched % 10 === 0) {
            await new Promise(resolve => setTimeout(resolve, 100))
          }
        } catch (error) {
          console.error(`Error fetching details for provider ${provider.providerId}:`, error)
        }
      }
    }

    // Verify the final count
    const { count: finalCount } = await supabase
      .from('CQC_List')
      .select('*', { count: 'exact', head: true })

    return new Response(
      JSON.stringify({
        success: errors.length === 0,
        message: withDetails
          ? `Populated ${insertedCount} GP practices, fetched details for ${detailsFetched}`
          : `Populated ${insertedCount} GP practices with basic data`,
        totalProviders: allProviders.length,
        actuallyInserted: insertedCount,
        detailsFetched: detailsFetched,
        finalTableCount: finalCount || 0,
        errors: errors.length > 0 ? errors : null,
        nextDetailBatch: withDetails ? startFrom + maxDetails : 0
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})