#!/usr/bin/env python3
import os
import re

# List of main HTML files to update
html_files = [
    'index.html',
    'staff.html',
    'staff-welcome.html',
    'admin-dashboard.html',
    'admin-dashboard 14th.html',
    'admin-dashboard 4PM.html',
    'admin-dashboard Working Login.html',
    'staff-training.html',
    'staff-quiz.html',
    'staff-calendar.html',
    'my-holidays.html',
    'achievements.html',
    'staff_pro.html',
    'staff_pro_fixed.html',
    'indexIpad.html',
    'indexIpad_fixed.html',
    'home.html',
    'complaints.html',
    'admin-login.html',
    'admin-check.html',
    'staff-meetings.html',
    'staff-meetings 5.html',
    'check-user-data.html',
    'signup.html'
]

debug_script = '    <script src="supabase-debug.js"></script>\n'

for filename in html_files:
    filepath = f'/Users/benhoward/Desktop/CheckLoop/CheckLoops/{filename}'
    if not os.path.exists(filepath):
        print(f"Skipping {filename} - file not found")
        continue

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Check if debug script is already added
    if 'supabase-debug.js' in content:
        print(f"Skipping {filename} - debug script already added")
        continue

    # Find the closing body tag and add the script before it
    if '</body>' in content:
        # Add the debug script just before closing body tag
        content = content.replace('</body>', f'{debug_script}</body>')

        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Added debug script to {filename}")
    else:
        print(f"Warning: {filename} has no closing body tag")

print("\nDebug script addition complete!")