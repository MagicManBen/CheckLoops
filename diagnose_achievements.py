#!/usr/bin/env python3
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
print("ACHIEVEMENTS SYSTEM DIAGNOSTIC")
print("="*60)

# Step 1: Get user profile
print("\n1. CHECKING USER PROFILE:")
profile_response = requests.get(
    f"{SUPABASE_URL}/rest/v1/profiles?email=eq.{EMAIL}",
    headers=headers
)

if profile_response.status_code != 200:
    # Try getting by user_id through master_users
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
    user_id = profile.get('user_id')
    kiosk_user_id = profile.get('kiosk_user_id')
    site_id = profile.get('site_id')
    
    print(f"   User ID: {user_id}")
    print(f"   Kiosk User ID: {kiosk_user_id}")
    print(f"   Site ID: {site_id}")
else:
    print("   ❌ Could not find user profile")
    exit(1)

# Step 2: Check user_achievements
print("\n2. CHECKING USER ACHIEVEMENTS:")
if kiosk_user_id:
    ach_response = requests.get(
        f"{SUPABASE_URL}/rest/v1/user_achievements?kiosk_user_id=eq.{kiosk_user_id}",
        headers=headers
    )
    
    if ach_response.status_code == 200:
        achievements = ach_response.json()
        if achievements:
            print(f"   Found {len(achievements)} achievements:")
            for ach in achievements:
                status_icon = "✅" if ach['status'] == 'unlocked' else "🔒"
                print(f"     {status_icon} {ach['achievement_key']}: {ach['status']}")
        else:
            print("   ❌ No achievements found")
    else:
        print(f"   ❌ Error fetching achievements: {ach_response.status_code}")
else:
    print("   ❌ No kiosk_user_id in profile")

# Step 3: Check master_users onboarding status
print("\n3. CHECKING MASTER_USERS ONBOARDING STATUS:")
master_response = requests.get(
    f"{SUPABASE_URL}/rest/v1/master_users?auth_user_id=eq.{user_id}&site_id=eq.{site_id or 2}",
    headers=headers
)

if master_response.status_code == 200 and master_response.json():
    master_data = master_response.json()[0]
    onboarding = master_data.get('onboarding_complete')
    print(f"   Onboarding Complete: {onboarding}")
    if onboarding:
        print("   ✅ Should have 'onboarding_completion' achievement")
else:
    print("   ❌ No master_users record found")

# Step 4: Check practice quizzes
print("\n4. CHECKING PRACTICE QUIZZES:")
quiz_response = requests.get(
    f"{SUPABASE_URL}/rest/v1/practice_quizzes?user_id=eq.{user_id}",
    headers=headers
)

if quiz_response.status_code == 200:
    quizzes = quiz_response.json()
    print(f"   Found {len(quizzes)} practice quizzes")
    if quizzes:
        print("   ✅ Should have 'first_practice_quiz' achievement")
else:
    print(f"   ❌ Error checking quizzes: {quiz_response.status_code}")

# Step 5: Check training records
print("\n5. CHECKING TRAINING RECORDS:")
training_response = requests.get(
    f"{SUPABASE_URL}/rest/v1/training_records?user_id=eq.{user_id}",
    headers=headers
)

if training_response.status_code == 200:
    training = training_response.json()
    print(f"   Found {len(training)} training records")
    if training:
        print("   ✅ Should have 'first_training_upload' achievement")
else:
    print(f"   ❌ Error checking training: {training_response.status_code}")

print("\n" + "="*60)
print("DIAGNOSTIC COMPLETE")
print("="*60)
