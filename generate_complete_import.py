import pandas as pd
import json
from datetime import datetime

# Read the Excel file
excel_file = 'HolidayTransfer.xlsx'
df = pd.read_excel(excel_file)

# Separate the data
holiday_requests = df[['Date', 'StaffName', 'Value']].dropna(subset=['Date'])
staff_info = df[['Name', 'Role', 'Entitlement', 'Dr Monday Hours', 'Dr Tuesday Hours', 
                  'Dr Wednesday Hours', 'Dr Thursday Hours', 'Dr Friday Hours',
                  'Staff Monday Hours (HH:MM)', 'Staff Tuesday Hours (HH:MM)', 
                  'Staff Wednesday Hours (HH:MM)', 'Staff Thursday Hours (HH:MM)', 
                  'Staff Friday Hours (HH:MM)']].dropna(subset=['Name'])

# Filter valid staff
valid_roles = ['Nurse', 'GP', 'Manager', 'Admin', 'Reception', 'Pharmacist', 
                'Health Care Assistant', 'GP Assistant']
staff_info = staff_info[staff_info['Role'].isin(valid_roles)]

# Build profiles
profiles = []
profile_map = {}

for _, row in staff_info.iterrows():
    name = row['Name']
    role = row['Role']
    
    # Check if GP
    is_gp = role == 'GP' or any([
        pd.notna(row[f'Dr {day} Hours']) for day in ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    ])
    
    if name not in profile_map:
        profile_map[name] = True
        profiles.append({
            'full_name': name,
            'role': role,
            'is_gp': is_gp
        })

# Add staff from holiday requests not in staff_info
for name in holiday_requests['StaffName'].unique():
    if name not in profile_map:
        profile_map[name] = True
        profiles.append({
            'full_name': name,
            'role': 'Staff',
            'is_gp': False
        })

# Build working patterns
working_patterns = []
days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

for _, row in staff_info.iterrows():
    name = row['Name']
    
    # Check if GP
    is_gp = row['Role'] == 'GP' or any([
        pd.notna(row[f'Dr {day} Hours']) for day in days
    ])
    
    if is_gp:
        # GP sessions
        for day in days:
            dr_col = f'Dr {day} Hours'
            if pd.notna(row[dr_col]):
                try:
                    sessions = int(row[dr_col]) if isinstance(row[dr_col], (int, float)) else 1
                    working_patterns.append({
                        'staff_name': name,
                        'day': day,
                        'sessions': sessions
                    })
                except:
                    pass
    else:
        # Regular staff hours
        for day in days:
            staff_col = f'Staff {day} Hours (HH:MM)'
            if pd.notna(row[staff_col]):
                try:
                    time_val = row[staff_col]
                    if hasattr(time_val, 'hour'):
                        hours_str = f"{time_val.hour:02d}:{time_val.minute:02d}:00"
                        working_patterns.append({
                            'staff_name': name,
                            'day': day,
                            'hours': hours_str
                        })
                except:
                    pass

# Build entitlements
entitlements = []

for _, row in staff_info.iterrows():
    name = row['Name']
    entitlement = row['Entitlement']
    
    if pd.notna(entitlement):
        is_gp = row['Role'] == 'GP' or any([
            pd.notna(row[f'Dr {day} Hours']) for day in days
        ])
        
        if is_gp:
            # GP sessions
            try:
                sessions = int(entitlement) if isinstance(entitlement, (int, float)) else 44
                entitlements.append({
                    'staff_name': name,
                    'year': 2025,
                    'annual_sessions': sessions,
                    'entitlement_sessions': sessions
                })
            except:
                pass
        else:
            # Regular staff hours
            try:
                if isinstance(entitlement, pd.Timedelta):
                    total_seconds = entitlement.total_seconds()
                    hours = int(total_seconds // 3600)
                    minutes = int((total_seconds % 3600) // 60)
                    entitlements.append({
                        'staff_name': name,
                        'year': 2025,
                        'annual_hours': hours + minutes/60,
                        'entitlement_hours': f"{hours}:{minutes:02d}:00"
                    })
            except:
                pass

# Build holiday bookings
bookings = []

# Create a map to check if someone is a GP
gp_names = set()
for _, row in staff_info.iterrows():
    if row['Role'] == 'GP' or any([pd.notna(row[f'Dr {day} Hours']) for day in days]):
        gp_names.add(row['Name'])

for _, row in holiday_requests.iterrows():
    name = row['StaffName']
    date = pd.to_datetime(row['Date']).strftime('%Y-%m-%d')
    value = row['Value']
    
    booking = {
        'staff_name': name,
        'date': date
    }
    
    if name in gp_names:
        # GP - sessions
        try:
            sessions = int(value) if isinstance(value, (int, float)) else 1
            booking['sessions'] = sessions
        except:
            booking['sessions'] = 1
    else:
        # Regular staff - hours
        try:
            if hasattr(value, 'hour'):
                booking['hours'] = f"{value.hour:02d}:{value.minute:02d}:00"
            elif isinstance(value, str) and ':' in value:
                booking['hours'] = value
            else:
                # Default to 8 hours if can't parse
                booking['hours'] = "08:00:00"
        except:
            booking['hours'] = "08:00:00"
    
    bookings.append(booking)

# Generate the complete import HTML
html_content = f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Complete Holiday Data Import</title>
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <style>
        body {{
            font-family: Arial, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }}
        .container {{
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }}
        h1 {{
            color: #333;
            border-bottom: 2px solid #007bff;
            padding-bottom: 10px;
        }}
        .status {{
            margin: 20px 0;
            padding: 15px;
            border-radius: 5px;
            background: #f8f9fa;
            border-left: 4px solid #007bff;
        }}
        .success {{
            background: #d4edda;
            border-color: #28a745;
            color: #155724;
        }}
        .error {{
            background: #f8d7da;
            border-color: #dc3545;
            color: #721c24;
        }}
        button {{
            background: #007bff;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            margin: 10px 5px;
        }}
        button:hover {{
            background: #0056b3;
        }}
        button:disabled {{
            background: #cccccc;
            cursor: not-allowed;
        }}
        .log {{
            background: #f8f9fa;
            padding: 10px;
            border-radius: 5px;
            margin: 10px 0;
            max-height: 400px;
            overflow-y: auto;
            font-family: monospace;
            font-size: 12px;
        }}
        .stats {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }}
        .stat-card {{
            background: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            text-align: center;
        }}
        .stat-value {{
            font-size: 24px;
            font-weight: bold;
            color: #007bff;
        }}
        .stat-label {{
            color: #666;
            font-size: 14px;
            margin-top: 5px;
        }}
    </style>
</head>
<body>
    <div class="container">
        <h1>Complete Holiday Data Import to Supabase</h1>
        
        <div class="status" id="status">
            Ready to import {len(profiles)} staff profiles and {len(bookings)} holiday bookings
        </div>
        
        <div class="stats">
            <div class="stat-card">
                <div class="stat-value" id="profileCount">0</div>
                <div class="stat-label">Staff Profiles</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" id="bookingCount">0</div>
                <div class="stat-label">Holiday Bookings</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" id="entitlementCount">0</div>
                <div class="stat-label">Entitlements</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" id="linkedCount">0</div>
                <div class="stat-label">Linked Users</div>
            </div>
        </div>
        
        <div>
            <button onclick="setupTables()" id="setupBtn">1. Setup Tables</button>
            <button onclick="runImport()" id="importBtn">2. Import All Data</button>
            <button onclick="verifyData()" id="verifyBtn">3. Verify Data</button>
            <button onclick="clearData()" id="clearBtn">Clear All Data</button>
        </div>
        
        <div class="log" id="log"></div>
    </div>

    <script>
        // Supabase credentials
        const SUPABASE_URL = 'https://ntufkxnyogbzlripswxs.supabase.co';
        const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50dWZreG55b2diemxyaXBzd3hzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjI1MDQzMzQsImV4cCI6MjAzODA4MDMzNH0.7-gH9mPEMGxk3zrKvl5lLi28AvWJBCCMmZi6OF5HWkE';
        
        const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        
        // Complete data from Excel
        const holidayData = {{
            profiles: {json.dumps(profiles, indent=12)},
            workingPatterns: {json.dumps(working_patterns, indent=12)},
            entitlements: {json.dumps(entitlements, indent=12)},
            bookings: {json.dumps(bookings, indent=12)}
        }};
        
        function log(message, type = 'info') {{
            const logDiv = document.getElementById('log');
            const time = new Date().toLocaleTimeString();
            const color = type === 'error' ? 'red' : type === 'success' ? 'green' : 'black';
            logDiv.innerHTML += `<div style="color: ${{color}}"">[${{time}}] ${{message}}</div>`;
            logDiv.scrollTop = logDiv.scrollHeight;
        }}
        
        function updateStatus(message, type = 'info') {{
            const statusDiv = document.getElementById('status');
            statusDiv.textContent = message;
            statusDiv.className = 'status ' + type;
        }}
        
        async function setupTables() {{
            log('Setting up database tables...');
            updateStatus('Creating tables...', 'info');
            
            // Tables are already created in Supabase
            // This function would normally create them
            log('Tables already exist in Supabase', 'success');
            updateStatus('Tables ready', 'success');
        }}
        
        async function clearData() {{
            if (!confirm('Clear all holiday data? This cannot be undone.')) {{
                return;
            }}
            
            log('Clearing existing data...');
            
            try {{
                await supabase.from('holiday_bookings').delete().neq('id', 0);
                await supabase.from('staff_working_patterns').delete().neq('id', 0);
                await supabase.from('holiday_entitlements').delete().neq('id', 0);
                await supabase.from('staff_profile_user_links').delete().neq('id', 0);
                await supabase.from('staff_holiday_profiles').delete().neq('id', 0);
                
                log('All data cleared', 'success');
                updateStatus('Data cleared', 'success');
                await updateStats();
            }} catch (error) {{
                log('Error: ' + error.message, 'error');
            }}
        }}
        
        async function runImport() {{
            const btn = document.getElementById('importBtn');
            btn.disabled = true;
            
            updateStatus('Starting import...', 'info');
            log('Import started');
            
            try {{
                // Step 1: Insert profiles
                log(`Creating ${{holidayData.profiles.length}} staff profiles...`);
                const {{ data: profiles, error: profileError }} = await supabase
                    .from('staff_holiday_profiles')
                    .upsert(holidayData.profiles, {{ onConflict: 'full_name' }})
                    .select();
                
                if (profileError) throw profileError;
                log(`Created ${{profiles.length}} profiles`, 'success');
                
                // Get profile IDs
                const {{ data: allProfiles }} = await supabase
                    .from('staff_holiday_profiles')
                    .select('id, full_name');
                
                const profileMap = {{}};
                allProfiles.forEach(p => {{
                    profileMap[p.full_name] = p.id;
                }});
                
                // Step 2: Insert working patterns
                log('Creating working patterns...');
                const patternsToInsert = holidayData.workingPatterns.map(wp => ({{
                    staff_profile_id: profileMap[wp.staff_name],
                    day_of_week: wp.day,
                    hours_worked: wp.hours || null,
                    sessions_worked: wp.sessions || null
                }})).filter(p => p.staff_profile_id);
                
                if (patternsToInsert.length > 0) {{
                    await supabase.from('staff_working_patterns').upsert(patternsToInsert);
                    log(`Created ${{patternsToInsert.length}} working patterns`, 'success');
                }}
                
                // Step 3: Insert entitlements
                log('Creating entitlements...');
                const entitlementsToInsert = holidayData.entitlements.map(e => ({{
                    staff_profile_id: profileMap[e.staff_name],
                    year: e.year,
                    annual_hours: e.annual_hours || null,
                    entitlement_hours: e.entitlement_hours || null,
                    annual_sessions: e.annual_sessions || null,
                    entitlement_sessions: e.entitlement_sessions || null
                }})).filter(e => e.staff_profile_id);
                
                if (entitlementsToInsert.length > 0) {{
                    await supabase.from('holiday_entitlements').upsert(entitlementsToInsert);
                    log(`Created ${{entitlementsToInsert.length}} entitlements`, 'success');
                }}
                
                // Step 4: Insert bookings
                log(`Importing ${{holidayData.bookings.length}} holiday bookings...`);
                const bookingsToInsert = holidayData.bookings.map(b => ({{
                    staff_profile_id: profileMap[b.staff_name],
                    booking_date: b.date,
                    hours_booked: b.hours || null,
                    sessions_booked: b.sessions || null,
                    booking_type: 'annual_leave',
                    imported_from_excel: true
                }})).filter(b => b.staff_profile_id);
                
                // Insert in batches
                for (let i = 0; i < bookingsToInsert.length; i += 50) {{
                    const batch = bookingsToInsert.slice(i, i + 50);
                    await supabase.from('holiday_bookings').insert(batch);
                    log(`Batch ${{Math.floor(i/50) + 1}}: ${{batch.length}} bookings`);
                }}
                
                log(`Total bookings imported: ${{bookingsToInsert.length}}`, 'success');
                
                // Step 5: Link existing users
                log('Linking user accounts...');
                
                // Link Ben Howard
                const {{ data: users }} = await supabase
                    .from('auth.users')
                    .select('id, email, raw_user_meta_data')
                    .or('email.eq.ben.howard@stoke.nhs.uk,email.eq.magic@hotmail.com');
                
                if (users && users.length > 0) {{
                    for (const user of users) {{
                        const fullName = user.email === 'ben.howard@stoke.nhs.uk' ? 'Ben Howard' : 
                                        user.raw_user_meta_data?.full_name;
                        
                        if (fullName && profileMap[fullName]) {{
                            await supabase.from('staff_profile_user_links').upsert({{
                                staff_profile_id: profileMap[fullName],
                                user_id: user.id
                            }});
                            log(`Linked ${{fullName}}`, 'success');
                        }}
                    }}
                }}
                
                updateStatus('Import completed successfully!', 'success');
                await updateStats();
                
            }} catch (error) {{
                log('Error: ' + error.message, 'error');
                updateStatus('Import failed', 'error');
            }}
            
            btn.disabled = false;
        }}
        
        async function verifyData() {{
            log('Verifying data...');
            
            const {{ data: profiles }} = await supabase.from('staff_holiday_profiles').select('*');
            const {{ data: bookings }} = await supabase.from('holiday_bookings').select('*');
            const {{ data: entitlements }} = await supabase.from('holiday_entitlements').select('*');
            const {{ data: links }} = await supabase.from('staff_profile_user_links').select('*');
            
            log(`Profiles: ${{profiles?.length || 0}}`, 'success');
            log(`Bookings: ${{bookings?.length || 0}}`, 'success');
            log(`Entitlements: ${{entitlements?.length || 0}}`, 'success');
            log(`Linked users: ${{links?.length || 0}}`, 'success');
            
            if (profiles && profiles.length > 0) {{
                log('Sample profiles:');
                profiles.slice(0, 5).forEach(p => {{
                    log(`  - ${{p.full_name}} (${{p.role}}, GP: ${{p.is_gp}})`);
                }});
            }}
            
            updateStatus('Verification complete', 'success');
            await updateStats();
        }}
        
        async function updateStats() {{
            const {{ data: profiles }} = await supabase.from('staff_holiday_profiles').select('id');
            const {{ data: bookings }} = await supabase.from('holiday_bookings').select('id');
            const {{ data: entitlements }} = await supabase.from('holiday_entitlements').select('id');
            const {{ data: links }} = await supabase.from('staff_profile_user_links').select('id');
            
            document.getElementById('profileCount').textContent = profiles?.length || 0;
            document.getElementById('bookingCount').textContent = bookings?.length || 0;
            document.getElementById('entitlementCount').textContent = entitlements?.length || 0;
            document.getElementById('linkedCount').textContent = links?.length || 0;
        }}
        
        // Initialize
        window.onload = async function() {{
            await updateStats();
            log('Ready to import data');
            log(`Total profiles to import: ${{holidayData.profiles.length}}`);
            log(`Total bookings to import: ${{holidayData.bookings.length}}`);
        }};
    </script>
</body>
</html>'''

# Write the complete import HTML
with open('complete_import.html', 'w') as f:
    f.write(html_content)

print(f"Complete import HTML generated: complete_import.html")
print(f"Total profiles: {len(profiles)}")
print(f"Total working patterns: {len(working_patterns)}")
print(f"Total entitlements: {len(entitlements)}")
print(f"Total bookings: {len(bookings)}")
print("\nOpen complete_import.html in a browser to import all data to Supabase")