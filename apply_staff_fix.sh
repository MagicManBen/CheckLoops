#!/bin/bash
# Script to include the staff-profile-fix.js in all staff HTML pages

# Array of staff pages to update
STAFF_PAGES=(
  "staff.html"
  "staff-training.html"
  "staff-quiz.html"
  "staff-meetings.html"
  "staff-scans.html"
  "staff-welcome.html"
  "my-holidays.html"
  "achievements.html"
)

# The line to add before the closing </body> tag
FIX_SCRIPT='<!-- Staff Profile Fix -->\n<script src="staff-profile-fix.js"></script>'

for page in "${STAFF_PAGES[@]}"; do
  if [ -f "$page" ]; then
    echo "Processing $page..."
    
    # Check if the fix is already applied
    if grep -q "staff-profile-fix.js" "$page"; then
      echo "  Fix already applied to $page"
    else
      # Add the fix script before the closing body tag
      sed -i '' "s|</body>|${FIX_SCRIPT}\n</body>|" "$page"
      echo "  Fix applied to $page"
    fi
  else
    echo "Warning: $page not found"
  fi
done

echo "Fix application complete"