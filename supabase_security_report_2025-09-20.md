# Supabase Security Analysis Report

**Generated:** 2025-09-20T15:19:03.888Z
**Database:** https://unveoqnlqnobufhublyw.supabase.co
**Schema:** public

## Summary

- **Total Tables:** 12
- **RLS Enabled:** 0
- **RLS Disabled:** 12
- **Total Policies:** 0
- **Tables without policies:** 12

## Table Details

### profiles

- **RLS Enabled:** ❌ No
- **Policies:** 0
- **Columns:** 9
- **Foreign Keys:** 0

#### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| user_id | string | undefined | N/A |
| full_name | string | undefined | N/A |
| email | string | undefined | N/A |
| avatar_url | string | undefined | N/A |
| site_id | number | undefined | N/A |
| org_id | object | undefined | N/A |
| role | string | undefined | N/A |
| internal_id | string | undefined | N/A |
| kiosk_user_id | object | undefined | N/A |

### master_users

- **RLS Enabled:** ❌ No
- **Policies:** 0
- **Columns:** 74
- **Foreign Keys:** 0

#### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | string | undefined | N/A |
| auth_user_id | string | undefined | N/A |
| email | string | undefined | N/A |
| full_name | string | undefined | N/A |
| nickname | string | undefined | N/A |
| avatar_url | string | undefined | N/A |
| site_id | number | undefined | N/A |
| org_id | object | undefined | N/A |
| access_type | string | undefined | N/A |
| role_detail | string | undefined | N/A |
| active | boolean | undefined | N/A |
| team_id | object | undefined | N/A |
| team_name | object | undefined | N/A |
| reports_to_id | number | undefined | N/A |
| pin_hash | string | undefined | N/A |
| pin_hmac | object | undefined | N/A |
| last_login | object | undefined | N/A |
| invite_status | string | undefined | N/A |
| invited_by | object | undefined | N/A |
| invite_token | object | undefined | N/A |
| invite_sent_at | string | undefined | N/A |
| invite_accepted_at | object | undefined | N/A |
| invite_expires_at | object | undefined | N/A |
| allowed_pages | object | undefined | N/A |
| holiday_approved | boolean | undefined | N/A |
| holiday_entitlement | number | undefined | N/A |
| holiday_taken | number | undefined | N/A |
| holiday_remaining | number | undefined | N/A |
| working_hours | object | undefined | N/A |
| contract_hours | object | undefined | N/A |
| onboarding_complete | boolean | undefined | N/A |
| next_quiz_due | object | undefined | N/A |
| training_completed | object | undefined | N/A |
| kiosk_user_id | object | undefined | N/A |
| created_at | string | undefined | N/A |
| updated_at | string | undefined | N/A |
| is_gp | boolean | undefined | N/A |
| holiday_year | number | undefined | N/A |
| weekly_hours | number | undefined | N/A |
| weekly_sessions | number | undefined | N/A |
| holiday_multiplier | number | undefined | N/A |
| calculated_hours | number | undefined | N/A |
| calculated_sessions | number | undefined | N/A |
| manual_override | boolean | undefined | N/A |
| override_hours | object | undefined | N/A |
| override_sessions | object | undefined | N/A |
| monday_hours | number | undefined | N/A |
| tuesday_hours | number | undefined | N/A |
| wednesday_hours | number | undefined | N/A |
| thursday_hours | number | undefined | N/A |
| friday_hours | number | undefined | N/A |
| saturday_hours | number | undefined | N/A |
| sunday_hours | number | undefined | N/A |
| monday_sessions | number | undefined | N/A |
| tuesday_sessions | number | undefined | N/A |
| wednesday_sessions | number | undefined | N/A |
| thursday_sessions | number | undefined | N/A |
| friday_sessions | number | undefined | N/A |
| saturday_sessions | number | undefined | N/A |
| sunday_sessions | number | undefined | N/A |
| total_hours | number | undefined | N/A |
| total_sessions | number | undefined | N/A |
| final_annual_hours | number | undefined | N/A |
| final_annual_sessions | number | undefined | N/A |
| welcome_tour_shown | object | undefined | N/A |
| display_name | object | undefined | N/A |
| profile_created_at | string | undefined | N/A |
| profile_updated_at | string | undefined | N/A |
| welcome_completed_at | object | undefined | N/A |
| onboarding_required | boolean | undefined | N/A |
| role | string | undefined | N/A |
| total_holiday_entitlement | number | undefined | N/A |
| approved_holidays_used | number | undefined | N/A |
| last_required_quiz_at | object | undefined | N/A |

### holidays

- **RLS Enabled:** ❌ No
- **Policies:** 0
- **Columns:** 13
- **Foreign Keys:** 0

#### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | string | undefined | N/A |
| auth_user_id | string | undefined | N/A |
| user_id | string | undefined | N/A |
| email | string | undefined | N/A |
| full_name | string | undefined | N/A |
| site_id | number | undefined | N/A |
| holiday_entitlement | number | undefined | N/A |
| holiday_taken | number | undefined | N/A |
| holiday_remaining | number | undefined | N/A |
| holiday_approved | boolean | undefined | N/A |
| holiday_year | number | undefined | N/A |
| total_holiday_entitlement | number | undefined | N/A |
| approved_holidays_used | number | undefined | N/A |

### training_records

- **RLS Enabled:** ❌ No
- **Policies:** 0
- **Columns:** 11
- **Foreign Keys:** 0

#### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | number | undefined | N/A |
| site_id | number | undefined | N/A |
| staff_id | object | undefined | N/A |
| training_type_id | number | undefined | N/A |
| completion_date | string | undefined | N/A |
| expiry_date | string | undefined | N/A |
| certificate_url | object | undefined | N/A |
| notes | object | undefined | N/A |
| created_at | string | undefined | N/A |
| updated_at | string | undefined | N/A |
| user_id | string | undefined | N/A |

### training_types

- **RLS Enabled:** ❌ No
- **Policies:** 0
- **Columns:** 10
- **Foreign Keys:** 0

#### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | number | undefined | N/A |
| site_id | number | undefined | N/A |
| name | string | undefined | N/A |
| description | string | undefined | N/A |
| validity_months | number | undefined | N/A |
| is_clinical_required | boolean | undefined | N/A |
| is_non_clinical_required | boolean | undefined | N/A |
| active | boolean | undefined | N/A |
| created_at | string | undefined | N/A |
| updated_at | string | undefined | N/A |

### achievements

- **RLS Enabled:** ❌ No
- **Policies:** 0
- **Columns:** 7
- **Foreign Keys:** 0

#### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| key | string | undefined | N/A |
| name | string | undefined | N/A |
| description | string | undefined | N/A |
| icon | string | undefined | N/A |
| points | number | undefined | N/A |
| metadata | object | undefined | N/A |
| created_at | string | undefined | N/A |

### quiz_questions

- **RLS Enabled:** ❌ No
- **Policies:** 0
- **Columns:** 16
- **Foreign Keys:** 0

#### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | number | undefined | N/A |
| site_id | number | undefined | N/A |
| question_text | string | undefined | N/A |
| hint | string | undefined | N/A |
| explanation | string | undefined | N/A |
| category | string | undefined | N/A |
| difficulty | string | undefined | N/A |
| is_active | boolean | undefined | N/A |
| created_by | object | undefined | N/A |
| created_at | string | undefined | N/A |
| updated_at | string | undefined | N/A |
| options | object | undefined | N/A |
| correct_index | object | undefined | N/A |
| tags | object | undefined | N/A |
| category_id | number | undefined | N/A |
| correct_answer | object | undefined | N/A |

### quiz_attempts

- **RLS Enabled:** ❌ No
- **Policies:** 0
- **Columns:** 0
- **Foreign Keys:** 0

### complaints

- **RLS Enabled:** ❌ No
- **Policies:** 0
- **Columns:** 29
- **Foreign Keys:** 0

#### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | string | undefined | N/A |
| site_id | number | undefined | N/A |
| datetime | string | undefined | N/A |
| patient_initials | string | undefined | N/A |
| category | string | undefined | N/A |
| original_complaint | string | undefined | N/A |
| response | string | undefined | N/A |
| lessons_learned | object | undefined | N/A |
| status | string | undefined | N/A |
| priority | string | undefined | N/A |
| share_with_team | boolean | undefined | N/A |
| original_document_url | object | undefined | N/A |
| response_document_url | object | undefined | N/A |
| ai_extracted | boolean | undefined | N/A |
| created_by | object | undefined | N/A |
| created_at | string | undefined | N/A |
| updated_at | string | undefined | N/A |
| resolved_at | object | undefined | N/A |
| complaint_date | string | undefined | N/A |
| age | object | undefined | N/A |
| complaint_number | string | undefined | N/A |
| response_sent | boolean | undefined | N/A |
| complaint_summary | string | undefined | N/A |
| solution_given | string | undefined | N/A |
| category_trends | string | undefined | N/A |
| people_involved | string | undefined | N/A |
| avenue_used | object | undefined | N/A |
| suggestions_prevent_reoccurrence | string | undefined | N/A |
| actions_to_be_taken | string | undefined | N/A |

### meetings

- **RLS Enabled:** ❌ No
- **Policies:** 0
- **Columns:** 0
- **Foreign Keys:** 0

### teams

- **RLS Enabled:** ❌ No
- **Policies:** 0
- **Columns:** 3
- **Foreign Keys:** 0

#### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | number | undefined | N/A |
| site_id | number | undefined | N/A |
| name | string | undefined | N/A |

### sites

- **RLS Enabled:** ❌ No
- **Policies:** 0
- **Columns:** 4
- **Foreign Keys:** 0

#### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | number | undefined | N/A |
| name | string | undefined | N/A |
| city | string | undefined | N/A |
| created_at | string | undefined | N/A |

