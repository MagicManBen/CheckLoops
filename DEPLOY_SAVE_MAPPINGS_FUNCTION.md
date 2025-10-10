# Deploy save-slot-mappings Edge Function via Supabase Dashboard

Since the CLI isn't working, follow these steps to deploy via the Supabase Dashboard:

## Step 1: Create the SQL Table

Go to Supabase Dashboard → SQL Editor and run this:

```sql
-- Create slot_type_mappings table
CREATE TABLE IF NOT EXISTS public.slot_type_mappings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id TEXT NOT NULL,
  hardcoded_type TEXT NOT NULL,
  matched_emis_type TEXT NOT NULL,
  mapped_by_user_id UUID NOT NULL,
  mapped_by_user_email TEXT,
  mapped_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_slot_mappings_site_id ON public.slot_type_mappings(site_id);
CREATE INDEX IF NOT EXISTS idx_slot_mappings_user ON public.slot_type_mappings(mapped_by_user_id);

-- Enable RLS
ALTER TABLE public.slot_type_mappings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own site's mappings
CREATE POLICY "Users can view own site mappings"
  ON public.slot_type_mappings
  FOR SELECT
  TO authenticated
  USING (
    site_id IN (
      SELECT site_id 
      FROM master_users 
      WHERE auth_user_id = auth.uid()
    )
  );

-- Policy: Users can insert mappings for their site
CREATE POLICY "Users can insert own site mappings"
  ON public.slot_type_mappings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    site_id IN (
      SELECT site_id 
      FROM master_users 
      WHERE auth_user_id = auth.uid()
    )
  );

-- Policy: Service role has full access
CREATE POLICY "Service role has full access"
  ON public.slot_type_mappings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
```

## Step 2: Create the Edge Function via Dashboard

1. Go to: https://supabase.com/dashboard/project/unveoqnlqnobufhublyw/functions
2. Click "Create a new function"
3. **Function name**: `save-slot-mappings`
4. Copy and paste this code:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SlotMapping {
  hardcoded_type: string
  matched_emis_type: string
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Create Supabase client with service role for bypassing RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      global: {
        headers: {
          Authorization: authHeader
        }
      }
    })

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    
    if (userError || !user) {
      throw new Error('Failed to authenticate user')
    }

    // Get user profile to find site_id
    const { data: profile, error: profileError } = await supabase
      .from('master_users')
      .select('site_id')
      .eq('auth_user_id', user.id)
      .single()

    if (profileError || !profile || !profile.site_id) {
      throw new Error('User profile or site_id not found')
    }

    // Parse request body
    const { mappings } = await req.json() as { mappings: SlotMapping[] }

    if (!Array.isArray(mappings) || mappings.length === 0) {
      throw new Error('Invalid or empty mappings array')
    }

    // Prepare records for insertion
    const records = mappings.map(mapping => ({
      site_id: profile.site_id,
      hardcoded_type: mapping.hardcoded_type,
      matched_emis_type: mapping.matched_emis_type,
      mapped_by_user_id: user.id,
      mapped_by_user_email: user.email || null,
      mapped_at: new Date().toISOString()
    }))

    // Insert all records
    const { data, error: insertError } = await supabase
      .from('slot_type_mappings')
      .insert(records)
      .select()

    if (insertError) {
      console.error('Insert error:', insertError)
      throw insertError
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully saved ${records.length} mappings`,
        count: records.length,
        data 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in save-slot-mappings:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'An unknown error occurred'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})
```

5. Click "Deploy"

## Step 3: Test the Function

Once deployed, test it with this curl command (replace YOUR_USER_TOKEN with a valid session token):

```bash
curl -X POST https://unveoqnlqnobufhublyw.supabase.co/functions/v1/save-slot-mappings \
  -H "Authorization: Bearer YOUR_USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mappings": [
      {
        "hardcoded_type": "Book on the day",
        "matched_emis_type": "Urgent appointment"
      },
      {
        "hardcoded_type": "Within 1 week",
        "matched_emis_type": "Routine appointment"
      }
    ]
  }'
```

## Step 4: Verify in Database

After testing, check the data was saved:

```sql
SELECT * FROM slot_type_mappings ORDER BY created_at DESC LIMIT 10;
```

## What This Function Does

1. ✅ Authenticates the user from the Authorization header
2. ✅ Fetches the user's `site_id` from `master_users` table
3. ✅ Validates the mappings array
4. ✅ Inserts all mappings with user info and timestamps
5. ✅ Returns success/error response

## Security Features

- ✅ Uses service role key (server-side only, never exposed to client)
- ✅ Validates user authentication
- ✅ Associates mappings with user's site_id
- ✅ RLS policies ensure users only see their own data
- ✅ Records who created each mapping and when

## Next Steps

After deployment, the HTML page will automatically work - it's already configured to call this function!
