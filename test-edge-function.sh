#!/bin/bash

# Test script for NHS Edge Function

echo "Testing NHS Edge Function..."
echo "============================="

# Read the API key from .env file
ANON_KEY=$(grep "SUPABASE_ANON_KEY=" .env | cut -d '=' -f2)

if [ -z "$ANON_KEY" ]; then
    echo "❌ Could not find SUPABASE_ANON_KEY in .env file"
    exit 1
fi

echo "Testing with a sample GP practice..."
echo ""

# Test with a known GP practice
curl -X POST https://unveoqnlqnobufhublyw.supabase.co/functions/v1/fetch-nhs-data-complete \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -H "apikey: $ANON_KEY" \
  -d '{
    "location_id": "1-101681804",
    "ods_code": "A81001",
    "data_sources": ["cqc", "ods", "prescribing"]
  }' \
  --silent --show-error | python3 -m json.tool

echo ""
echo "============================="
echo "Test complete!"
echo ""
echo "If you see JSON data above, the edge function is working!"
echo "If you see an error, check the deployment status."