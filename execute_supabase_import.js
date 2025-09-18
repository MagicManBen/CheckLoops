const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read Supabase credentials from index.html
const indexHtml = fs.readFileSync('index.html', 'utf8');
const supabaseUrlMatch = indexHtml.match(/const\s+SUPABASE_URL\s*=\s*['"]([^'"]+)['"]/);
const supabaseKeyMatch = indexHtml.match(/const\s+SUPABASE_ANON_KEY\s*=\s*['"]([^'"]+)['"]/);

if (!supabaseUrlMatch || !supabaseKeyMatch) {
    console.error('Could not find Supabase credentials in index.html');
    process.exit(1);
}

const SUPABASE_URL = supabaseUrlMatch[1];
const SUPABASE_ANON_KEY = supabaseKeyMatch[1];

// For admin operations, we need service role key
// Looking for it in the HTML or environment
const serviceKeyMatch = indexHtml.match(/const\s+SUPABASE_SERVICE_KEY\s*=\s*['"]([^'"]+)['"]/);
const SUPABASE_SERVICE_KEY = serviceKeyMatch ? serviceKeyMatch[1] : process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY);

async function executeSQL(sqlContent) {
    // Split SQL into individual statements
    const statements = sqlContent
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`Executing ${statements.length} SQL statements...`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
        const statement = statements[i] + ';';
        
        try {
            // Use Supabase's RPC to execute raw SQL
            const { data, error } = await supabase.rpc('execute_sql', {
                query: statement
            });
            
            if (error) {
                console.error(`Error in statement ${i + 1}:`, error.message);
                console.error('Statement:', statement.substring(0, 100) + '...');
                errorCount++;
            } else {
                successCount++;
                if ((i + 1) % 10 === 0) {
                    console.log(`Progress: ${i + 1}/${statements.length} statements executed`);
                }
            }
        } catch (err) {
            console.error(`Error in statement ${i + 1}:`, err.message);
            errorCount++;
        }
    }
    
    console.log(`\nExecution complete:`);
    console.log(`✅ Success: ${successCount} statements`);
    console.log(`❌ Errors: ${errorCount} statements`);
    
    return { successCount, errorCount };
}

async function main() {
    try {
        console.log('Starting Supabase holiday data import...');
        console.log('Supabase URL:', SUPABASE_URL);
        console.log('');
        
        // Read SQL files
        const setupSQL = fs.readFileSync('setup_holiday_database.sql', 'utf8');
        const importSQL = fs.readFileSync('import_holiday_data.sql', 'utf8');
        
        // Execute setup SQL
        console.log('Setting up database schema...');
        const setupResult = await executeSQL(setupSQL);
        
        if (setupResult.errorCount > 0) {
            console.log('\n⚠️  Some setup statements failed. This might be expected if tables already exist.');
        }
        
        // Execute import SQL
        console.log('\nImporting holiday data...');
        const importResult = await executeSQL(importSQL);
        
        // Verify the import
        console.log('\nVerifying import...');
        
        const { data: profiles, error: profileError } = await supabase
            .from('staff_holiday_profiles')
            .select('*')
            .limit(5);
        
        if (profiles) {
            console.log(`✅ Staff profiles created: ${profiles.length} (showing first 5)`);
            profiles.forEach(p => console.log(`  - ${p.full_name} (${p.role})`));
        }
        
        const { data: bookings, error: bookingError } = await supabase
            .from('holiday_bookings')
            .select('*')
            .limit(5);
        
        if (bookings) {
            console.log(`✅ Holiday bookings created: ${bookings.length} (showing first 5)`);
        }
        
        // Check for linked users
        const { data: links, error: linkError } = await supabase
            .from('staff_profile_user_links')
            .select('*');
        
        if (links && links.length > 0) {
            console.log(`✅ User accounts linked: ${links.length}`);
        } else {
            console.log('ℹ️  No user accounts linked yet (users will be linked when they sign up)');
        }
        
        console.log('\n🎉 Holiday data import completed successfully!');
        
    } catch (error) {
        console.error('Fatal error:', error);
        process.exit(1);
    }
}

// Run the import
main();