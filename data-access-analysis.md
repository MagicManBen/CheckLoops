# CheckLoop Data Access Analysis

## Current Situation
- **Problem**: RLS policies have infinite recursion issues blocking data access
- **Goal**: Make the site functional while keeping data secure from outsiders
- **Key Insight**: The goal ISN'T to hide data between staff members, but to protect from external threats

## Application Architecture

### User Roles
1. **Admin/Owner**: Full access to everything
2. **Staff**: Should see most data (within their site)
3. **Public/Unauthenticated**: No access to any data

### Pages & Their Data Requirements

#### 🔐 Authentication Pages
**Pages**: `home.html`, `signup.html`, `set-password.html`, `admin-login.html`
- **Tables Accessed**:
  - `master_users` (for login verification)
  - `sites` (for site selection during signup)
  - `site_invites` (for invitation validation)
- **Access Needed**: Minimal - just own user record

#### 👤 Staff Dashboard & Profile
**Pages**: `staff.html`, `staff-welcome.html`
- **Tables Accessed**:
  - `master_users` (own profile + team members)
  - `sites` (site information)
  - `teams` (team information)
  - `user_achievements` (achievement progress)
  - `training_records` (training status)
  - `quiz_attempts` (quiz history)
- **Access Needed**: Own data + same-site staff data

#### 📚 Training Module
**Page**: `staff-training.html`
- **Tables Accessed**:
  - `training_types` (available training)
  - `training_records` (completion status)
  - `master_users` (user info)
  - `user_achievements` (progress tracking)
- **Access Needed**: All training types, own records, achievement updates

#### 🎯 Quiz Module
**Page**: `staff-quiz.html`
- **Tables Accessed**:
  - `quiz_practices` (practice attempts)
  - `quiz_attempts` (official attempts)
  - `master_users` (user info)
  - `user_achievements` (achievement updates)
- **Access Needed**: Own quiz data, ability to create new attempts

#### 📅 Holiday Management
**Pages**: `my-holidays.html`, `staff-calendar.html`
- **Tables Accessed**:
  - `holiday_bookings` (holiday requests)
  - `master_users` (entitlements)
  - `holiday_summary` (overview data)
- **Access Needed**: Own holidays + view same-site staff holidays

#### 📋 Meetings Module
**Page**: `staff-meetings.html`
- **Tables Accessed**:
  - `meetings` (meeting records)
  - `master_users` (attendee info)
- **Access Needed**: All meetings for their site

#### 🏆 Achievements
**Page**: `achievements.html`
- **Tables Accessed**:
  - `achievements` (achievement definitions)
  - `user_achievements` (user progress)
  - `master_users` (user info)
- **Access Needed**: All achievement definitions, own progress

#### 📝 Complaints/PIR
**Page**: `complaints.html`
- **Tables Accessed**:
  - `complaints` (complaint records)
  - `master_users` (staff info)
- **Access Needed**: Complaints for their site

#### 📊 Admin Dashboard
**Page**: `admin-dashboard.html`
- **Tables Accessed**: ALL TABLES
- **Access Needed**: Full access to everything

#### 🖥️ Kiosk Interface
**Page**: `indexIpad.html`
- **Tables Accessed**:
  - `master_users` (clock in/out)
  - `kiosk_roles` (role selection)
  - Various operational tables
- **Access Needed**: Site-specific data only

## Key Findings

### Tables That Need Site-Based Access Control
These tables contain sensitive data that should be filtered by site:
1. `master_users` - Staff profiles
2. `holiday_bookings` - Holiday requests
3. `training_records` - Training completion
4. `meetings` - Meeting records
5. `complaints` - PIR/Complaints
6. `quiz_attempts` - Quiz results

### Tables That Can Be Globally Readable
These tables contain reference data that all authenticated users can see:
1. `sites` - Site definitions
2. `teams` - Team definitions
3. `training_types` - Training categories
4. `achievements` - Achievement definitions
5. `kiosk_roles` - Role options

### Tables That Need User-Specific Access
These tables should only show own records:
1. `user_achievements` - Personal progress
2. `quiz_practices` - Practice attempts

## Recommended RLS Strategy

### Core Principles
1. **Authenticated users only** - No public access to any data
2. **Site-based filtering** - Staff see data from their own site
3. **Admin bypass** - Admins can see everything
4. **Simple policies** - Avoid recursion and complex joins

### Proposed Policy Structure

#### For Site-Based Tables (master_users, holiday_bookings, etc.)
```sql
-- Users can read records from their own site
CREATE POLICY "same_site_read" ON [table_name]
FOR SELECT
USING (
  site_id IN (
    SELECT site_id FROM master_users
    WHERE auth_user_id = auth.uid()
    LIMIT 1
  )
  OR
  EXISTS (
    SELECT 1 FROM master_users
    WHERE auth_user_id = auth.uid()
    AND access_type IN ('admin', 'owner')
    LIMIT 1
  )
);
```

#### For Reference Tables (sites, training_types, etc.)
```sql
-- All authenticated users can read
CREATE POLICY "authenticated_read" ON [table_name]
FOR SELECT
USING (auth.role() = 'authenticated');
```

#### For User-Specific Tables (user_achievements, etc.)
```sql
-- Users can only see their own records
CREATE POLICY "own_records_only" ON [table_name]
FOR SELECT
USING (user_id = auth.uid());
```

## Implementation Priority

### Phase 1: Critical Tables (Immediate)
Fix these first to get basic functionality:
1. `master_users` - Already done
2. `training_types` - Allow all authenticated to read
3. `training_records` - Site-based access
4. `sites` - Allow all authenticated to read
5. `teams` - Allow all authenticated to read

### Phase 2: Feature Tables (Next)
6. `holiday_bookings` - Site-based access
7. `meetings` - Site-based access
8. `quiz_attempts` - User-specific access
9. `user_achievements` - User-specific access
10. `achievements` - Allow all authenticated to read

### Phase 3: Additional Tables (Later)
11. `complaints` - Site-based access
12. `kiosk_roles` - Allow all authenticated to read
13. Other operational tables as needed

## Security Considerations

### What This Protects Against
✅ External attackers without credentials
✅ Unauthorized API access
✅ Data leaks to non-authenticated users
✅ Cross-site data access (staff from Site A can't see Site B)

### What This Allows
✅ Staff can collaborate within their site
✅ Admins can manage everything
✅ Simple, maintainable policies
✅ No recursion issues

### What This Doesn't Protect
⚠️ Staff within same site can see each other's data (by design)
⚠️ Reference data is visible to all authenticated users (acceptable)