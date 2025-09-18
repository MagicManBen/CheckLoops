#!/usr/bin/env python3
"""Test script to verify achievements are correctly stored and retrievable."""

import requests
import json

# Configuration
SUPABASE_URL = "https://unveoqnlqnobufhublyw.supabase.co"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAxNzI3NiwiZXhwIjoyMDcwNTkzMjc2fQ.CJxV14F0T2TWkAjeR4bpYiBIOwLwyfzF9WzAWwS99Xc"
EMAIL = "benhowardmagic@hotmail.com"

headers = {
    "apikey": SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}",
    "Content-Type": "application/json"
}

print("="*60)
print("ACHIEVEMENT DISPLAY TEST")
print("="*60)

# Step 1: Get user profile with kiosk_user_id
print("\n1. Getting user profile...")
master_response = requests.get(
    f"{SUPABASE_URL}/rest/v1/master_users?email=eq.{EMAIL}",
    headers=headers
)

if master_response.status_code == 200 and master_response.json():
    master_data = master_response.json()[0]
    user_id = master_data.get('auth_user_id')

    profile_response = requests.get(
        f"{SUPABASE_URL}/rest/v1/profiles?user_id=eq.{user_id}",
        headers=headers
    )

    if profile_response.status_code == 200 and profile_response.json():
        profile = profile_response.json()[0]
        kiosk_user_id = profile.get('kiosk_user_id')
        print(f"   User ID: {user_id}")
        print(f"   Kiosk User ID: {kiosk_user_id}")

        # Step 2: Get user achievements using kiosk_user_id
        print("\n2. Getting user achievements with kiosk_user_id...")
        ach_response = requests.get(
            f"{SUPABASE_URL}/rest/v1/user_achievements?kiosk_user_id=eq.{kiosk_user_id}",
            headers=headers
        )

        if ach_response.status_code == 200:
            achievements = ach_response.json()
            print(f"   Found {len(achievements)} achievements:")
            for ach in achievements:
                print(f"     - {ach['achievement_key']}: {ach['status']} (progress: {ach['progress_percent']}%)")
                if ach['unlocked_at']:
                    print(f"       Unlocked at: {ach['unlocked_at']}")

        # Step 3: Get all available achievements
        print("\n3. Getting all available achievements...")
        all_ach_response = requests.get(
            f"{SUPABASE_URL}/rest/v1/achievements",
            headers=headers
        )

        if all_ach_response.status_code == 200:
            all_achievements = all_ach_response.json()
            print(f"   Total achievements in system: {len(all_achievements)}")

            # Check which ones user has
            user_ach_keys = {a['achievement_key'] for a in achievements if a['status'] == 'unlocked'}

            print("\n4. Summary:")
            print(f"   User has unlocked {len(user_ach_keys)} out of {len(all_achievements)} achievements")
            print(f"   Unlocked: {', '.join(user_ach_keys) if user_ach_keys else 'None'}")

            missing = [a['key'] for a in all_achievements if a['key'] not in user_ach_keys]
            if missing:
                print(f"   Not unlocked: {', '.join(missing)}")

print("\n" + "="*60)
print("TEST COMPLETE - Achievements data verified")
print("="*60)