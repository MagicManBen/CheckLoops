# Holiday Data Tables Guide

## 🚨 IMPORTANT: Setup Instructions

**The bulk upload wasn't working because the required tables don't exist in your Supabase database.**

### Step 1: Create the Tables
1. Open your Supabase dashboard
2. Go to the SQL Editor
3. Copy the entire contents of `create_holiday_tables.sql`
4. Paste it into the SQL editor
5. Click "Run" to create all the tables

### Step 2: Verify Tables Were Created
After running the SQL, you should see these new tables in your Table Editor:
- `staff_holiday_profiles`
- `staff_working_patterns`
- `holiday_bookings`
- `staff_profile_user_links`

### Step 3: Test the Upload Again
Now the bulk upload should work correctly with proper error messages if something goes wrong.

---

## 📊 Database Tables Explanation

### 1. **staff_holiday_profiles**
**Purpose:** Stores all staff member profiles (both GPs and regular staff)

| Column | Type | Description |
|--------|------|-------------|
| id | bigint | Unique identifier |
| full_name | text | Staff member's full name (unique) |
| role | text | Job role (Nurse, GP, Manager, etc.) |
| is_gp | boolean | True if GP, false for regular staff |
| email | text | Email address (optional) |
| created_at | timestamp | When record was created |
| updated_at | timestamp | When record was last updated |

**Data from templates:** When you upload Staff or GP templates, new records are created here.

---

### 2. **staff_working_patterns**
**Purpose:** Stores weekly working schedules

| Column | Type | Description |
|--------|------|-------------|
| id | bigint | Unique identifier |
| staff_profile_id | bigint | Links to staff_holiday_profiles |
| day_of_week | text | Monday, Tuesday, etc. |
| hours_worked | time | For regular staff (e.g., 08:00:00) |
| sessions_worked | integer | For GPs (1 or 2 sessions) |

**Data from templates:** 
- Regular Staff Template: Monday-Friday hours columns → `hours_worked`
- GP Template: Monday-Friday columns → `sessions_worked`

---

### 3. **holiday_entitlements**
**Purpose:** Annual leave allowances

| Column | Type | Description |
|--------|------|-------------|
| id | bigint | Unique identifier |
| staff_profile_id | bigint | Links to staff_holiday_profiles |
| year | integer | Year of entitlement |
| annual_hours | numeric | Total hours for regular staff |
| annual_sessions | integer | Total sessions for GPs |
| entitlement_hours | time | Hours in TIME format |
| entitlement_sessions | integer | Sessions for GPs |

**Data from templates:**
- Regular Staff: "Annual Hours" column → `annual_hours`
- GP Staff: "Annual Sessions" column → `annual_sessions`

---

### 4. **holiday_bookings**
**Purpose:** Individual holiday/leave bookings

| Column | Type | Description |
|--------|------|-------------|
| id | bigint | Unique identifier |
| staff_profile_id | bigint | Links to staff_holiday_profiles |
| booking_date | date | Date of leave |
| hours_booked | time | Hours for regular staff |
| sessions_booked | integer | Sessions for GPs |
| booking_type | text | annual_leave, sick_leave, etc. |
| imported_from_excel | boolean | True if from bulk upload |

**Data from Holiday Bookings Template:**
- "Staff Name" → matches to `staff_profile_id`
- "Date" → `booking_date`
- "Hours" → `hours_booked` (for regular staff)
- "Sessions" → `sessions_booked` (for GPs)
- "Type" → `booking_type`

---

### 5. **staff_profile_user_links**
**Purpose:** Links staff profiles to actual user accounts

| Column | Type | Description |
|--------|------|-------------|
| id | bigint | Unique identifier |
| staff_profile_id | bigint | Links to staff_holiday_profiles |
| user_id | uuid | Links to auth.users |
| linked_at | timestamp | When link was created |

**Automatic linking:** When a new user signs up with a matching name, they're automatically linked to their profile.

---

## 🔄 Data Flow

1. **Upload Staff/GP Template** →
   - Creates record in `staff_holiday_profiles`
   - Creates records in `staff_working_patterns` (one per day)
   - Creates record in `holiday_entitlements`

2. **Upload Holiday Bookings Template** →
   - Looks up staff in `staff_holiday_profiles` by name
   - Creates records in `holiday_bookings` (one per row)

3. **When user signs up** →
   - Automatic trigger creates link in `staff_profile_user_links`
   - Their holiday data becomes available immediately

---

## ⚠️ Troubleshooting

### "Successfully imported 1 records!" but no data appears
**Cause:** Tables don't exist
**Solution:** Run the SQL script first

### Error: "Failed to fetch staff profiles"
**Cause:** `staff_holiday_profiles` table doesn't exist
**Solution:** Run the SQL script to create tables

### Staff member not found when uploading holidays
**Cause:** Staff profile doesn't exist yet
**Solution:** Upload staff profiles first, then holiday bookings

### Data not linking to users
**Cause:** Name mismatch between profile and user account
**Solution:** Ensure names match exactly (case insensitive)

---

## 📝 Template Column Mappings

### Staff Template
- Full Name → staff_holiday_profiles.full_name
- Role → staff_holiday_profiles.role
- Annual Hours → holiday_entitlements.annual_hours
- Email → staff_holiday_profiles.email
- Monday-Friday → staff_working_patterns.hours_worked

### GP Template
- Full Name → staff_holiday_profiles.full_name
- Role → staff_holiday_profiles.role (always 'GP')
- Annual Sessions → holiday_entitlements.annual_sessions
- Email → staff_holiday_profiles.email
- Monday-Friday → staff_working_patterns.sessions_worked

### Holiday Bookings Template
- Staff Name → matched to staff_holiday_profiles.full_name
- Date → holiday_bookings.booking_date
- Hours → holiday_bookings.hours_booked
- Sessions → holiday_bookings.sessions_booked
- Type → holiday_bookings.booking_type