import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://unveoqnlqnobufhublyw.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAxNzI3NiwiZXhwIjoyMDcwNTkzMjc2fQ.CJxV14F0T2TWkAjeR4bpYiBIOwLwyfzF9WzAWwS99Xc';

const supabase = createClient(supabaseUrl, serviceKey);

async function checkTablesData() {
    try {
        console.log('🔍 CHECKING ROLES AND TEAMS TABLES\n');
        
        // Check kiosk_roles table
        console.log('📋 KIOSK_ROLES TABLE:');
        try {
            const { data: roles, error: rolesError } = await supabase
                .from('kiosk_roles')
                .select('*')
                .order('role');
            
            if (rolesError) {
                console.log('❌ Error accessing kiosk_roles:', rolesError.message);
            } else if (!roles || roles.length === 0) {
                console.log('⚠️ Table exists but is empty');
            } else {
                console.log('✅ Found roles:');
                roles.forEach((role, i) => {
                    console.log(`   ${i + 1}. ${role.role} ${role.id ? `(ID: ${role.id})` : ''}`);
                });
            }
        } catch (e) {
            console.log('❌ Table may not exist or access denied:', e.message);
        }

        console.log('\n👥 TEAMS TABLE:');
        try {
            const { data: teams, error: teamsError } = await supabase
                .from('teams')
                .select('*')
                .order('site_id', { ascending: true })
                .order('name', { ascending: true });
            
            if (teamsError) {
                console.log('❌ Error accessing teams:', teamsError.message);
            } else if (!teams || teams.length === 0) {
                console.log('⚠️ Table exists but is empty');
            } else {
                console.log('✅ Found teams:');
                const teamsBySite = teams.reduce((acc, team) => {
                    if (!acc[team.site_id]) acc[team.site_id] = [];
                    acc[team.site_id].push(team);
                    return acc;
                }, {});
                
                Object.keys(teamsBySite).forEach(siteId => {
                    console.log(`   Site ${siteId}:`);
                    teamsBySite[siteId].forEach(team => {
                        console.log(`     - ${team.name} (ID: ${team.id})`);
                    });
                });
            }
        } catch (e) {
            console.log('❌ Table may not exist or access denied:', e.message);
        }

        // Check what fallback values would be used
        console.log('\n🔧 FALLBACK VALUES:');
        console.log('Roles fallback:', ['Doctor','Nurse','Pharmacist','Reception','Manager']);
        console.log('Teams fallback:', [
            '{ id: 1, name: "Managers" }',
            '{ id: 2, name: "Reception" }', 
            '{ id: 3, name: "Nursing" }',
            '{ id: 4, name: "GPs" }',
            '{ id: 5, name: "Pharmacy" }'
        ]);

        // Check sites table to understand site context
        console.log('\n🏥 SITES INFORMATION:');
        try {
            const { data: sites, error: sitesError } = await supabase
                .from('sites')
                .select('*')
                .order('id');
            
            if (sitesError) {
                console.log('❌ Error accessing sites:', sitesError.message);
            } else if (!sites || sites.length === 0) {
                console.log('⚠️ No sites found');
            } else {
                console.log('✅ Available sites:');
                sites.forEach(site => {
                    console.log(`   ${site.id}. ${site.name || 'Unnamed Site'}`);
                });
            }
        } catch (e) {
            console.log('❌ Sites table access error:', e.message);
        }
        
    } catch (error) {
        console.error('Unexpected error:', error);
    }
}

checkTablesData();