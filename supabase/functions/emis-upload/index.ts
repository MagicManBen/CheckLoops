// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// Set CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
}

// New anon key for verification
const VALID_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMTcyNzYsImV4cCI6MjA3MDU5MzI3Nn0.g93OsXDpO3V9DToU7s-Z3SwBBnB84rBv0JMv-idgSME";

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  
  // Get the URL path
  const url = new URL(req.url);
  const path = url.pathname.split('/').pop();
  
  // Handle health check endpoint - useful for testing connectivity
  if (path === 'health' || url.searchParams.has('health')) {
    // Extract and log authentication headers for debugging
    const authHeader = req.headers.get('Authorization') || 'none';
    
    return new Response(
      JSON.stringify({
        status: 'ok',
        message: 'EMIS upload function is online',
        time: new Date().toISOString(),
        request: {
          auth: authHeader !== 'none' ? 'provided' : 'missing',
          method: req.method,
          path: path
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  }

  // Check for Authorization header (should be a JWT token)
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(
      JSON.stringify({
        error: 'Unauthorized',
        message: 'Invalid or missing API key',
        providedKey: 'none'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
    );
  }
  
  // Extract token from header
  const token = authHeader.replace('Bearer ', '').trim();
  
  // Verify the token matches our expected anon key
  if (token !== VALID_ANON_KEY) {
    return new Response(
      JSON.stringify({
        error: 'Unauthorized',
        message: 'Invalid API key'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
    );
  }

  try {
    // Only process POST requests for data upload
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed', allowedMethods: 'POST, OPTIONS, GET' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 405 }
      )
    }

    // Create a Supabase client
    const supabaseAdmin = createClient(
      // These environment variables are set by Supabase Edge Functions
      // @ts-ignore
      Deno.env.get('SUPABASE_URL') ?? '',
      // @ts-ignore
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Parse the request body
    const { records } = await req.json()

    if (!records || !Array.isArray(records) || records.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No valid records provided' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Process records to handle empty values appropriately
    // Ensure they maintain the original order using csv_row_number
    const processedRecords = records.map((record: any) => {
      const processedRecord: any = {};
      
      // Loop through each key in the record
      for (const [key, value] of Object.entries(record)) {
        // Skip the csv_row_number field for now - we'll handle it specially
        if (key !== 'csv_row_number') {
          // Handle empty strings and nulls - but preserve "Unknown" as a valid string value
          if (value === "" || value === null || value === undefined) {
            processedRecord[key] = null;
          } else {
            processedRecord[key] = value;
          }
        }
      }
      
      // Ensure default site_id is set if not provided
      if (!Object.prototype.hasOwnProperty.call(processedRecord, 'site_id') || processedRecord['site_id'] === null) {
        processedRecord['site_id'] = 2;
      }
      
      // Preserve the csv_row_number if it exists in the record
      if (record.csv_row_number !== undefined) {
        processedRecord['csv_row_number'] = record.csv_row_number;
      }
      
      return processedRecord;
    });

    // Filter out completely empty records but keep track of their row order
    const validRecords = processedRecords.filter((record: any) => {
      // Check if at least one field has a non-null value (excluding csv_row_number)
      return Object.entries(record).some(([key, value]) => key !== 'csv_row_number' && value !== null);
    });

    // Sort the valid records by csv_row_number to preserve the original order
    validRecords.sort((a: any, b: any) => {
      const rowA = a.csv_row_number || Number.MAX_SAFE_INTEGER;
      const rowB = b.csv_row_number || Number.MAX_SAFE_INTEGER;
      return rowA - rowB;
    });
    
    // Insert data into the emis_apps_raw table
    const { data, error } = await supabaseAdmin
      .from('emis_apps_raw')
      .insert(validRecords)
      .select();

    if (error) {
      // Return detailed error information
      return new Response(
        JSON.stringify({ 
          error: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          recordsAttempted: validRecords.length
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Return success response with detailed information
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully inserted ${data.length} records`,
        count: data.length,
        totalProcessed: records.length,
        validRecords: validRecords.length,
        skippedRecords: records.length - validRecords.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (err) {
    const error = err as Error; // Type assertion
    return new Response(
      JSON.stringify({ 
        error: 'Internal Server Error',
        message: error.message
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})