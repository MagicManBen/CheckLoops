import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { action, params } = await req.json()

    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const githubToken = Deno.env.get('GITHUB_TOKEN') ?? ''

    // Create service role client for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    let result = {}

    switch (action) {
      case 'checkWebsite': {
        try {
          const response = await fetch('https://checkloops.co.uk', {
            method: 'HEAD',
            signal: AbortSignal.timeout(5000)
          })
          result = {
            status: response.ok ? 'online' : 'error',
            statusCode: response.status,
            headers: Object.fromEntries(response.headers.entries())
          }
        } catch (error) {
          result = {
            status: 'offline',
            error: error.message
          }
        }
        break
      }

      case 'checkSupabase': {
        try {
          // Test database connection
          const { data, error } = await supabase
            .from('master_users')
            .select('count', { count: 'exact', head: true })

          if (error) throw error

          result = {
            status: 'connected',
            database: 'reachable',
            url: supabaseUrl
          }
        } catch (error) {
          result = {
            status: 'error',
            error: error.message
          }
        }
        break
      }

      case 'getStatistics': {
        try {
          // Get counts from various tables
          const [users, sites, holidays, requests, training, items] = await Promise.all([
            supabase.from('master_users').select('*', { count: 'exact', head: true }),
            supabase.from('sites').select('*', { count: 'exact', head: true }),
            supabase.from('holidays').select('*', { count: 'exact', head: true }),
            supabase.from('4_holiday_requests').select('*', { count: 'exact', head: true }),
            supabase.from('training_matrix').select('*', { count: 'exact', head: true }),
            supabase.from('items').select('*', { count: 'exact', head: true })
          ])

          result = {
            users: users.count || 0,
            sites: sites.count || 0,
            holidays: holidays.count || 0,
            holidayRequests: requests.count || 0,
            trainingRecords: training.count || 0,
            items: items.count || 0
          }
        } catch (error) {
          result = {
            status: 'error',
            error: error.message
          }
        }
        break
      }

      case 'getRecentActivity': {
        try {
          // Get recent activities from various tables
          const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // Last 24 hours

          const [users, logins, requests, training] = await Promise.all([
            supabase
              .from('master_users')
              .select('email, created_at, invite_accepted_at')
              .gte('created_at', since)
              .order('created_at', { ascending: false })
              .limit(5),
            supabase
              .from('master_users')
              .select('email, last_login')
              .not('last_login', 'is', null)
              .gte('last_login', since)
              .order('last_login', { ascending: false })
              .limit(5),
            supabase
              .from('4_holiday_requests')
              .select('id, user_id, status, created_at')
              .gte('created_at', since)
              .order('created_at', { ascending: false })
              .limit(5),
            supabase
              .from('training_matrix')
              .select('staff_name, course_title, created_at')
              .gte('created_at', since)
              .order('created_at', { ascending: false })
              .limit(5)
          ])

          result = {
            newUsers: users.data || [],
            recentLogins: logins.data || [],
            holidayRequests: requests.data || [],
            trainingCompleted: training.data || []
          }
        } catch (error) {
          result = {
            status: 'error',
            error: error.message
          }
        }
        break
      }

      case 'testKeys': {
        const results = {
          serviceKey: false,
          anonKey: false
        }

        // Test Service Key
        if (supabaseServiceKey) {
          try {
            const serviceClient = createClient(supabaseUrl, supabaseServiceKey)
            const { error } = await serviceClient.auth.admin.listUsers({ page: 1, perPage: 1 })
            results.serviceKey = !error
          } catch (e) {
            results.serviceKey = false
          }
        }

        // Test Anon Key
        if (supabaseAnonKey) {
          try {
            const anonClient = createClient(supabaseUrl, supabaseAnonKey)
            const { error } = await anonClient.from('sites').select('count', { count: 'exact', head: true })
            results.anonKey = !error
          } catch (e) {
            results.anonKey = false
          }
        }

        result = results
        break
      }

      case 'checkGitHub': {
        if (!params?.owner || !params?.repo) {
          result = { error: 'Missing GitHub owner/repo parameters' }
          break
        }

        try {
          const headers: HeadersInit = {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'CheckLoops-Status-Dashboard'
          }
          if (githubToken) {
            headers['Authorization'] = `token ${githubToken}`
          }

          // Get repository info
          const repoResponse = await fetch(
            `https://api.github.com/repos/${params.owner}/${params.repo}`,
            { headers }
          )

          if (!repoResponse.ok) {
            result = {
              status: 'error',
              error: `GitHub repository not found: ${params.owner}/${params.repo}`,
              statusCode: repoResponse.status
            }
            break
          }

          const repoData = await repoResponse.json()

          // Get latest commits
          const commitsResponse = await fetch(
            `https://api.github.com/repos/${params.owner}/${params.repo}/commits?per_page=5`,
            { headers }
          )
          const commits = await commitsResponse.json()

          // Get open pull requests
          const prsResponse = await fetch(
            `https://api.github.com/repos/${params.owner}/${params.repo}/pulls?state=open&per_page=5`,
            { headers }
          )
          const prs = await prsResponse.json()

          result = {
            repository: {
              name: repoData.name || 'Unknown',
              description: repoData.description || 'No description',
              stars: repoData.stargazers_count || 0,
              forks: repoData.forks_count || 0,
              openIssues: repoData.open_issues_count || 0,
              defaultBranch: repoData.default_branch || 'main',
              updatedAt: repoData.updated_at || new Date().toISOString(),
              language: repoData.language || 'Unknown'
            },
            commits: Array.isArray(commits) ? commits.map((c: any) => ({
              sha: c.sha?.substring(0, 7) || 'unknown',
              message: c.commit?.message || 'No message',
              author: c.commit?.author?.name || 'Unknown',
              date: c.commit?.author?.date || new Date().toISOString()
            })) : [],
            pullRequests: Array.isArray(prs) ? prs.map((pr: any) => ({
              number: pr.number || 0,
              title: pr.title || 'No title',
              author: pr.user?.login || 'Unknown',
              createdAt: pr.created_at || new Date().toISOString(),
              state: pr.state || 'unknown'
            })) : []
          }
        } catch (error) {
          result = {
            status: 'error',
            error: error.message
          }
        }
        break
      }

      case 'getInProgressItems': {
        try {
          const results = []

          // Check for pending holiday requests
          const { data: pendingHolidays } = await supabase
            .from('4_holiday_requests')
            .select('id, user_id, status')
            .eq('status', 'pending')

          if (pendingHolidays?.length) {
            results.push({
              type: 'Holiday Requests',
              count: pendingHolidays.length,
              status: 'pending'
            })
          }

          // Check for incomplete onboarding
          const { data: incompleteOnboarding } = await supabase
            .from('master_users')
            .select('id, email')
            .eq('onboarding_complete', false)

          if (incompleteOnboarding?.length) {
            results.push({
              type: 'Onboarding',
              count: incompleteOnboarding.length,
              status: 'incomplete'
            })
          }

          // Check for pending invitations
          const { data: pendingInvites } = await supabase
            .from('master_users')
            .select('id, email')
            .eq('invite_status', 'pending')

          if (pendingInvites?.length) {
            results.push({
              type: 'Invitations',
              count: pendingInvites.length,
              status: 'pending'
            })
          }

          result = { inProgress: results }
        } catch (error) {
          result = {
            status: 'error',
            error: error.message
          }
        }
        break
      }

      default:
        result = { error: 'Invalid action' }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    })
  }
})