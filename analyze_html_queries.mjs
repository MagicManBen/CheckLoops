import { promises as fs } from 'fs';
import { glob } from 'glob';

async function analyzeHTMLQueries() {
    console.log('🔍 ANALYZING HTML FILES FOR USER-RELATED QUERIES');
    console.log('================================================\n');

    // Find all HTML files
    const htmlFiles = await glob('**/*.html', {
        ignore: ['node_modules/**', 'dist/**']
    });

    console.log(`Found ${htmlFiles.length} HTML files to analyze\n`);

    const queryPatterns = {
        profiles: [],
        kiosk_users: [],
        site_invites: [],
        other_user_related: []
    };

    for (const file of htmlFiles) {
        const content = await fs.readFile(file, 'utf-8');

        // Find all Supabase queries
        const profileQueries = content.match(/from\(['"]profiles['"]\)[^;]*/g) || [];
        const kioskQueries = content.match(/from\(['"]kiosk_users['"]\)[^;]*/g) || [];
        const inviteQueries = content.match(/from\(['"]site_invites['"]\)[^;]*/g) || [];

        if (profileQueries.length > 0) {
            queryPatterns.profiles.push({
                file,
                count: profileQueries.length,
                samples: profileQueries.slice(0, 2)
            });
        }

        if (kioskQueries.length > 0) {
            queryPatterns.kiosk_users.push({
                file,
                count: kioskQueries.length,
                samples: kioskQueries.slice(0, 2)
            });
        }

        if (inviteQueries.length > 0) {
            queryPatterns.site_invites.push({
                file,
                count: inviteQueries.length,
                samples: inviteQueries.slice(0, 2)
            });
        }
    }

    console.log('📊 QUERY ANALYSIS RESULTS:');
    console.log('=========================\n');

    console.log(`📋 PROFILES TABLE (${queryPatterns.profiles.length} files):`);
    queryPatterns.profiles.forEach(p => {
        console.log(`  ${p.file}: ${p.count} queries`);
    });

    console.log(`\n📋 KIOSK_USERS TABLE (${queryPatterns.kiosk_users.length} files):`);
    queryPatterns.kiosk_users.forEach(p => {
        console.log(`  ${p.file}: ${p.count} queries`);
    });

    console.log(`\n📋 SITE_INVITES TABLE (${queryPatterns.site_invites.length} files):`);
    queryPatterns.site_invites.forEach(p => {
        console.log(`  ${p.file}: ${p.count} queries`);
    });

    // Create mapping document
    console.log('\n\n📝 QUERY MAPPING GUIDE:');
    console.log('======================\n');

    const mappings = [
        {
            old: "supabase.from('profiles').select('*').eq('user_id', userId)",
            new: "supabase.from('master_users').select('*').eq('auth_user_id', userId)"
        },
        {
            old: "supabase.from('profiles').select('role, full_name').eq('user_id', userId)",
            new: "supabase.from('master_users').select('access_type, full_name').eq('auth_user_id', userId)"
        },
        {
            old: "supabase.from('kiosk_users').select('*').eq('site_id', siteId)",
            new: "supabase.from('master_users').select('*').eq('site_id', siteId).not('kiosk_user_id', 'is', null)"
        },
        {
            old: "supabase.from('site_invites').select('*').eq('status', 'pending')",
            new: "supabase.from('master_users').select('*').eq('invite_status', 'pending')"
        },
        {
            old: "profile.role === 'admin'",
            new: "user.access_type === 'admin'"
        },
        {
            old: "invite.status === 'accepted'",
            new: "user.invite_status === 'accepted' || user.invite_status === 'active'"
        }
    ];

    console.log('Common query transformations:');
    mappings.forEach((m, i) => {
        console.log(`\n${i + 1}. OLD: ${m.old}`);
        console.log(`   NEW: ${m.new}`);
    });

    // Save analysis results
    const analysisReport = {
        timestamp: new Date().toISOString(),
        filesAnalyzed: htmlFiles.length,
        queryPatterns,
        mappings,
        filesToUpdate: [
            ...queryPatterns.profiles.map(p => p.file),
            ...queryPatterns.kiosk_users.map(p => p.file),
            ...queryPatterns.site_invites.map(p => p.file)
        ].filter((v, i, a) => a.indexOf(v) === i) // unique files
    };

    await fs.writeFile('query_analysis_report.json', JSON.stringify(analysisReport, null, 2));
    console.log('\n📄 Analysis report saved to: query_analysis_report.json');

    return analysisReport;
}

// Run the analysis
analyzeHTMLQueries()
    .then(report => {
        console.log(`\n✅ Analysis complete!`);
        console.log(`📊 Total files to update: ${report.filesToUpdate.length}`);
    })
    .catch(console.error);