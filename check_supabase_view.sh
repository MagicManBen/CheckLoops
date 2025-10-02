#!/bin/bash

echo "Checking Supabase view definition for site_invitess"

# Set Supabase credentials
export SUPABASE_URL="https://unveoqnlqnobufhublyw.supabase.co"
export SUPABASE_KEY="sb_secret_ylIhDtikpno4LTTUmpDJvw_Ov7BtIEp"

# SQL to retrieve view definition
SQL_QUERY="SELECT definition FROM pg_views WHERE viewname = 'site_invitess';"

# Using curl to directly query the Supabase REST API
echo "Attempting to query view definition via REST API..."
curl -X POST \
  "$SUPABASE_URL/rest/v1/rpc/execute_sql" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"query\":\"$SQL_QUERY\"}"

echo -e "\n\nAttempting to list all available tables..."
LIST_TABLES="SELECT table_name, table_type FROM information_schema.tables WHERE table_schema = 'public';"
curl -X POST \
  "$SUPABASE_URL/rest/v1/rpc/execute_sql" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"query\":\"$LIST_TABLES\"}"