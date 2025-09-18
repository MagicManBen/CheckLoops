#!/bin/bash
# Stream Deck Script: Supabase Auto Export
# This script starts the auto-export in a new terminal window

# Navigate to your project directory
cd "/Users/benhoward/Desktop/CheckLoop/CheckLoops"

# Open a new terminal window with the auto-export running
osascript -e 'tell application "Terminal"
    do script "cd /Users/benhoward/Desktop/CheckLoop/CheckLoops && npm run export:auto"
    activate
end tell'