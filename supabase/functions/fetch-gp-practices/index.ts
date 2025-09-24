// Supabase Edge Function to proxy NHS ORD API requests
// This avoids CORS issues when fetching GP practice data

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request body
    const { limit = 500, offset = 0, useCache = true } = await req.json().catch(() => ({}))

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Check cache first if enabled
    if (useCache) {
      const { data: cachedData, error: cacheError } = await supabase
        .from('gp_practices_cache')
        .select('*')
        .range(offset, offset + limit - 1)

      if (!cacheError && cachedData && cachedData.length > 0) {
        console.log(`Returning ${cachedData.length} cached GP practices`)

        // Transform to NHS ORD format
        const organisations = cachedData.map(practice => ({
          Name: practice.name,
          OrgId: { extension: practice.ods_code },
          Address: {
            AddrLn1: practice.address_line1,
            AddrLn2: practice.address_line2,
            Town: practice.city,
            PostCode: practice.postcode
          }
        }))

        return new Response(
          JSON.stringify({ Organisations: organisations }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
          }
        )
      }
    }

    // Fetch from NHS ORD API
    const NHS_ORD_BASE = 'https://directory.spineservices.nhs.uk/ORD/2-0-0'

    // Try different role filters to get GP practices
    const urls = [
      `${NHS_ORD_BASE}/organisations?Status=Active&NonPrimaryRoleId=RO76&Limit=${limit}&Offset=${offset}&_format=json`,
      `${NHS_ORD_BASE}/organisations?Status=Active&PrimaryRoleId=RO177&Limit=${limit}&Offset=${offset}&_format=json`,
      `${NHS_ORD_BASE}/organisations?Status=Active&Roles=RO76&Limit=${limit}&Offset=${offset}&_format=json`
    ]

    let nhsData = null
    let lastError = null

    for (const url of urls) {
      try {
        console.log(`Fetching from: ${url}`)

        const response = await fetch(url, {
          headers: {
            'Accept': '*/*',
            'User-Agent': 'Supabase-Edge-Function/1.0'
          }
        })

        console.log(`NHS ORD Response status: ${response.status}`)

        if (response.ok) {
          const contentType = response.headers.get('content-type') || ''

          if (contentType.includes('json')) {
            nhsData = await response.json()
            console.log(`Successfully fetched ${nhsData?.Organisations?.length || 0} organisations`)
            break
          } else {
            // Try to parse as JSON anyway
            const text = await response.text()
            try {
              nhsData = JSON.parse(text)
              break
            } catch {
              console.error(`Non-JSON response: ${text.substring(0, 200)}`)
            }
          }
        }
      } catch (error) {
        lastError = error
        console.error(`Error fetching from NHS ORD: ${error}`)
      }
    }

    if (nhsData && nhsData.Organisations && nhsData.Organisations.length > 0) {
      // Cache the results in Supabase for future use
      const practices = nhsData.Organisations.map((org: any) => ({
        ods_code: org.OrgId?.extension || org.OrgId?.id || org.ODSCode || '',
        name: org.Name || org.OrganisationName || '',
        address_line1: org.GeoLoc?.Location?.AddrLn1 || org.Address?.AddrLn1 || '',
        address_line2: org.GeoLoc?.Location?.AddrLn2 || org.Address?.AddrLn2 || '',
        city: org.GeoLoc?.Location?.Town || org.Address?.Town || '',
        postcode: org.GeoLoc?.Location?.PostCode || org.Address?.PostCode || '',
        raw_data: org
      })).filter((p: any) => p.ods_code && p.name)

      // Upsert to cache (don't wait for it)
      supabase
        .from('gp_practices_cache')
        .upsert(practices, { onConflict: 'ods_code' })
        .then(({ error }) => {
          if (error) console.error('Cache update error:', error)
          else console.log(`Cached ${practices.length} GP practices`)
        })

      return new Response(
        JSON.stringify(nhsData),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

    // If all else fails, return mock data
    const mockData = {
      Organisations: [
        { Name: 'Riverside Medical Practice', OrgId: { extension: 'A81001' } },
        { Name: 'Park Lane Surgery', OrgId: { extension: 'A81002' } },
        { Name: 'Victoria Health Centre', OrgId: { extension: 'A81003' } },
        { Name: 'Elmwood Medical Centre', OrgId: { extension: 'A81004' } },
        { Name: 'High Street Surgery', OrgId: { extension: 'A81005' } }
      ],
      __mock: true,
      __error: lastError ? lastError.toString() : 'No data available'
    }

    return new Response(
      JSON.stringify(mockData),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Edge function error:', error)

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})