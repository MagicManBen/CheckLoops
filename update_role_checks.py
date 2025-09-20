#!/usr/bin/env python3
import os
import re

# List of files that need updating
files_to_update = [
    'staff.html',
    'staff-meetings.html',
    'admin-login.html',
    'admin-dashboard.html',
    'admin-dashboard 14th.html',
    'admin-dashboard 4PM.html',
    'admin-dashboard Working Login.html',
    'auth-core.js',
    'staff-quiz.html',
    'staff-training.html',
    'staff-calendar.html',
    'my-holidays.html',
    'achievements.html',
    'staff-welcome.html',
    'indexIpad.html',
    'indexIpad_fixed.html',
    'staff_pro.html',
    'staff_pro_fixed.html'
]

# Define replacement patterns
replacements = [
    # Pattern 1: Replace profileRow.role with profileRow.access_type || profileRow.role
    (r'(profileRow)\.role(?!_)',
     r'\1.access_type || \1.role'),

    # Pattern 2: Replace profile.role with profile.access_type || profile.role
    (r'(profile)\.role(?!_)',
     r'\1.access_type || \1.role'),

    # Pattern 3: For role checks like role.toLowerCase() === 'admin'
    (r'const\s+role\s*=\s*([^;]+?)(?=;)',
     r'const role = (\1?.access_type || \1)'),

    # Pattern 4: Update specific role checks
    (r"role && role\.toLowerCase\(\) === 'admin'",
     r"(role || access_type) && (role || access_type).toLowerCase() === 'admin'"),

    # Pattern 5: Update role variable definitions
    (r'const role = profileRow\?\.(role|access_type)',
     r'const role = profileRow?.access_type || profileRow?.role'),

    # Pattern 6: For auth checks - update to check access_type first
    (r"profile\?\.(role|access_type) && \['admin', 'owner'\]\.includes\(profile\.(role|access_type)\.toLowerCase\(\)\)",
     r"(profile?.access_type || profile?.role) && ['admin', 'owner'].includes((profile?.access_type || profile?.role).toLowerCase())")
]

# Special replacements for specific patterns
special_replacements = [
    # Update setTopbar calls to include access_type
    (r'setTopbar\(\{([^}]+)\}\)',
     lambda m: f'setTopbar({{{m.group(1)}, access_type: profileRow?.access_type || profileRow?.role}})' if 'access_type' not in m.group(1) else m.group(0)),

    # Update role extraction from profileRow
    (r'const\s+(\w+Role)\s*=\s*profileRow\?\.(role|access_type)',
     r'const \1 = profileRow?.access_type || profileRow?.role')
]

def update_file(filepath):
    """Update a single file with all replacements."""
    if not os.path.exists(filepath):
        print(f"Skipping {filepath} - file not found")
        return False

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content
    changes_made = []

    # Apply regular replacements
    for pattern, replacement in replacements:
        matches = re.findall(pattern, content)
        if matches:
            # Count the replacements before making them
            count = len(matches)
            content = re.sub(pattern, replacement, content)
            changes_made.append(f"  - Replaced {count} instance(s) of pattern: {pattern[:50]}...")

    # Apply special replacements
    for pattern, replacement in special_replacements:
        if callable(replacement):
            # Lambda replacement
            matches = re.findall(pattern, content)
            if matches:
                count = len(matches)
                content = re.sub(pattern, replacement, content)
                changes_made.append(f"  - Applied special replacement for: {pattern[:50]}...")
        else:
            matches = re.findall(pattern, content)
            if matches:
                count = len(matches)
                content = re.sub(pattern, replacement, content)
                changes_made.append(f"  - Replaced {count} instance(s) of pattern: {pattern[:50]}...")

    # Additional manual fixes for specific cases
    # Fix admin role checks
    content = re.sub(
        r"const\s+adminRole\s*=\s*\([^)]*\)\.toLowerCase\(\);",
        r"const adminRole = (profileRow?.access_type || profileRow?.role || session.user?.raw_user_meta_data?.role || '').toLowerCase();",
        content
    )

    # Fix role extraction from session
    content = re.sub(
        r"const\s+role\s*=\s*profileRow\?\.(role|access_type)\s*\|\|\s*user\?\.(raw_user_meta_data|user_metadata)\?\.(role|access_type)",
        r"const role = profileRow?.access_type || profileRow?.role || user?.raw_user_meta_data?.role || user?.user_metadata?.role",
        content
    )

    # Write back if changes were made
    if content != original_content:
        # Create backup
        backup_path = f"{filepath}.role_backup"
        with open(backup_path, 'w', encoding='utf-8') as f:
            f.write(original_content)

        # Write updated content
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)

        print(f"Updated {os.path.basename(filepath)}:")
        for change in changes_made:
            print(change)
        return True
    else:
        print(f"No changes needed in {os.path.basename(filepath)}")
        return False

# Process all files
updated_count = 0
for filename in files_to_update:
    filepath = f'/Users/benhoward/Desktop/CheckLoop/CheckLoops/{filename}'
    if update_file(filepath):
        updated_count += 1

print(f"\n✅ Updated {updated_count} files to prioritize access_type over role")