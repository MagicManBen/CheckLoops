# How to Fix RLS Blocking Updates in Smart Setup

## The Problem
RLS (Row Level Security) is blocking the anon key from updating rows in the `CQC All GPs` table. This causes Smart Setup to fail when trying to save data.

## Solution: Update RLS Policies in Supabase

### Step 1: Access Supabase SQL Editor
1. Go to: https://unveoqnlqnobufhublyw.supabase.co
2. Sign in to your Supabase account
3. Navigate to **SQL Editor** in the left sidebar

### Step 2: Check Current Policies
Run this query first to see existing policies:

```sql
SELECT
    policyname,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'CQC All GPs'
ORDER BY policyname;
```

### Step 3: Apply the Fix
Copy and run the contents of `fix-rls-policies.sql` in the SQL Editor.

The script will:
1. Create a policy allowing anon users to READ all rows
2. Create a policy allowing anon users to UPDATE all rows
3. Keep authenticated users with full access

### Step 4: Test the Fix
After applying the policies, test in the SQL editor:

```sql
-- Switch to anon role
SET ROLE anon;

-- Try an update
UPDATE "CQC All GPs"
SET updated_at = NOW()
WHERE location_id = '1-10240838706'
RETURNING location_id, updated_at;

-- Should return 1 row (not 0)
```

### Step 5: Verify in Smart Setup
1. Open `smartsetup.html` in your browser
2. Search for a practice
3. Click "CQC → Save" or "NHS ODS → Save"
4. It should now save directly without needing Edge Functions

## Alternative: Use Edge Functions (Current Workaround)

If you can't modify RLS policies, the current `smartsetup.html` has workarounds:
- Detects when RLS blocks updates (0 rows returned)
- Falls back to Edge Functions that use service key
- Handles Edge Function quirks (like `fetch-cqc-details` bug)

## Security Considerations

### Option 1: Open Updates (Current Fix)
```sql
CREATE POLICY "anon_update_all" ON "CQC All GPs"
    FOR UPDATE TO anon
    USING (true)
    WITH CHECK (true);
```
- **Pros**: Simple, works immediately
- **Cons**: Anyone can update any row

### Option 2: Restricted Updates (More Secure)
```sql
CREATE POLICY "anon_update_restricted" ON "CQC All GPs"
    FOR UPDATE TO anon
    USING (true)
    WITH CHECK (
        location_id = OLD.location_id
        AND provider_id = OLD.provider_id
    );
```
- **Pros**: Prevents changing IDs
- **Cons**: Still allows public updates

### Option 3: Require Authentication (Most Secure)
- Require users to log in before using Smart Setup
- **Pros**: Full audit trail, secure
- **Cons**: Adds friction to onboarding

## Testing Files

1. **`test-supabase-rls.html`** - Tests RLS with anon key
2. **`test-service-key-temporary.html`** - Proves service key bypasses RLS (DELETE AFTER TESTING!)

## Clean Up After Testing

⚠️ **IMPORTANT**: After testing, you should:

1. **Delete `test-service-key-temporary.html`** - Contains service key!
2. **Revoke and regenerate the service key** in Supabase:
   - Go to Settings → API
   - Click "Regenerate service_role key"
   - Update any Edge Functions with the new key

## Recommended Action

1. **Apply the RLS fix** using `fix-rls-policies.sql`
2. **Test** that Smart Setup works without Edge Functions
3. **Delete** test files with service key
4. **Regenerate** service key for security

This will make Smart Setup work reliably without complex workarounds.