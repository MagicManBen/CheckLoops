// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

type PracticeRecord = {
  ods_code: string
  name: string
  address_line1: string | null
  address_line2: string | null
  city: string | null
  postcode: string | null
  phone: string | null
  status: string | null
  primary_role: string | null
  last_updated: string | null
  raw_data: Record<string, unknown> | null
}

function normalise(value: string | null | undefined): string {
  return (value || '').toLowerCase().replace(/\s+/g, ' ').trim()
}

function normaliseArray(value: unknown): any[] {
  if (!value) return []
  if (Array.isArray(value)) return value
  return [value]
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length

  const matrix: number[][] = []

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i]
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }

  return matrix[b.length][a.length]
}

async function fetchJson(url: string, headers: Record<string, string> = {}, timeoutMs = 10000) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      headers,
      signal: controller.signal,
    })

    if (!response.ok) {
      console.warn(`fetchJson: ${url} returned ${response.status}`)
      return null
    }

    return await response.json()
  } catch (error) {
    console.error(`fetchJson error for ${url}:`, error)
    return null
  } finally {
    clearTimeout(timeout)
  }
}

function extractContacts(source: any): any[] {
  const contacts = normaliseArray(source?.Contacts?.Contact || source?.contacts || source?.Contact)
  return contacts
    .map((contact: any) => {
      if (!contact) return null
      return {
        type: contact.ContactTypeDesc || contact.type || contact.contactTypeDesc || contact.contactTypeDescription,
        code: contact.ContactTypeCode || contact.contactTypeCode,
        value: contact.ContactValue || contact.value || contact.contactValue || contact.Uri,
        department: contact.Department || contact.department,
        primary: contact.Primary || contact.primary || contact.primaryRole || false,
        usage: contact.Usage || contact.usage || contact.contactRoleDesc,
      }
    })
    .filter(Boolean)
}

function extractOpeningTimes(source: any): any[] {
  const openings = normaliseArray(source?.OpeningTimes?.OpeningTime || source?.openingTimes)
  return openings.map((opening: any) => ({
    days: opening.Days || opening.days,
    open: opening.OpeningTime || opening.openingTime,
    close: opening.ClosingTime || opening.closingTime,
    description: opening.OpeningType || opening.description,
  }))
}

function extractServices(source: any): any[] {
  const services = normaliseArray(source?.Services?.Service || source?.services)
  return services.map((service: any) => ({
    name: service.ServiceName || service.name,
    code: service.ServiceCode || service.code,
    status: service.Status || service.status,
  }))
}

function pickBestCqcLocation(locations: any[], targetName: string, targetPostcode: string) {
  if (!locations?.length) return null
  if (locations.length === 1) return locations[0]

  const normalisedTarget = normalise(targetName)
  const normalisedPostcode = normalise(targetPostcode)

  let best = locations[0]
  let bestScore = -Infinity

  for (const location of locations) {
    const locationName = normalise(location.locationName || location.name)
    const locationPostcode = normalise(location.postcode)

    let score = 0

    if (locationName === normalisedTarget) score += 100
    if (locationName.startsWith(normalisedTarget)) score += 60
    if (locationName.includes(normalisedTarget)) score += 40

    if (locationPostcode && normalisedPostcode && locationPostcode === normalisedPostcode) score += 30
    if (locationPostcode && normalisedPostcode && locationPostcode.startsWith(normalisedPostcode.slice(0, 3))) score += 15

    score += Math.max(0, 40 - levenshtein(locationName, normalisedTarget))

    if (score > bestScore) {
      best = location
      bestScore = score
    }
  }

  return best
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ error: 'Service configuration missing' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    const { odsCode, practiceName, includeRaw = false } = await req.json().catch(() => ({}))

    if (!odsCode || typeof odsCode !== 'string') {
      return new Response(
        JSON.stringify({ error: 'odsCode is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data: practice, error: practiceError } = await supabase
      .from('gp_practices_cache')
      .select('ods_code,name,address_line1,address_line2,city,postcode,phone,status,primary_role,last_updated,raw_data')
      .eq('ods_code', odsCode)
      .maybeSingle()

    if (practiceError) {
      console.error('fetch-practice-details: supabase error', practiceError)
    }

    const resolvedName = practiceName || practice?.name || ''
    const resolvedPostcode = practice?.postcode || ''

    // Fetch NHS organisation details
    const nhsHeaders = {
      Accept: 'application/json',
      'User-Agent': 'CheckLoops/1.0 (+fetch-practice-details)',
    }

    const nhsUrl = `https://directory.spineservices.nhs.uk/ORD/2-0-0/organisations/${encodeURIComponent(odsCode)}?_format=json`
    const nhsResponse = await fetchJson(nhsUrl, nhsHeaders)
    const nhsOrganisation = nhsResponse?.Organisation || null

    // Aggregate NHS data, prefer live response, fallback to cached raw data
    const nhsAggregated = nhsOrganisation || practice?.raw_data || null

    const contacts = extractContacts(nhsAggregated)
    const openingTimes = extractOpeningTimes(nhsAggregated)
    const services = extractServices(nhsAggregated)

    // Fetch CQC data
    const cqcHeaders = {
      Accept: 'application/json',
      'User-Agent': 'CheckLoops/1.0 (+fetch-practice-details)',
    }

    let cqcSearch = await fetchJson(
      `https://api.service.cqc.org.uk/public/v1/locations?partnerCode=${encodeURIComponent(odsCode)}&perPage=50`,
      cqcHeaders,
    )

    if (!cqcSearch?.locations?.length && resolvedName) {
      cqcSearch = await fetchJson(
        `https://api.service.cqc.org.uk/public/v1/locations?locationName=${encodeURIComponent(resolvedName)}&perPage=50`,
        cqcHeaders,
      )
    }

    const cqcLocation = pickBestCqcLocation(cqcSearch?.locations || [], resolvedName, resolvedPostcode)
    let cqcDetail = null
    let cqcProvider = null

    if (cqcLocation?.locationId) {
      cqcDetail = await fetchJson(
        `https://api.service.cqc.org.uk/public/v1/locations/${encodeURIComponent(cqcLocation.locationId)}`,
        cqcHeaders,
      )

      if (cqcLocation.providerId) {
        cqcProvider = await fetchJson(
          `https://api.service.cqc.org.uk/public/v1/providers/${encodeURIComponent(cqcLocation.providerId)}`,
          cqcHeaders,
        )
      }
    }

    return new Response(
      JSON.stringify({
        practice: practice
          ? {
              ods_code: practice.ods_code,
              name: practice.name,
              address_line1: practice.address_line1,
              address_line2: practice.address_line2,
              city: practice.city,
              postcode: practice.postcode,
              phone: practice.phone,
              status: practice.status,
              primary_role: practice.primary_role,
              last_updated: practice.last_updated,
              raw_data: includeRaw ? practice.raw_data : undefined,
            }
          : null,
        nhs: nhsAggregated
          ? {
              organisation: nhsOrganisation,
              contacts,
              openingTimes,
              services,
              roles: normaliseArray(nhsAggregated?.Roles?.Role || nhsAggregated?.roles),
              relationships: normaliseArray(nhsAggregated?.Rels?.Rel || nhsAggregated?.relationships),
              raw: includeRaw ? nhsAggregated : undefined,
            }
          : null,
        cqc: cqcLocation
          ? {
              location: cqcLocation,
              detail: cqcDetail,
              provider: cqcProvider,
              overallRating:
                cqcDetail?.currentRatings?.overall?.rating ||
                cqcLocation?.currentRatings?.overall?.rating ||
                null,
              lastInspection:
                cqcDetail?.lastInspection?.date ||
                cqcLocation?.lastInspection?.date ||
                null,
              reports: cqcDetail?.reports || cqcLocation?.reports || [],
            }
          : null,
        meta: {
          odsCode,
          fetchedAt: new Date().toISOString(),
          sources: {
            cache: Boolean(practice),
            nhsLive: Boolean(nhsOrganisation),
            cqc: Boolean(cqcLocation),
          },
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('fetch-practice-details fatal error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Unexpected error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 },
    )
  }
})
