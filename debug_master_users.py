#!/usr/bin/env python3
"""Debug script to check master_users table for the user."""

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
print("DEBUG: MASTER_USERS TABLE CHECK")
print("="*60)

# Check both users
emails = ["benhowardmagic@hotmail.com", "ben.howard@stoke.nhs.uk"]

for email in emails:
    print(f"\n### Checking {email}:")

    # Check master_users by email
    master_response = requests.get(
        f"{SUPABASE_URL}/rest/v1/master_users?email=eq.{email}",
        headers=headers
    )

    if master_response.status_code == 200:
        master_data = master_response.json()
        if master_data:
            master = master_data[0]
            print(f"  Found in master_users:")
            print(f"    - auth_user_id: {master.get('auth_user_id')}")
            print(f"    - full_name: {master.get('full_name')}")
            print(f"    - site_id: {master.get('site_id')}")
            print(f"    - kiosk_user_id: {master.get('kiosk_user_id')}")
            print(f"    - access_type: {master.get('access_type')}")
            print(f"    - onboarding_complete: {master.get('onboarding_complete')}")

            # Also check profiles table for this auth_user_id
            if master.get('auth_user_id'):
                profile_response = requests.get(
                    f"{SUPABASE_URL}/rest/v1/profiles?user_id=eq.{master['auth_user_id']}",
                    headers=headers
                )
                if profile_response.status_code == 200 and profile_response.json():
                    profile = profile_response.json()[0]
                    print(f"  Also found in profiles table:")
                    print(f"    - role: {profile.get('role')}")
                    print(f"    - kiosk_user_id: {profile.get('kiosk_user_id')}")
        else:
            print(f"  NOT found in master_users table")

            # Check if exists in profiles via different lookup
            print(f"  Checking profiles table by email...")

            # Try to find via profiles table
            profiles_response = requests.get(
                f"{SUPABASE_URL}/rest/v1/profiles?email=eq.{email}",
                headers=headers
            )

            if profiles_response.status_code == 200 and profiles_response.json():
                profile = profiles_response.json()[0]
                print(f"  Found in profiles table:")
                print(f"    - user_id: {profile.get('user_id')}")
                print(f"    - kiosk_user_id: {profile.get('kiosk_user_id')}")
                print(f"    - role: {profile.get('role')}")
            else:
                # Try by user_id if we know it
                user_id = "55f1b4e6-01f4-452d-8d6c-617fe7794873"  # Known user_id for benhowardmagic
                profiles_response = requests.get(
                    f"{SUPABASE_URL}/rest/v1/profiles?user_id=eq.{user_id}",
                    headers=headers
                )
                if profiles_response.status_code == 200 and profiles_response.json():
                    profile = profiles_response.json()[0]
                    print(f"  Found in profiles table by user_id {user_id}:")
                    print(f"    - email: {profile.get('email')}")
                    print(f"    - kiosk_user_id: {profile.get('kiosk_user_id')}")
                    print(f"    - role: {profile.get('role')}")

print("\n" + "="*60)
print("DEBUG COMPLETE")
print("="*60)