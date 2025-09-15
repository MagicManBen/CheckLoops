// Script to update database schema for entitlement management

async function updateEntitlementDatabaseSchema() {
  try {
    if (!window.supabase) {
      console.error('Supabase client not initialized');
      return;
    }

    console.log('Checking and updating entitlement database schema...');

    // Check if the weekly_hours column exists
    const { data: columnCheck, error: checkError } = await window.supabase.rpc('check_column_exists', {
      table_name: '2_staff_entitlements',
      column_name: 'weekly_hours'
    });

    if (checkError) {
      console.error('Error checking column:', checkError);
      return;
    }

    // If the column doesn't exist, we need to run our schema update script
    if (!columnCheck || !columnCheck.exists) {
      console.log('Weekly hours column not found, updating schema...');

      // The following queries create the necessary columns
      const queries = [
        // Add weekly_hours column
        `ALTER TABLE "2_staff_entitlements" ADD COLUMN IF NOT EXISTS weekly_hours DECIMAL(10,2) DEFAULT 0;`,
        
        // Add weekly_sessions column
        `ALTER TABLE "2_staff_entitlements" ADD COLUMN IF NOT EXISTS weekly_sessions INTEGER DEFAULT 0;`,
        
        // Add calculated_hours column
        `ALTER TABLE "2_staff_entitlements" ADD COLUMN IF NOT EXISTS calculated_hours DECIMAL(10,2) DEFAULT 0;`,
        
        // Add calculated_sessions column
        `ALTER TABLE "2_staff_entitlements" ADD COLUMN IF NOT EXISTS calculated_sessions INTEGER DEFAULT 0;`
      ];

      // Execute each query
      for (const query of queries) {
        const { error } = await window.supabase.rpc('execute_sql', { sql_query: query });
        if (error) {
          console.error(`Error executing query: ${query}`, error);
        }
      }

      // Update existing records with correct weekly values
      const updateQueries = [
        // Update staff weekly hours
        `UPDATE "2_staff_entitlements" e
         SET weekly_hours = p.total_hours
         FROM "3_staff_working_patterns" p
         JOIN "1_staff_holiday_profiles" hp ON hp.user_id = p.user_id
         WHERE e.staff_id = hp.id 
         AND hp.is_gp = FALSE
         AND p.total_hours IS NOT NULL;`,

        // Update GP weekly sessions
        `UPDATE "2_staff_entitlements" e
         SET weekly_sessions = p.total_sessions
         FROM "3_staff_working_patterns" p
         JOIN "1_staff_holiday_profiles" hp ON hp.user_id = p.user_id
         WHERE e.staff_id = hp.id 
         AND hp.is_gp = TRUE
         AND p.total_sessions IS NOT NULL;`,

        // Update calculated hours
        `UPDATE "2_staff_entitlements" e
         SET calculated_hours = weekly_hours * multiplier
         WHERE override IS NULL 
         AND EXISTS (SELECT 1 FROM "1_staff_holiday_profiles" hp WHERE hp.id = e.staff_id AND hp.is_gp = FALSE);`,

        // Update calculated sessions
        `UPDATE "2_staff_entitlements" e
         SET calculated_sessions = weekly_sessions * multiplier
         WHERE override IS NULL
         AND EXISTS (SELECT 1 FROM "1_staff_holiday_profiles" hp WHERE hp.id = e.staff_id AND hp.is_gp = TRUE);`
      ];

      // Execute update queries
      for (const query of updateQueries) {
        const { error } = await window.supabase.rpc('execute_sql', { sql_query: query });
        if (error) {
          console.error(`Error executing update query:`, error);
        }
      }

      console.log('Schema update completed');
    } else {
      console.log('Schema is already up to date');
    }
  } catch (error) {
    console.error('Error updating database schema:', error);
  }
}

// Export the function
window.updateEntitlementDatabaseSchema = updateEntitlementDatabaseSchema;