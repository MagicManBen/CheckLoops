"""
Categorization of all 69 Supabase tables into single-row vs multi-row per user
"""

# Tables to MERGE into master_users (single row per user)
SINGLE_ROW_TABLES = [
    'profiles',                    # User profile data - MERGE INTO MASTER
    'kiosk_users',                 # Kiosk user data - MERGE INTO MASTER
    'staff_app_welcome',           # Welcome/onboarding data - MERGE INTO MASTER
    '1_staff_holiday_profiles',    # Holiday profile - MERGE INTO MASTER
    'staff_holiday_profiles',      # Duplicate of above - MERGE INTO MASTER
    '3_staff_working_patterns',    # Working pattern - MERGE INTO MASTER
    'staff_working_patterns',      # Duplicate of above - MERGE INTO MASTER
    'working_patterns',            # Another duplicate - MERGE INTO MASTER
    'user_profiles_complete',      # User profile completion - MERGE INTO MASTER
    'onboarding',                  # Onboarding status - MERGE INTO MASTER
    'holiday_entitlements',        # Holiday entitlement - MERGE INTO MASTER
    'user_permissions',            # User permissions - MERGE INTO MASTER
    'user_roles',                  # User roles - MERGE INTO MASTER
]

# Tables to KEEP separate (multiple rows per user)
MULTI_ROW_TABLES = [
    '2_staff_entitlements',        # Multiple years of entitlements
    '4_holiday_bookings',          # Multiple bookings
    '4_holiday_requests',          # Multiple requests
    '5_staff_profile_user_links',  # Links between profiles
    'achievements',                # Achievement definitions
    'agenda_items',                # Meeting agenda items
    'check_types',                 # Check type definitions
    'complaint_attachments',       # Multiple attachments
    'complaint_categories',        # Category definitions
    'complaints',                  # Multiple complaints
    'fuzzy_match_holidays',        # Fuzzy matching records
    'fuzzy_match_training',        # Fuzzy matching records
    'holiday_bookings',            # Multiple bookings
    'holiday_request_days',        # Individual days of requests
    'holiday_requests',            # Multiple requests
    'holiday_summary',             # Summary data
    'item_allowed_types',          # Type definitions
    'items',                       # Multiple items
    'meeting-recordings',          # Multiple recordings
    'meeting_action_items',        # Multiple action items
    'meeting_attendees',           # Multiple attendees
    'meeting_notes',               # Multiple notes
    'meetings',                    # Multiple meetings
    'pir_attachments',             # Multiple attachments
    'pir_documents',               # Multiple documents
    'practice_quizzes',            # Multiple quizzes
    'project_issues',              # Multiple issues
    'quiz_attempts',               # Multiple attempts
    'quiz_options',                # Quiz option definitions
    'quiz_practices',              # Multiple practices
    'quiz_questions',              # Quiz question definitions
    'rooms',                       # Room definitions
    'site_invitations',            # Multiple invitations
    'site_invites',                # Multiple invites
    'staff_training_records',      # Multiple training records
    'submission_rows',             # Multiple submission rows
    'submissions',                 # Multiple submissions
    'training_certificates',       # Multiple certificates
    'training_records',            # Multiple training records
    'training_types',              # Training type definitions
    'user_achievements',           # Multiple achievements per user
]

# System/config tables (KEEP separate)
SYSTEM_TABLES = [
    '_trigger_info',               # System table
    'avatar_option_labels',        # Avatar configuration
    'kiosk_roles',                 # Role definitions
    'role_permissions',            # Permission definitions
    'sites',                       # Site definitions
    'teams',                       # Team definitions
    'staff',                       # Staff listing
    'information_schema.columns',  # System schema
]

# Views (not actual tables - KEEP for reference)
VIEWS = [
    'v_holiday_requests_with_user',
    'v_item_check_status',
    'v_items_admin',
    'v_submission_detail',
    'v_submission_summary',
]

# master_users table will be the consolidated table
MASTER_TABLE = 'master_users'

print("=" * 60)
print("TABLE CONSOLIDATION PLAN")
print("=" * 60)
print(f"\nTables to MERGE into {MASTER_TABLE}: {len(SINGLE_ROW_TABLES)}")
for table in SINGLE_ROW_TABLES:
    print(f"  ✓ {table}")

print(f"\nTables to KEEP separate (multi-row): {len(MULTI_ROW_TABLES)}")
print(f"System/Config tables to KEEP: {len(SYSTEM_TABLES)}")
print(f"Views (reference only): {len(VIEWS)}")

print(f"\n{'='*60}")
print(f"Total tables: {len(SINGLE_ROW_TABLES) + len(MULTI_ROW_TABLES) + len(SYSTEM_TABLES) + len(VIEWS)}")
print(f"Tables after consolidation: {1 + len(MULTI_ROW_TABLES) + len(SYSTEM_TABLES)}")
print(f"Reduction: {len(SINGLE_ROW_TABLES)} tables merged into 1")
print("=" * 60)