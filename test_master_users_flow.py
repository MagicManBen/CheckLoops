#!/usr/bin/env python3
"""Test the complete flow with master_users table."""

import requests
import json

# Configuration
SUPABASE_URL = "https://unveoqnlqnobufhublyw.supabase.co"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAxNzI3NiwiZXhwIjoyMDcwNTkzMjc2fQ.CJxV14F0T2TWkAjeR4bpYiBIOwLwyfzF9WzAWwS99Xc"

headers = {
    "apikey": SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}",
    "Content-Type": "application/json"
}

print("="*60)
print("TESTING MASTER_USERS FLOW")
print("="*60)

# Test user ID
USER_ID = "55f1b4e6-01f4-452d-8d6c-617fe7794873"  # benhowardmagic@hotmail.com

print(f"\nTesting for user_id: {USER_ID}")

# Step 1: Get master_users record
print("\n1. Fetching from master_users table:")
master_response = requests.get(
    f"{SUPABASE_URL}/rest/v1/master_users?auth_user_id=eq.{USER_ID}",
    headers=headers
)

if master_response.status_code == 200 and master_response.json():
    master = master_response.json()[0]
    print(f"   ✅ Found master_users record")
    print(f"   - full_name: {master.get('full_name')}")
    print(f"   - kiosk_user_id: {master.get('kiosk_user_id')}")
    print(f"   - access_type: {master.get('access_type')}")
    print(f"   - site_id: {master.get('site_id')}")
    print(f"   - onboarding_complete: {master.get('onboarding_complete')}")

    kiosk_user_id = master.get('kiosk_user_id')

    if kiosk_user_id:
        # Step 2: Get achievements using kiosk_user_id
        print(f"\n2. Fetching achievements for kiosk_user_id {kiosk_user_id}:")
        ach_response = requests.get(
            f"{SUPABASE_URL}/rest/v1/user_achievements?kiosk_user_id=eq.{kiosk_user_id}",
            headers=headers
        )

        if ach_response.status_code == 200:
            achievements = ach_response.json()
            print(f"   ✅ Found {len(achievements)} achievements")
            for ach in achievements:
                if ach['status'] == 'unlocked':
                    print(f"   - {ach['achievement_key']}: UNLOCKED ✅")
                else:
                    print(f"   - {ach['achievement_key']}: {ach['status']}")
        else:
            print(f"   ❌ Error fetching achievements: {ach_response.status_code}")
    else:
        print("\n   ⚠️  No kiosk_user_id found - cannot fetch achievements")

    # Step 3: Check profiles table for comparison
    print("\n3. Checking profiles table for comparison:")
    profile_response = requests.get(
        f"{SUPABASE_URL}/rest/v1/profiles?user_id=eq.{USER_ID}",
        headers=headers
    )

    if profile_response.status_code == 200 and profile_response.json():
        profile = profile_response.json()[0]
        print(f"   ✅ Found profiles record")
        print(f"   - role: {profile.get('role')}")
        print(f"   - kiosk_user_id: {profile.get('kiosk_user_id')}")

        # Compare kiosk_user_ids
        if profile.get('kiosk_user_id') == kiosk_user_id:
            print(f"   ✅ kiosk_user_id matches between tables")
        else:
            print(f"   ⚠️  kiosk_user_id mismatch: master_users={kiosk_user_id}, profiles={profile.get('kiosk_user_id')}")
    else:
        print(f"   ⚠️  No profiles record found")

else:
    print(f"   ❌ No master_users record found")
    print(f"   Response: {master_response.status_code}")
    if master_response.text:
        print(f"   Error: {master_response.text}")

print("\n" + "="*60)
print("TEST COMPLETE")
print("="*60)