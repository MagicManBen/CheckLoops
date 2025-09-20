import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://unveoqnlqnobufhublyw.supabase.co';
const serviceKey = (typeof process !== 'undefined' && process.env?.SUPABASE_SERVICE_ROLE_KEY) || '';
if (!serviceKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY not set in environment');
}

const supabase = createClient(supabaseUrl, serviceKey);

async function checkAllTeams() {
    console.log('🔍 ALL TEAMS ACROSS ALL SITES:\n');
    
    try {
        const { data: teams, error } = await supabase
            .from('teams')
            .select('*')
            .order('site_id', { ascending: true })
            .order('id', { ascending: true });
        
        if (error) {
            console.log('❌ Error:', error.message);
            return;
        }

        if (!teams || teams.length === 0) {
            console.log('⚠️ No teams found in database');
            return;
        }

        const teamsBySite = teams.reduce((acc, team) => {
            if (!acc[team.site_id]) acc[team.site_id] = [];
            acc[team.site_id].push(team);
            return acc;
        }, {});

        Object.keys(teamsBySite).forEach(siteId => {
            console.log(`🏥 SITE ${siteId}:`);
            teamsBySite[siteId].forEach(team => {
                console.log(`   ${team.id}. ${team.name}`);
            });
            console.log('');
        });

        console.log('📊 SUMMARY:');
        console.log(`Total teams: ${teams.length}`);
        console.log(`Sites with teams: ${Object.keys(teamsBySite).length}`);

    } catch (e) {
        console.error('Error:', e.message);
    }
}

checkAllTeams();