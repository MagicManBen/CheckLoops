# Master Users Table Migration Guide

## Overview
This guide consolidates all user-related tables (`profiles`, `kiosk_users`, `site_invites`) into a single `master_users` table, creating a single source of truth for all user data.

## Current State Analysis

### Existing Tables
1. **profiles** - Main user profile data (4 records)
2. **kiosk_users** - Legacy kiosk user data (empty)
3. **site_invites** - User invitations (1 record)

### Files Requiring Updates
- 28 HTML files contain queries to these tables
- Primary files: `admin-dashboard.html`, `home.html`, `staff-welcome.html`, `indexIpad.html`

## New Master Users Table Schema

```sql
CREATE TABLE master_users (
    -- Primary identification
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE,

    -- Basic information
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    nickname TEXT,
    avatar_url TEXT,

    -- Organization & Access
    site_id INT NOT NULL,
    org_id INT,
    access_type TEXT DEFAULT 'staff' CHECK (access_type IN ('owner', 'admin', 'staff')),
    role_detail TEXT,
    active BOOLEAN DEFAULT true,

    -- Team & Hierarchy
    team_id INT,
    team_name TEXT,
    reports_to_id UUID,

    -- Authentication & Security
    pin_hash TEXT,
    pin_hmac TEXT,
    last_login TIMESTAMP WITH TIME ZONE,

    -- Invitation tracking
    invite_status TEXT DEFAULT 'active',
    invited_by UUID,
    invite_token TEXT,
    invite_sent_at TIMESTAMP WITH TIME ZONE,
    invite_accepted_at TIMESTAMP WITH TIME ZONE,
    invite_expires_at TIMESTAMP WITH TIME ZONE,
    allowed_pages JSONB,

    -- Holiday/Leave management
    holiday_approved BOOLEAN DEFAULT false,
    holiday_entitlement INT DEFAULT 0,
    holiday_taken INT DEFAULT 0,

    -- Working hours
    working_hours JSONB,
    contract_hours DECIMAL(5,2),

    -- Onboarding & Training
    onboarding_complete BOOLEAN DEFAULT false,
    next_quiz_due TIMESTAMP WITH TIME ZONE,
    training_completed JSONB,

    -- Legacy support
    kiosk_user_id INT,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Migration Steps

### Step 1: Execute Database Migration

1. Open Supabase SQL Editor
2. Run the SQL from `master_users_migration.sql`
3. This creates the table and indexes

### Step 2: Migrate Existing Data

Run the following SQL to migrate data:

```sql
-- Migrate from profiles table
INSERT INTO master_users (
    auth_user_id,
    email,
    full_name,
    nickname,
    avatar_url,
    site_id,
    org_id,
    access_type,
    role_detail,
    active,
    team_id,
    team_name,
    reports_to_id,
    pin_hash,
    pin_hmac,
    onboarding_complete,
    next_quiz_due,
    kiosk_user_id,
    invite_status,
    created_at
)
SELECT
    p.user_id,
    COALESCE(au.email, si.email, 'unknown@example.com'),
    p.full_name,
    p.nickname,
    p.avatar_url,
    p.site_id,
    p.org_id,
    CASE
        WHEN p.role = 'admin' THEN 'admin'
        WHEN p.role = 'owner' THEN 'owner'
        ELSE 'staff'
    END,
    p.role_detail,
    COALESCE(p.active, true),
    p.team_id,
    p.team_name,
    p.reports_to_id,
    p.pin_hash,
    p.pin_hmac,
    p.onboarding_complete,
    p.next_quiz_due,
    p.kiosk_user_id,
    'active',
    p.created_at
FROM profiles p
LEFT JOIN auth.users au ON p.user_id = au.id
LEFT JOIN site_invites si ON si.full_name = p.full_name AND si.status = 'accepted';

-- Migrate pending invitations
INSERT INTO master_users (
    email,
    full_name,
    site_id,
    access_type,
    role_detail,
    active,
    reports_to_id,
    invite_status,
    invited_by,
    invite_token,
    invite_sent_at,
    invite_expires_at,
    allowed_pages,
    created_at
)
SELECT
    email,
    full_name,
    site_id,
    CASE
        WHEN role = 'admin' THEN 'admin'
        WHEN role = 'owner' THEN 'owner'
        ELSE 'staff'
    END,
    role_detail,
    false,
    reports_to_id,
    'pending',
    invited_by,
    token,
    created_at,
    expires_at,
    allowed_pages,
    created_at
FROM site_invites
WHERE status = 'pending';
```

### Step 3: Create Compatibility Views (Temporary)

```sql
-- Create backward-compatible views
CREATE OR REPLACE VIEW profiles AS
SELECT
    auth_user_id as user_id,
    site_id,
    CASE
        WHEN access_type = 'owner' THEN 'owner'
        WHEN access_type = 'admin' THEN 'admin'
        ELSE 'staff'
    END as role,
    full_name,
    created_at,
    org_id,
    nickname,
    next_quiz_due,
    onboarding_complete,
    avatar_url,
    kiosk_user_id,
    pin_hash,
    pin_hmac,
    active,
    team_id,
    team_name,
    role_detail,
    reports_to_id
FROM master_users
WHERE invite_status IN ('active', 'accepted');

CREATE OR REPLACE VIEW kiosk_users AS
SELECT
    kiosk_user_id as id,
    site_id,
    auth_user_id as user_id,
    full_name,
    email,
    access_type as role,
    holiday_approved
FROM master_users
WHERE kiosk_user_id IS NOT NULL;

CREATE OR REPLACE VIEW site_invites AS
SELECT
    ROW_NUMBER() OVER (ORDER BY created_at)::int as id,
    site_id,
    email,
    access_type as role,
    invited_by,
    invite_status as status,
    created_at,
    invite_accepted_at as accepted_at,
    invite_token as token,
    allowed_pages,
    invite_expires_at as expires_at,
    full_name,
    role_detail,
    reports_to_id
FROM master_users
WHERE invite_status = 'pending';
```

### Step 4: Update RLS Policies

```sql
-- Enable RLS on master_users
ALTER TABLE master_users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own data" ON master_users
    FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can view same site users" ON master_users
    FOR SELECT USING (
        site_id IN (
            SELECT site_id FROM master_users
            WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage site users" ON master_users
    FOR ALL USING (
        site_id IN (
            SELECT site_id FROM master_users
            WHERE auth_user_id = auth.uid()
            AND access_type IN ('admin', 'owner')
        )
    );
```

## Code Updates Required

### Key Query Transformations

| Old Query | New Query |
|-----------|-----------|
| `from('profiles')` | `from('master_users')` |
| `from('kiosk_users')` | `from('master_users')` |
| `from('site_invites')` | `from('master_users')` |
| `.eq('user_id', userId)` | `.eq('auth_user_id', userId)` |
| `.eq('role', 'admin')` | `.eq('access_type', 'admin')` |
| `.eq('status', 'pending')` | `.eq('invite_status', 'pending')` |
| `profile.role` | `user.access_type` |
| `invite.status` | `user.invite_status` |

### Common Pattern Updates

```javascript
// OLD: Check if user is admin
const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', userId)
    .single();
if (profile?.role === 'admin') { ... }

// NEW: Check if user is admin
const { data: user } = await supabase
    .from('master_users')
    .select('access_type')
    .eq('auth_user_id', userId)
    .single();
if (user?.access_type === 'admin') { ... }
```

```javascript
// OLD: Create invitation
await supabase.from('site_invites').insert({
    email, role, full_name, site_id, ...
});

// NEW: Create invitation
await supabase.from('master_users').insert({
    email,
    access_type: role,
    full_name,
    site_id,
    invite_status: 'pending',
    ...
});
```

## Testing Checklist

- [ ] User login/authentication works
- [ ] Admin dashboard loads correctly
- [ ] User list shows all users
- [ ] User invitation flow works
- [ ] User profile updates work
- [ ] Role-based access control works
- [ ] Holiday management works
- [ ] Kiosk PIN authentication works
- [ ] All user searches work
- [ ] Reports show correct user data

## Rollback Plan

If issues occur:

1. Drop the views: `DROP VIEW profiles, kiosk_users, site_invites;`
2. Rename backup tables:
   ```sql
   ALTER TABLE profiles_backup RENAME TO profiles;
   ALTER TABLE kiosk_users_backup RENAME TO kiosk_users;
   ALTER TABLE site_invites_backup RENAME TO site_invites;
   ```
3. Revert code changes

## Benefits

✅ Single source of truth for user data
✅ Eliminates data inconsistencies
✅ Simplifies queries and maintenance
✅ Better performance with proper indexing
✅ Easier to extend with new features
✅ Cleaner data model