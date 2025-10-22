# Quiz Submission Fix Summary

## Problem
When you completed the quiz (score 2/10), the submission **failed silently** and was not recorded in the database. The dashboard showed no update because nothing was saved.

## Root Causes Found

### 1. **Generated Column Error**
- `score_percent` in `quiz_attempts` table is a **GENERATED column** (automatically calculated)
- The code was trying to manually insert a value into it: `score_percent: scorePercent`
- PostgreSQL rejected this with error: `cannot insert a non-DEFAULT value into column "score_percent"`

### 2. **RLS Policy Missing**
- After fixing the generated column issue, discovered **Row Level Security (RLS)** was blocking inserts
- The `quiz_attempts` table had RLS enabled but no policy allowing authenticated users to insert their own records
- Error: `new row violates row-level security policy for table "quiz_attempts"`

## Fixes Applied

### Fix 1: Updated `staff-quiz.html` ✅
Removed `score_percent` from insert statements (lines ~1647 and ~1719):

**Before:**
```javascript
const insertAttempt = {
  // ... other fields
  score_percent: scorePercent,  // ❌ Can't insert into generated column
  is_practice: false
};
```

**After:**
```javascript
const insertAttempt = {
  // ... other fields
  // score_percent is a GENERATED column - don't insert it manually
  is_practice: false
};
```

### Fix 2: SQL Script Created ✅
Created `FIX_QUIZ_SUBMISSION.sql` which:
1. Adds RLS policies to allow authenticated users to insert/view/update their own quiz attempts
2. Ensures `score_percent` is properly configured as a GENERATED column
3. Fixes the same issues for `quiz_practices` table (practice mode)

## Next Steps - ACTION REQUIRED

### Step 1: Run the SQL Fix
1. Open Supabase Dashboard: https://unveoqnlqnobufhublyw.supabase.co
2. Go to SQL Editor
3. Copy and paste the contents of `FIX_QUIZ_SUBMISSION.sql`
4. Click "Run"

### Step 2: Test the Fix
1. Refresh your browser (hard refresh: Cmd+Shift+R)
2. Go to staff-quiz.html
3. Take the Weekly Check-In quiz
4. Submit it
5. Check the dashboard - it should now update immediately

### Step 3: Verify in Database
Run the diagnostic script to confirm the submission was recorded:
```bash
node diagnose_quiz_submission.mjs
```

You should see:
- ✅ A new quiz attempt with today's date
- ✅ `master_users.next_quiz_due` updated to 7 days from now
- ✅ `master_users.last_required_quiz_at` updated to now

## Why This Happened

The code worked in development but failed in production because:
1. The database schema changed (score_percent became a generated column)
2. The JavaScript code wasn't updated to match
3. RLS policies weren't fully configured for the quiz_attempts table
4. Errors were being caught and logged to console (not shown to user), making it appear as if submission succeeded

## Files Modified

1. **staff-quiz.html** - Removed score_percent from insert statements (2 locations)
2. **FIX_QUIZ_SUBMISSION.sql** - Database fixes for RLS and generated columns
3. **diagnose_quiz_submission.mjs** - Diagnostic tool to check quiz records
4. **test_quiz_insert.mjs** - Test script to verify inserts work

## Prevention

Going forward:
- Always check browser console for Supabase errors after quiz submission
- Test quiz submission in a fresh browser session (to catch RLS issues)
- Consider adding user-visible error messages when database operations fail
- Add integration tests that verify quiz submission end-to-end
