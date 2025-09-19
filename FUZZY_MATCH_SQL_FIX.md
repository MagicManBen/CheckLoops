# SQL Syntax Error Fix - Fuzzy Match Schema

## Issue Found
The SQL error was caused by incorrect syntax in subqueries within RLS policies. The SELECT statements needed additional parentheses when used as scalar subqueries.

## What Was Fixed

### The Problem
```sql
-- INCORRECT - Missing parentheses around subquery
AND LOWER(staff_name) = LOWER(
  SELECT full_name FROM profiles
  WHERE user_id = auth.uid()
)
```

### The Solution
```sql
-- CORRECT - Proper parentheses and LIMIT clause
AND LOWER(staff_name) = LOWER((
  SELECT full_name FROM profiles
  WHERE user_id = auth.uid()
  LIMIT 1
))
```

## Fixed Locations
1. **Line 57-60**: "Users can view their matches" policy
2. **Line 75-78**: "Users can update their matches" policy
3. **Line 132-133**: transfer_fuzzy_match_to_request function

## How to Apply the Fix

### Option 1: Use the Updated File
Run the entire contents of the corrected `fuzzy_match_schema.sql` file in your Supabase SQL editor.

### Option 2: Apply Just the Policy Fixes
If you've already created the table, you can just update the policies:

```sql
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their matches" ON fuzzy_match_holidays;
DROP POLICY IF EXISTS "Users can update their matches" ON fuzzy_match_holidays;

-- Recreate with correct syntax
CREATE POLICY "Users can view their matches" ON fuzzy_match_holidays
  FOR SELECT
  USING (
    matched_user_id = auth.uid()
    OR (
      match_status = 'pending'
      AND LOWER(staff_name) = LOWER((
        SELECT full_name FROM profiles
        WHERE user_id = auth.uid()
        LIMIT 1
      ))
      AND site_id IN (
        SELECT site_id FROM profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update their matches" ON fuzzy_match_holidays
  FOR UPDATE
  USING (
    matched_user_id = auth.uid()
    OR (
      match_status = 'pending'
      AND LOWER(staff_name) = LOWER((
        SELECT full_name FROM profiles
        WHERE user_id = auth.uid()
        LIMIT 1
      ))
      AND site_id IN (
        SELECT site_id FROM profiles WHERE user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    matched_user_id = auth.uid()
  );
```

## Why This Fix Works
- **Double parentheses**: The inner parentheses wrap the SELECT statement, the outer ones are for the function parameter
- **LIMIT 1**: Ensures the subquery returns exactly one row (scalar result)
- **Proper nesting**: PostgreSQL requires scalar subqueries to be properly parenthesized when used as function arguments

## Testing
After applying the fix, test by:
1. Running the SQL without errors
2. Uploading test holiday data as admin
3. Logging in as a user with matching name
4. Verifying the user can see and accept their matches

The syntax is now correct and should execute without errors in Supabase!