#!/bin/bash
# Stream Deck Script: Single Supabase Export
# This script runs the export once and auto-closes after 3 seconds

# Navigate to your project directory
cd "/Users/benhoward/Desktop/CheckLoop/CheckLoops"

# Run the export and auto-close the terminal
osascript -e 'tell application "Terminal"
    set newTab to do script "cd /Users/benhoward/Desktop/CheckLoop/CheckLoops && echo \"🚀 Running Supabase Export...\" && npm run export:supabase:pretty && echo \"✅ Export complete! Closing in 3 seconds...\" && sleep 3 && exit"
    activate
end tell'