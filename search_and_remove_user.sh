#!/bin/bash

# This script will search for the email and generate SQL statements to remove it

EMAIL="ben.howard@stoke.nhs.uk"
SUPABASE_URL="https://unveoqnlqnobufhublyw.supabase.co"
SUPABASE_KEY="sb_secret_ylIhDtikpno4LTTUmpDJvw_Ov7BtIEp"

echo "Searching for $EMAIL in Supabase tables..."

# Check if we have the needed tools
if ! command -v curl &> /dev/null; then
    echo "Error: curl is not installed"
    exit 1
fi

if ! command -v jq &> /dev/null; then
    echo "Warning: jq is not installed. Output will not be formatted nicely."
    JQ_AVAILABLE=0
else
    JQ_AVAILABLE=1
fi

# First, check for invite-related tables
echo "Checking for invite-related tables..."
INVITE_TABLES_QUERY="SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%invite%'"

INVITE_TABLES=$(curl -s -X POST \
  "$SUPABASE_URL/rest/v1/rpc/execute_sql" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"query\":\"$INVITE_TABLES_QUERY\"}")

if [ $JQ_AVAILABLE -eq 1 ]; then
    echo "Invite-related tables:"
    echo "$INVITE_TABLES" | jq
else
    echo "Invite-related tables: $INVITE_TABLES"
fi

# Check site_invitess view definition
echo -e "\nChecking view definition for site_invitess..."
VIEW_QUERY="SELECT definition FROM pg_views WHERE viewname = 'site_invitess'"

VIEW_DEF=$(curl -s -X POST \
  "$SUPABASE_URL/rest/v1/rpc/execute_sql" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"query\":\"$VIEW_QUERY\"}")

if [ $JQ_AVAILABLE -eq 1 ]; then
    echo "View definition:"
    echo "$VIEW_DEF" | jq
else
    echo "View definition: $VIEW_DEF"
fi

# Common tables to check for the email
echo -e "\nSearching for email in common tables..."
TABLES=("profiles" "users" "site_invites" "invites" "invitations" "auth.users")

for TABLE in "${TABLES[@]}"; do
    echo "Checking table: $TABLE"
    QUERY="SELECT * FROM \"$TABLE\" WHERE email = '$EMAIL'"
    
    RESULT=$(curl -s -X POST \
      "$SUPABASE_URL/rest/v1/rpc/execute_sql" \
      -H "apikey: $SUPABASE_KEY" \
      -H "Authorization: Bearer $SUPABASE_KEY" \
      -H "Content-Type: application/json" \
      -d "{\"query\":\"$QUERY\"}" 2>/dev/null)
    
    if [[ "$RESULT" == *"\"$EMAIL\""* ]]; then
        echo "FOUND EMAIL in table $TABLE!"
        if [ $JQ_AVAILABLE -eq 1 ]; then
            echo "$RESULT" | jq
        else
            echo "$RESULT"
        fi
        echo "DELETE FROM \"$TABLE\" WHERE email = '$EMAIL';"
    fi
done

echo -e "\nGenerated SQL statements can be found in remove_user.sql"
echo "Please review the SQL statements before executing them!"