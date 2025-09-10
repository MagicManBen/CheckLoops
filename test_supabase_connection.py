#!/usr/bin/env python3

import subprocess
import os

def test_supabase_cli():
    """Test Supabase CLI connection and get current database info"""
    
    print("=== TESTING SUPABASE CONNECTION ===")
    
    try:
        # Check if we're in a Supabase project
        result = subprocess.run(['supabase', 'status'], 
                               capture_output=True, text=True, cwd=os.getcwd())
        
        if result.returncode == 0:
            print("✓ Supabase project detected")
            print(result.stdout)
        else:
            print("❌ Not in a Supabase project or CLI not configured")
            print(result.stderr)
            
            # Try to get help
            help_result = subprocess.run(['supabase', '--help'], 
                                       capture_output=True, text=True)
            if help_result.returncode == 0:
                print("\nSupabase CLI is available. You may need to:")
                print("1. cd to your Supabase project directory")
                print("2. Run 'supabase login'")
                print("3. Run 'supabase link --project-ref YOUR_PROJECT_REF'")
            
    except FileNotFoundError:
        print("❌ Supabase CLI not found")
        print("Install with: npm install -g supabase")
    
    # Test database connection if possible
    print("\n=== TESTING DATABASE CONNECTION ===")
    try:
        db_result = subprocess.run(['supabase', 'db', 'remote', 'version'],
                                 capture_output=True, text=True, cwd=os.getcwd())
        
        if db_result.returncode == 0:
            print("✓ Database connection successful")
            print(db_result.stdout)
        else:
            print("❌ Database connection failed")
            print(db_result.stderr)
            
    except Exception as e:
        print(f"❌ Database connection test failed: {e}")

if __name__ == "__main__":
    test_supabase_cli()
