// Comprehensive investigation of user management across the CheckLoop project
import fetch from 'node-fetch';

const SUPABASE_URL = 'https://unveoqnlqnobufhublyw.supabase.co';
const SERVICE_ROLE_KEY = (typeof process !== 'undefined' && process.env?.SUPABASE_SERVICE_ROLE_KEY) || '';
if (!SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY not set in environment');
}

async function investigateUserTables() {
    console.log('🔍 COMPREHENSIVE USER MANAGEMENT INVESTIGATION');
    console.log('=' .repeat(60));
    
    // 1. Discover all user-related tables
    console.log('\n📊 1. USER-RELATED TABLES DISCOVERY\n');
    
    const userTables = [
        'profiles',
        'kiosk_users', 
        'staff_app_welcome',
        'site_invites',
        '1_staff_holiday_profiles',
        '2_staff_entitlements',
        '3_staff_working_patterns',
        'user_sessions',
        'user_preferences'
    ];
    
    const tableInfo = {};
    
    for (const tableName of userTables) {
        try {
            console.log(`\n🔍 Examining table: ${tableName}`);
            
            // Get table data
            const response = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}?limit=3`, {
                headers: {
                    'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
                    'apikey': SERVICE_ROLE_KEY
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                const count = data.length;
                
                if (count > 0) {
                    const columns = Object.keys(data[0]);
                    const userColumns = columns.filter(col => 
                        col.includes('user') || col.includes('id') || col.includes('email') || col.includes('name')
                    );
                    
                    tableInfo[tableName] = {
                        exists: true,
                        count: count,
                        allColumns: columns,
                        userColumns: userColumns,
                        sample: data[0]
                    };
                    
                    console.log(`   ✅ EXISTS - ${count} records`);
                    console.log(`   🔑 User-related columns: ${userColumns.join(', ')}`);
                    
                    if (columns.includes('user_id')) {
                        const userIdSample = data.filter(r => r.user_id).slice(0, 2);
                        if (userIdSample.length > 0) {
                            console.log(`   📋 Sample user_id values: ${userIdSample.map(r => r.user_id).join(', ')}`);
                        }
                    }
                } else {
                    tableInfo[tableName] = {
                        exists: true,
                        count: 0,
                        allColumns: [],
                        userColumns: [],
                        sample: null
                    };
                    console.log(`   ✅ EXISTS - EMPTY`);
                }
            } else {
                tableInfo[tableName] = {
                    exists: false,
                    error: await response.text()
                };
                console.log(`   ❌ DOES NOT EXIST`);
            }
        } catch (error) {
            tableInfo[tableName] = {
                exists: false,
                error: error.message
            };
            console.log(`   ❌ ERROR: ${error.message}`);
        }
    }
    
    // 2. Analyze relationships between tables
    console.log('\n\n📊 2. TABLE RELATIONSHIPS ANALYSIS\n');
    
    const existingTables = Object.keys(tableInfo).filter(t => tableInfo[t].exists);
    
    for (const tableName of existingTables) {
        const info = tableInfo[tableName];
        if (info.count > 0) {
            console.log(`\n🔍 ${tableName.toUpperCase()}:`);
            console.log(`   Records: ${info.count}`);
            console.log(`   All columns: ${info.allColumns.join(', ')}`);
            
            // Check for common linking columns
            const linkingColumns = info.allColumns.filter(col => 
                col === 'user_id' || col === 'id' || col === 'email' || col === 'staff_id' || col === 'kiosk_user_id'
            );
            console.log(`   🔗 Linking columns: ${linkingColumns.join(', ')}`);
            
            // Show sample data structure
            if (info.sample) {
                console.log(`   📋 Sample record keys: ${Object.keys(info.sample).join(', ')}`);
            }
        }
    }
    
    return tableInfo;
}

async function analyzeFileUsage() {
    console.log('\n\n📊 3. FILE USAGE ANALYSIS\n');
    
    // This would normally require file system access, but I'll provide the structure
    const fileAnalysis = {
        note: "File analysis would require reading all HTML/JS files to trace table usage patterns",
        keyFiles: [
            "staff.html - Main staff dashboard",
            "admin-dashboard.html - Admin interface", 
            "my-holidays.html - Holiday management",
            "staff-welcome.html - Onboarding",
            "user-utils.js - Core user utilities",
            "staff-common.js - Staff authentication",
            "entitlement-card-layout.js - Holiday entitlements"
        ]
    };
    
    console.log("📝 Key files that likely manage user data:");
    fileAnalysis.keyFiles.forEach(file => console.log(`   • ${file}`));
    
    return fileAnalysis;
}

async function generateUserFlowAnalysis(tableInfo) {
    console.log('\n\n📊 4. USER FLOW ANALYSIS\n');
    
    console.log("Based on table structure, here's the likely user flow:\n");
    
    // Auth.users (Supabase built-in)
    console.log("🔐 AUTHENTICATION LAYER:");
    console.log("   • auth.users - Supabase built-in authentication");
    console.log("   • Contains: id (UUID), email, raw_user_meta_data");
    
    // Site invites
    if (tableInfo.site_invites?.exists) {
        console.log("\n📧 INVITATION SYSTEM:");
        console.log("   • site_invites - Manages user invitations");
        if (tableInfo.site_invites.userColumns.length > 0) {
            console.log(`   • Key columns: ${tableInfo.site_invites.userColumns.join(', ')}`);
        }
    }
    
    // Profiles
    if (tableInfo.profiles?.exists) {
        console.log("\n👤 PROFILE MANAGEMENT:");
        console.log("   • profiles - Core user profile data");
        if (tableInfo.profiles.userColumns.length > 0) {
            console.log(`   • Key columns: ${tableInfo.profiles.userColumns.join(', ')}`);
        }
        console.log(`   • Records: ${tableInfo.profiles.count}`);
    }
    
    // Staff welcome
    if (tableInfo.staff_app_welcome?.exists) {
        console.log("\n🎯 ONBOARDING:");
        console.log("   • staff_app_welcome - Onboarding completion data");
        if (tableInfo.staff_app_welcome.userColumns.length > 0) {
            console.log(`   • Key columns: ${tableInfo.staff_app_welcome.userColumns.join(', ')}`);
        }
        console.log(`   • Records: ${tableInfo.staff_app_welcome.count}`);
    }
    
    // Kiosk users
    if (tableInfo.kiosk_users?.exists) {
        console.log("\n🏢 KIOSK/OPERATIONAL DATA:");
        console.log("   • kiosk_users - Staff operational data");
        if (tableInfo.kiosk_users.userColumns.length > 0) {
            console.log(`   • Key columns: ${tableInfo.kiosk_users.userColumns.join(', ')}`);
        }
        console.log(`   • Records: ${tableInfo.kiosk_users.count}`);
    }
    
    // Holiday system
    const holidayTables = ['1_staff_holiday_profiles', '2_staff_entitlements', '3_staff_working_patterns'];
    const existingHolidayTables = holidayTables.filter(t => tableInfo[t]?.exists);
    
    if (existingHolidayTables.length > 0) {
        console.log("\n🏖️ HOLIDAY MANAGEMENT SYSTEM:");
        existingHolidayTables.forEach(table => {
            console.log(`   • ${table} - ${tableInfo[table].count} records`);
            if (tableInfo[table].userColumns.length > 0) {
                console.log(`     Columns: ${tableInfo[table].userColumns.join(', ')}`);
            }
        });
    }
}

async function identifyInconsistencies(tableInfo) {
    console.log('\n\n⚠️ 5. POTENTIAL INCONSISTENCIES\n');
    
    const issues = [];
    
    // Check for missing user_id links
    Object.keys(tableInfo).forEach(tableName => {
        const table = tableInfo[tableName];
        if (table.exists && table.count > 0) {
            const hasUserId = table.allColumns.includes('user_id');
            const hasUserColumns = table.userColumns.length > 0;
            
            if (hasUserColumns && !hasUserId && tableName !== 'profiles') {
                issues.push(`${tableName} has user data but no user_id column for linking`);
            }
        }
    });
    
    // Check for empty critical tables
    const criticalTables = ['profiles', 'kiosk_users'];
    criticalTables.forEach(tableName => {
        const table = tableInfo[tableName];
        if (table?.exists && table.count === 0) {
            issues.push(`${tableName} exists but is empty - may cause authentication issues`);
        }
    });
    
    if (issues.length > 0) {
        console.log("🚨 ISSUES FOUND:");
        issues.forEach(issue => console.log(`   • ${issue}`));
    } else {
        console.log("✅ No obvious structural issues detected");
    }
    
    return issues;
}

// Main execution
async function runFullInvestigation() {
    try {
        const tableInfo = await investigateUserTables();
        const fileAnalysis = await analyzeFileUsage();
        await generateUserFlowAnalysis(tableInfo);
        const issues = await identifyInconsistencies(tableInfo);
        
        // Summary
        console.log('\n\n📊 6. SUMMARY\n');
        const existingTables = Object.keys(tableInfo).filter(t => tableInfo[t].exists);
        console.log(`✅ Found ${existingTables.length} user-related tables:`);
        existingTables.forEach(table => {
            const count = tableInfo[table].count;
            console.log(`   • ${table}: ${count} records`);
        });
        
        if (issues.length > 0) {
            console.log(`\n⚠️ ${issues.length} potential issues identified`);
        }
        
        console.log('\n🎯 NEXT STEPS:');
        console.log('   1. Review file usage patterns to understand which pages use which tables');
        console.log('   2. Identify the primary user identification strategy');  
        console.log('   3. Standardize user linking across all tables');
        console.log('   4. Address any inconsistencies found');
        
    } catch (error) {
        console.error('❌ Investigation failed:', error);
    }
}

// Run the investigation
runFullInvestigation().catch(console.error);