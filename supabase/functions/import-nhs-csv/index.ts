import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { parse } from "https://deno.land/std@0.168.0/encoding/csv.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// CSV column mappings for different data types
const COLUMN_MAPPINGS: Record<string, any> = {
  qof: {
    practice_code_column: 'Practice code',
    required_columns: ['Practice code', 'Practice name', 'Achievement points', 'Exception rate'],
    data_fields: ['Practice name', 'Achievement points', 'Exception rate', 'List size', 'Prevalence']
  },
  patient_survey: {
    practice_code_column: 'Practice Code',
    required_columns: ['Practice Code', 'Practice Name', 'Overall experience', 'Access'],
    data_fields: ['Practice Name', 'Overall experience', 'Access', 'Continuity', 'Communication']
  },
  workforce: {
    practice_code_column: 'PRACTICE_CODE',
    required_columns: ['PRACTICE_CODE', 'PRACTICE_NAME', 'TOTAL_GP_FTE', 'TOTAL_NURSES_FTE'],
    data_fields: ['PRACTICE_NAME', 'TOTAL_GP_FTE', 'TOTAL_NURSES_FTE', 'TOTAL_DPC_FTE', 'TOTAL_ADMIN_FTE']
  },
  appointments: {
    practice_code_column: 'Practice_Code',
    required_columns: ['Practice_Code', 'Practice_Name', 'Appointments_Total'],
    data_fields: ['Practice_Name', 'Appointments_Total', 'DNA_Rate', 'Same_Day_Appointments']
  },
  referrals: {
    practice_code_column: 'Practice Code',
    required_columns: ['Practice Code', 'Practice Name', 'Total Referrals'],
    data_fields: ['Practice Name', 'Total Referrals', 'Urgent Referrals', 'Two Week Wait']
  }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const dataType = formData.get('data_type') as string;
    const period = formData.get('period') as string;
    const importedBy = formData.get('imported_by') as string || 'system';

    if (!file) {
      throw new Error('No file uploaded');
    }

    if (!dataType || !COLUMN_MAPPINGS[dataType]) {
      throw new Error(`Invalid or unsupported data type: ${dataType}`);
    }

    console.log(`Starting CSV import for ${dataType}`);
    console.log(`File: ${file.name}, Period: ${period}`);

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Create import log entry
    const { data: logEntry, error: logError } = await supabaseClient
      .from('NHS_CSV_Import_Log')
      .insert({
        data_type: dataType,
        filename: file.name,
        period: period,
        import_status: 'in_progress',
        imported_by: importedBy,
        import_started: new Date().toISOString()
      })
      .select()
      .single();

    if (logError) {
      console.error('Failed to create import log:', logError);
    }

    const logId = logEntry?.id;

    try {
      // Read and parse CSV file
      const csvText = await file.text();
      const parsed = parse(csvText, {
        skipFirstRow: true,
        columns: undefined
      });

      if (!parsed || parsed.length === 0) {
        throw new Error('CSV file is empty or invalid');
      }

      // Get column names from first row
      const firstRow = parsed[0] as any;
      const columnNames = Object.keys(firstRow);

      console.log(`CSV has ${parsed.length} rows`);
      console.log(`Columns found: ${columnNames.join(', ')}`);

      // Validate required columns
      const mapping = COLUMN_MAPPINGS[dataType];
      const missingColumns = mapping.required_columns.filter(
        (col: string) => !columnNames.includes(col)
      );

      if (missingColumns.length > 0) {
        throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
      }

      // Process each row
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (const row of parsed) {
        try {
          const practiceCode = (row as any)[mapping.practice_code_column];

          if (!practiceCode) {
            errorCount++;
            errors.push(`Row missing practice code`);
            continue;
          }

          // Extract data fields
          const data: any = {};
          for (const field of mapping.data_fields) {
            if ((row as any)[field] !== undefined) {
              data[field] = (row as any)[field];
            }
          }

          // Add all columns to data object for completeness
          Object.keys(row as any).forEach(key => {
            if (!data[key]) {
              data[key] = (row as any)[key];
            }
          });

          // Check if ODS code is available (sometimes in different column)
          const odsCode = (row as any)['ODS Code'] || (row as any)['ODS_CODE'] || null;

          // Upsert to NHS_Reference_Data table
          const { error: upsertError } = await supabaseClient
            .from('NHS_Reference_Data')
            .upsert({
              data_type: dataType,
              practice_code: practiceCode,
              ods_code: odsCode,
              data: data,
              period: period,
              source_file: file.name,
              record_count: 1,
              last_updated: new Date().toISOString()
            }, {
              onConflict: 'data_type,practice_code,period'
            });

          if (upsertError) {
            errorCount++;
            errors.push(`Failed to insert ${practiceCode}: ${upsertError.message}`);
            if (errors.length <= 10) {
              console.error(`Error inserting ${practiceCode}:`, upsertError);
            }
          } else {
            successCount++;
          }

          // Also update NHS_All_GPs if practice exists
          if (successCount % 100 === 0) {
            console.log(`Processed ${successCount} records successfully`);
          }

        } catch (rowError) {
          errorCount++;
          errors.push(`Row error: ${rowError.message}`);
        }
      }

      console.log(`Import completed: ${successCount} success, ${errorCount} errors`);

      // Update import log
      if (logId) {
        await supabaseClient
          .from('NHS_CSV_Import_Log')
          .update({
            import_status: errorCount === 0 ? 'success' : 'partial',
            records_imported: successCount,
            error_message: errors.length > 0 ? errors.slice(0, 10).join('; ') : null,
            import_completed: new Date().toISOString()
          })
          .eq('id', logId);
      }

      // Update NHS_All_GPs with aggregated data
      console.log('Updating NHS_All_GPs table with new data...');

      // Get all unique practice codes from this import
      const uniquePracticeCodes = [...new Set(parsed.map((row: any) =>
        row[mapping.practice_code_column]
      ).filter(Boolean))];

      for (const practiceCode of uniquePracticeCodes) {
        try {
          // Get latest data for this practice
          const { data: refData } = await supabaseClient
            .from('NHS_Reference_Data')
            .select('*')
            .eq('practice_code', practiceCode)
            .eq('data_type', dataType)
            .eq('period', period)
            .single();

          if (refData) {
            // Update NHS_All_GPs
            const updateField = `${dataType}_data`;
            const updateData: any = {
              [updateField]: refData.data,
              last_updated: new Date().toISOString()
            };

            await supabaseClient
              .from('NHS_All_GPs')
              .upsert({
                practice_ods_code: refData.ods_code || practiceCode,
                practice_code: practiceCode,
                ...updateData
              }, {
                onConflict: 'practice_ods_code'
              });
          }
        } catch (updateError) {
          console.error(`Failed to update NHS_All_GPs for ${practiceCode}:`, updateError);
        }
      }

      const response = {
        success: true,
        data_type: dataType,
        period: period,
        filename: file.name,
        records_processed: parsed.length,
        records_imported: successCount,
        records_failed: errorCount,
        errors: errors.slice(0, 10),
        import_log_id: logId
      };

      return new Response(
        JSON.stringify(response),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );

    } catch (importError) {
      // Update log with error
      if (logId) {
        await supabaseClient
          .from('NHS_CSV_Import_Log')
          .update({
            import_status: 'failed',
            error_message: importError.message,
            import_completed: new Date().toISOString()
          })
          .eq('id', logId);
      }
      throw importError;
    }

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        success: false
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 400
      }
    );
  }
});