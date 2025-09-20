import re
import os
import glob

# Find all HTML and JS files
files = glob.glob('*.html') + glob.glob('*.js')

# Extract table names
tables = set()
pattern = r"\.from\(['\"]([^'\"]+)['\"]\)"

for file_path in files:
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            matches = re.findall(pattern, content)
            tables.update(matches)
    except:
        continue

# Sort and print
sorted_tables = sorted(tables)
print(f"Found {len(sorted_tables)} unique tables:")
for table in sorted_tables:
    print(f"  - {table}")