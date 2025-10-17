# Fix Quiz Analytics - Complete Guide

## Problem
The admin dashboard shows "Question analysis not available" because individual quiz answers are not being saved to the `quiz_attempt_answers` table.

## Solution Overview
1. ✅ Verify/Fix Supabase table permissions
2. ✅ Update quiz submission code to save individual answers
3. ✅ Test with a new quiz submission

---

## Step 1: Run SQL to Fix Database Permissions

**Open Supabase Dashboard** → **SQL Editor** → Run this:

```sql
-- Enable RLS and create policies for quiz_attempt_answers
ALTER TABLE public.quiz_attempt_answers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (if any)
DROP POLICY IF EXISTS "Users can insert their own quiz answers" ON public.quiz_attempt_answers;
DROP POLICY IF EXISTS "Users can view their own quiz answers" ON public.quiz_attempt_answers;
DROP POLICY IF EXISTS "Admins can view all quiz answers" ON public.quiz_attempt_answers;

-- Allow users to insert answers for their own quiz attempts
CREATE POLICY "Users can insert their own quiz answers"
    ON public.quiz_attempt_answers
    FOR INSERT
    WITH CHECK (
        attempt_id IN (
            SELECT id FROM quiz_attempts WHERE user_id = auth.uid()
        )
    );

-- Allow users to view their own answers
CREATE POLICY "Users can view their own quiz answers"
    ON public.quiz_attempt_answers
    FOR SELECT
    USING (
        attempt_id IN (
            SELECT id FROM quiz_attempts WHERE user_id = auth.uid()
        )
    );

-- Allow admins to view all answers
CREATE POLICY "Admins can view all quiz answers"
    ON public.quiz_attempt_answers
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM master_users
            WHERE auth_user_id = auth.uid()
            AND access_type = 'admin'
        )
    );
```

**Expected Result:** "Success. No rows returned"

---

## Step 2: Code Changes (Already Done! ✅)

I've updated `staff-quiz.html` to save individual answers when a quiz is submitted.

**What was changed:**
- Modified the quiz submission code to insert records into `quiz_attempt_answers`
- Each question's answer is now saved with:
  - `attempt_id` - Links to the quiz_attempts record
  - `question_id` - Which question was answered
  - `chosen_index` - User's answer choice (0, 1, 2, etc.)
  - `is_correct` - Whether the answer was correct
  - `answered_at` - Timestamp

---

## Step 3: Test the Fix

### A. Run Validation SQL

**Open Supabase Dashboard** → **SQL Editor** → Run `test_quiz_answers.sql`:

```sql
-- Check everything is set up correctly
SELECT 'RLS Status' as check_type;
SELECT tablename, rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'quiz_attempt_answers';

SELECT 'Policies' as check_type;
SELECT policyname, cmd as operation
FROM pg_policies
WHERE tablename = 'quiz_attempt_answers';
```

**Expected Result:**
- `rls_enabled` = true
- 3 policies listed (insert, 2x select)

### B. Take a Test Quiz

1. Open your quiz page: `staff-quiz.html`
2. Complete a **mandatory** quiz (not practice)
3. Submit the quiz
4. Open browser console (F12) - Look for:
   - ✅ `💾 submitQuiz: quiz_attempts row inserted`
   - ✅ `💾 submitQuiz: Individual answers saved successfully: 10`

### C. Verify Data Was Saved

**Run in Supabase SQL Editor:**

```sql
-- Check recent quiz attempts
SELECT 
    id,
    user_id,
    score_percent,
    completed_at
FROM quiz_attempts
ORDER BY completed_at DESC
LIMIT 3;

-- Check answer details for most recent attempt
SELECT 
    qaa.attempt_id,
    qq.question_text,
    qaa.chosen_index,
    qaa.is_correct
FROM quiz_attempt_answers qaa
LEFT JOIN quiz_questions qq ON qaa.question_id = qq.id
ORDER BY qaa.answered_at DESC
LIMIT 20;
```

**Expected Result:** You should see:
- A recent quiz attempt record
- 10 answer records (one per question)

---

## Step 4: View Dashboard Analytics

1. Go to admin dashboard
2. Click on **Dashboard** in the sidebar
3. Click on the **CQC Quiz Scores** purple header to expand
4. You should now see:
   - ✅ Average Score, Total Submissions, Pass Rate cards
   - ✅ **Table showing most incorrectly answered questions**

---

## Troubleshooting

### Problem: "Question analysis not available" still shows

**Check 1: Are answers being saved?**
```sql
SELECT COUNT(*) FROM quiz_attempt_answers;
```
- If count = 0, check browser console for errors

**Check 2: RLS Policies**
```sql
SELECT * FROM pg_policies WHERE tablename = 'quiz_attempt_answers';
```
- Should show 3 policies

**Check 3: Browser Console**
- Look for errors mentioning `quiz_attempt_answers`
- Common issue: RLS blocking insert

### Problem: "Failed to insert" error in console

**Fix:** Run the SQL from Step 1 again to ensure policies are correct

### Problem: Old quizzes don't have answer data

**This is expected!** Only NEW quiz submissions (after the fix) will have detailed answers saved. Old quiz attempts in the database won't have individual answer data.

---

## Files Modified

1. ✅ `staff-quiz.html` - Updated quiz submission code
2. ✅ `admin-dashboard.html` - Added CQC Quiz Scores dashboard section
3. ✅ `fix_quiz_answers.sql` - SQL to setup permissions
4. ✅ `test_quiz_answers.sql` - SQL to verify setup

---

## Summary

✅ **Database Setup:** Run `fix_quiz_answers.sql` in Supabase
✅ **Code Changes:** Already updated in `staff-quiz.html`
✅ **Testing:** Take a new quiz and check the dashboard
✅ **Analytics:** Dashboard now shows detailed question analysis

**The next time someone takes a mandatory quiz, their individual answers will be saved and the dashboard will show which questions are most commonly missed!**
