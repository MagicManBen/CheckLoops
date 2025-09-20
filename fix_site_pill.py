#!/usr/bin/env python3
import os

# Find all HTML files
for root, dirs, files in os.walk('/Users/benhoward/Desktop/CheckLoop/CheckLoops'):
    for file in files:
        if file.endswith('.html'):
            filepath = os.path.join(root, file)
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()

                # Replace the pattern
                if 'id="site-pill">Site: —' in content:
                    content = content.replace('id="site-pill">Site: —', 'id="site-pill">—')
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(content)
                    print(f"Updated {os.path.basename(filepath)}")
            except:
                pass

print("Done!")