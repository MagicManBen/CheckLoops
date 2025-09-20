#!/usr/bin/env python3
import os
import requests
import json

# Supabase connection details
url = "https://unveoqnlqnobufhublyw.supabase.co"
service_key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '')
if not service_key:
    raise RuntimeError('SUPABASE_SERVICE_ROLE_KEY not set in environment')

headers = {
    "apikey": service_key,
    "Authorization": f"Bearer {service_key}",
    "Content-Type": "application/json"
}

# Check current working hours for benhowardmagic@hotmail.com
response = requests.get(
    f"{url}/rest/v1/master_users?email=eq.benhowardmagic@hotmail.com&site_id=eq.2",
    headers=headers
)

print("Current master_users record for benhowardmagic@hotmail.com:")
print("="*60)

if response.status_code == 200:
    data = response.json()
    if data:
        record = data[0]
        print(f"auth_user_id: {record.get('auth_user_id')}")
        print(f"nickname: {record.get('nickname')}")
        print(f"role_detail: {record.get('role_detail')}")
        print(f"team_id: {record.get('team_id')}")
        print(f"team_name: {record.get('team_name')}")
        print("\nWorking Hours:")
        print(f"  Monday:    {record.get('monday_hours')} hours, {record.get('monday_sessions')} sessions")
        print(f"  Tuesday:   {record.get('tuesday_hours')} hours, {record.get('tuesday_sessions')} sessions")
        print(f"  Wednesday: {record.get('wednesday_hours')} hours, {record.get('wednesday_sessions')} sessions")
        print(f"  Thursday:  {record.get('thursday_hours')} hours, {record.get('thursday_sessions')} sessions")
        print(f"  Friday:    {record.get('friday_hours')} hours, {record.get('friday_sessions')} sessions")
        print(f"  Saturday:  {record.get('saturday_hours')} hours, {record.get('saturday_sessions')} sessions")
        print(f"  Sunday:    {record.get('sunday_hours')} hours, {record.get('sunday_sessions')} sessions")
        print(f"\nTotal Hours: {record.get('total_hours')}")
        print(f"Total Sessions: {record.get('total_sessions')}")
        print(f"Weekly Hours: {record.get('weekly_hours')}")
        print(f"Weekly Sessions: {record.get('weekly_sessions')}")
    else:
        print("No record found!")
else:
    print(f"Error: {response.status_code}")
    print(response.text)
