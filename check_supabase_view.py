import os
import requests
import json

def query_supabase(query):
    """Execute a SQL query against Supabase."""
    url = "https://unveoqnlqnobufhublyw.supabase.co/rest/v1/rpc/execute_sql"
    headers = {
        "apikey": "sb_secret_ylIhDtikpno4LTTUmpDJvw_Ov7BtIEp",
        "Authorization": f"Bearer sb_secret_ylIhDtikpno4LTTUmpDJvw_Ov7BtIEp",
        "Content-Type": "application/json"
    }
    
    payload = {"query": query}
    
    response = requests.post(url, headers=headers, json=payload)
    
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Error: {response.status_code}")
        print(response.text)
        return None

def get_view_definition(view_name):
    """Get the SQL definition of a view."""
    query = f"SELECT definition FROM pg_views WHERE viewname = '{view_name}';"
    result = query_supabase(query)
    return result

def list_all_tables():
    """List all tables in the public schema."""
    query = "SELECT table_name, table_type FROM information_schema.tables WHERE table_schema = 'public';"
    return query_supabase(query)

def main():
    # Get view definition
    print("Checking view definition for 'site_invitess'...")
    view_def = get_view_definition("site_invitess")
    print(f"View Definition: {json.dumps(view_def, indent=2)}")
    
    # List all tables
    print("\nListing all tables...")
    tables = list_all_tables()
    print(f"Tables: {json.dumps(tables, indent=2)}")
    
    # Alternative approach: Try to find references to site_invitess
    print("\nSearching for references to the view...")
    references_query = "SELECT c.relname AS table_name, a.attname AS column_name FROM pg_catalog.pg_attribute a JOIN pg_catalog.pg_class c ON a.attrelid = c.oid WHERE c.relkind = 'r' AND a.attname LIKE '%invite%';"
    references = query_supabase(references_query)
    print(f"Potential related tables: {json.dumps(references, indent=2)}")

if __name__ == "__main__":
    main()