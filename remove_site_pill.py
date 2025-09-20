#!/usr/bin/env python3
import os
import re
import glob

# Pattern to match site-pill divs with different possible attributes
SITE_PILL_PATTERN = r'<div[^>]*class="pill"[^>]*id="site-pill"[^>]*>.*?<\/div>|<div[^>]*id="site-pill"[^>]*class="pill"[^>]*>.*?<\/div>'

# Path to the directory containing HTML files
directory = os.path.dirname(os.path.abspath(__file__))

# Find all HTML files
html_files = glob.glob(os.path.join(directory, "*.html"))
print(f"Found {len(html_files)} HTML files to process")

# Process each HTML file
for html_file in html_files:
    # Skip backup files
    if '.backup_' in html_file or '.colfix_' in html_file or '.cleanup_' in html_file or '.role_backup' in html_file:
        print(f"Skipping backup file: {os.path.basename(html_file)}")
        continue
        
    with open(html_file, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # Count original occurrences of site-pill
    original_count = len(re.findall(SITE_PILL_PATTERN, content))
    
    if original_count == 0:
        print(f"No site-pill found in {os.path.basename(html_file)}")
        continue
    
    # Replace the site-pill divs
    modified_content = re.sub(SITE_PILL_PATTERN, '', content)
    
    # Verify the change worked
    new_count = len(re.findall(SITE_PILL_PATTERN, modified_content))
    
    if new_count == 0 and original_count > 0:
        # Write the modified content back to the file
        with open(html_file, 'w', encoding='utf-8') as file:
            file.write(modified_content)
        print(f"Removed {original_count} site-pill element(s) from {os.path.basename(html_file)}")
    else:
        print(f"Failed to remove site-pill from {os.path.basename(html_file)}")

print("Site pill removal complete!")