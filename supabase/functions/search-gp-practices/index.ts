// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

type SearchType = 'name' | 'postcode' | 'type'

type SearchRequest = {
  searchType?: SearchType
  query?: string
  options?: {
    limit?: number
    offset?: number
    radius?: 'exact' | 'area' | 'district'
    practiceType?: string
    includeRaw?: boolean
  }
}

type PracticeRow = {
  ods_code: string
  name: string
  postcode: string | null
  city: string | null
  address_line1: string | null
  address_line2: string | null
  phone?: string | null
  status?: string | null
  primary_role?: string | null
  last_updated?: string | null
  raw_data?: Record<string, unknown> | null
}

type PracticeResult = PracticeRow & {
  score: number
  highlight: {
    fields: string[]
    exactMatch: boolean
  }
}

function normalise(value: string | null | undefined): string {
  return (value || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
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
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        )
      }
    }
  }

  return matrix[b.length][a.length]
}

function computeScore(practice: PracticeRow, query: string, tokens: string[]): PracticeResult {
  const name = normalise(practice.name)
  const code = normalise(practice.ods_code)
  const postcode = normalise(practice.postcode)
  const city = normalise(practice.city)
  const addressLine1 = normalise(practice.address_line1)

  let score = 0
  const fields: string[] = []

  // Direct matches are highly ranked
  if (code === query) {
    score += 120
    fields.push('ods_code')
  }

  if (name === query) {
    score += 100
    fields.push('name')
  }

  if (name.startsWith(query)) {
    score += 60
  }

  if (name.includes(query)) {
    score += 40
  }

  if (postcode === query) {
    score += 45
    fields.push('postcode')
  }

  if (city === query) {
    score += 15
    fields.push('city')
  }

  // Token matching adds incremental score
  const splitName = new Set(name.split(' '))
  for (const token of tokens) {
    if (token.length === 0) continue

    if (splitName.has(token)) {
      score += 20
    } else if (name.includes(token)) {
      score += 15
    }

    if (city.includes(token) || postcode.includes(token)) {
      score += 10
    }

    if (addressLine1.includes(token)) {
      score += 8
    }
  }

  // Fuzzy similarity for name and code
  const nameDistance = levenshtein(name, query)
  score += Math.max(0, 30 - nameDistance)

  const codeDistance = levenshtein(code, query)
  score += Math.max(0, 20 - codeDistance)

  return {
    ...practice,
    score,
    highlight: {
      fields,
      exactMatch: code === query || name === query,
    },
  }
}

function filterByRadius(practices: PracticeRow[], postcode: string, radius: 'exact' | 'area' | 'district'): PracticeRow[] {
  if (!postcode) return practices
  const cleanPostcode = postcode.replace(/\s+/g, '').toUpperCase()

  if (!cleanPostcode) return practices

  return practices.filter((practice) => {
    const practicePostcode = (practice.postcode || '').replace(/\s+/g, '').toUpperCase()
    if (!practicePostcode) return false

    switch (radius) {
      case 'exact':
        return practicePostcode.startsWith(cleanPostcode)
      case 'district': {
        const district = cleanPostcode.slice(0, 2)
        return practicePostcode.startsWith(district)
      }
      default: {
        const area = cleanPostcode.split(/(?<=\D)(?=\d)/)[0] || cleanPostcode.slice(0, 4)
        return practicePostcode.startsWith(area)
      }
    }
  })
}

function filterByType(practices: PracticeRow[], type: string | undefined): PracticeRow[] {
  if (!type || type === 'all') return practices
  const keyword = type.replace(/-/g, ' ')
  return practices.filter((practice) => normalise(practice.name).includes(keyword))
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

    const body: SearchRequest = await req.json()
    const searchType: SearchType = body.searchType || 'name'
    const rawQuery = (body.query || '').trim()
    const options = body.options || {}
    const limit = Math.min(Math.max(options.limit ?? 50, 1), 200)
    const radius = options.radius || 'area'
    const practiceType = options.practiceType
    const includeRaw = options.includeRaw ?? false

    if (!rawQuery) {
      return new Response(
        JSON.stringify({ error: 'Search query is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Fetch a generous slice that we can score client-side
    const fetchLimit = searchType === 'name' ? Math.min(limit * 5, 500) : Math.min(limit * 3, 300)

    let queryBuilder = supabase
      .from('gp_practices_cache')
      .select(
        `
          ods_code,
          name,
          postcode,
          city,
          address_line1,
          address_line2,
          phone,
          status,
          primary_role,
          last_updated,
          ${includeRaw ? 'raw_data' : ''}
        `.replace(/,\s+$/, ''),
      )
      .range(0, fetchLimit - 1)
      .order('name', { ascending: true })

    const normalisedQuery = normalise(rawQuery)
    const tokens = normalisedQuery.split(' ').filter(Boolean)

    switch (searchType) {
      case 'postcode':
        queryBuilder = queryBuilder.ilike('postcode', `${rawQuery.toUpperCase().replace(/\s+/g, '')}%`)
        break
      case 'type':
        // We will filter type after fetch to allow more nuanced matching
        break
      default:
        queryBuilder = queryBuilder.or(
          `name.ilike.%${rawQuery}%,ods_code.ilike.%${rawQuery}%,postcode.ilike.%${rawQuery}%`
        )
        break
    }

    const { data, error } = await queryBuilder

    if (error) {
      console.error('search-gp-practices query error:', error)
      return new Response(
        JSON.stringify({ error: error.message || 'Supabase query failed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    let practices: PracticeRow[] = Array.isArray(data) ? data : []

    if (searchType === 'postcode') {
      practices = filterByRadius(practices, rawQuery, radius)
    }

    if (searchType === 'type') {
      practices = filterByType(practices, practiceType)
    }

    if (searchType === 'name') {
      // Ensure all tokens appear somewhere in the record
      practices = practices.filter((practice) => {
        if (tokens.length === 0) return true
        const haystack = [practice.name, practice.city, practice.postcode, practice.address_line1]
          .map(normalise)
          .join(' ')
        return tokens.every((token) => haystack.includes(token))
      })
    }

    const scored = practices.map((practice) => computeScore(practice, normalisedQuery, tokens))
    scored.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))

    const results = scored.slice(0, limit)

    return new Response(
      JSON.stringify({
        results,
        total: scored.length,
        returned: results.length,
        searchType,
        query: rawQuery,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('search-gp-practices fatal error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Unexpected error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
