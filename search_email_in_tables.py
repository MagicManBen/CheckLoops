import requests
import json

# Supabase credentials
SUPABASE_URL = "https://unveoqnlqnobufhublyw.supabase.co"
SUPABASE_KEY = "sb_secret_ylIhDtikpno4LTTUmpDJvw_Ov7BtIEp"
EMAIL_TO_SEARCH = "ben.howard@stoke.nhs.uk"

# Headers for API requests
HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json"
}

def execute_sql(query):
    """Execute a SQL query against Supabase using RPC."""
    url = f"{SUPABASE_URL}/rest/v1/rpc/execute_sql"
    
    payload = {"query": query}
    
    response = requests.post(url, headers=HEADERS, json=payload)
    
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Error {response.status_code}: {response.text}")
        return None

def get_all_tables():
    """Get a list of all tables in the public schema."""
    query = """
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
    """
    
    result = execute_sql(query)
    if result:
        return [row.get('table_name') for row in result]
    return []

def get_text_columns(table_name):
    """Get all columns from a table that might contain emails."""
    query = f"""
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = '{table_name}'
    """
    
    result = execute_sql(query)
    if not result:
        return []
    
    # Filter columns that could contain email addresses
    text_columns = []
    for col in result:
        col_name = col.get('column_name', '').lower()
        data_type = col.get('data_type', '').lower()
        
        if ('text' in data_type or 'char' in data_type or 'varchar' in data_type) and (
            'email' in col_name or 'mail' in col_name or 'user' in col_name or 
            'contact' in col_name or 'address' in col_name
        ):
            text_columns.append(col.get('column_name'))
    
    return text_columns

def search_email_in_table(table_name, columns):
    """Search for email in the specified columns of a table."""
    results = []
    
    for column in columns:
        query = f"""
            SELECT * FROM "{table_name}"
            WHERE "{column}" = '{EMAIL_TO_SEARCH}'
            OR "{column}" ILIKE '%{EMAIL_TO_SEARCH}%'
        """
        
        data = execute_sql(query)
        if data and len(data) > 0:
            results.append({
                'table': table_name,
                'column': column,
                'matches': data
            })
    
    return results

def generate_delete_statements(results):
    """Generate SQL DELETE statements for the found records."""
    delete_statements = []
    
    for result in results:
        table_name = result['table']
        column = result['column']
        
        for match in result['matches']:
            if 'id' in match:
                delete_statements.append(f"DELETE FROM \"{table_name}\" WHERE id = '{match['id']}';")
            else:
                delete_statements.append(f"DELETE FROM \"{table_name}\" WHERE \"{column}\" = '{EMAIL_TO_SEARCH}';")
    
    return delete_statements

def check_invites_tables():
    """Check specifically for tables related to invites."""
    # First, check if site_invitess view exists and what it references
    view_query = """
        SELECT definition FROM pg_views WHERE viewname = 'site_invitess'
    """
    view_def = execute_sql(view_query)
    
    if view_def:
        print(f"View definition for site_invitess: {view_def}")
    
    # Check for tables with 'invite' in the name
    invite_tables_query = """
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name LIKE '%invite%'
    """
    
    invite_tables = execute_sql(invite_tables_query)
    if invite_tables:
        print(f"Found tables related to invites: {invite_tables}")
        return [table.get('table_name') for table in invite_tables]
    
    return []

def main():
    print(f"Searching for email: {EMAIL_TO_SEARCH}")
    
    # First, check specifically for invite-related tables
    invite_tables = check_invites_tables()
    
    # Get all tables in the database
    tables = get_all_tables()
    print(f"Found {len(tables)} tables to search")
    
    all_results = []
    
    # Prioritize invite tables if any were found
    if invite_tables:
        for table in invite_tables:
            columns = get_text_columns(table)
            results = search_email_in_table(table, columns)
            all_results.extend(results)
    
    # Search all other tables
    for table in tables:
        if table not in invite_tables:  # Skip if already searched
            columns = get_text_columns(table)
            results = search_email_in_table(table, columns)
            all_results.extend(results)
    
    # Print results
    if not all_results:
        print(f"Email {EMAIL_TO_SEARCH} not found in any tables")
    else:
        print(f"\nEmail {EMAIL_TO_SEARCH} found in {len(all_results)} table columns:")
        for result in all_results:
            print(f"\nTable: {result['table']}")
            print(f"Column: {result['column']}")
            print("Matches:")
            for match in result['matches']:
                print(f"  {match}")
        
        # Generate DELETE statements
        delete_statements = generate_delete_statements(all_results)
        
        print("\nGenerated SQL DELETE statements:")
        print("--------------------------------")
        for stmt in delete_statements:
            print(stmt)

if __name__ == "__main__":
    main()