# CQC GP Practices - Full Data Integration

## Overview
We've updated the system to capture ALL available details from the CQC API for each GP practice, not just the name. The new table structure includes:

### Key Fields Now Captured:
- **Location Details**: Full address, postal code, coordinates (latitude/longitude)
- **Administrative Areas**: Constituency, Local Authority, Region
- **Organization Info**: Type, Ownership Type, Registration Status
- **Contact Information**: Website, Phone Number
- **ICB Information**: ICB Code and Name (Integrated Care Board)
- **Inspection Data**: Last inspection date, inspection categories, directorate
- **Ratings**: Current ratings and overall rating
- **Related Data**: Location IDs, Contacts, Relationships, Regulated Activities

## Updated Components

### 1. **Table: CQC_List**
The table has been redesigned with 40+ fields to capture comprehensive GP practice information including:
- Core identifiers (provider_id, provider_name)
- Full address information
- Geographic coordinates
- Administrative boundaries (constituency, local_authority)
- Registration details
- Inspection and rating information
- JSONB fields for complex nested data

### 2. **Function: populate-gp-practices**
The Edge Function has been completely rewritten to:
- First fetch all GP practice IDs from the CQC API
- Then fetch detailed information for EACH practice individually
- Store all available fields in the database
- Handle rate limiting with built-in delays
- Process data in batches for reliability

## Steps to Apply the Full Update

### Step 1: Update the Table Schema
1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/unveoqnlqnobufhublyw
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `UPDATE_CQC_LIST_FULL.sql`
4. Click **Run** to recreate the table with all fields

### Step 2: Run the Updated Function
The function has already been deployed. To populate with full data, run:

```bash
curl -X POST "https://unveoqnlqnobufhublyw.supabase.co/functions/v1/populate-gp-practices" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMTcyNzYsImV4cCI6MjA3MDU5MzI3Nn0.g93OsXDpO3V9DToU7s-Z3SwBBnB84rBv0JMv-idgSME" \
  -H "Content-Type: application/json"
```

**IMPORTANT NOTES:**
- This process will take 15-30 minutes as it fetches detailed data for each of the 9,037 GP practices
- The function includes rate limiting to avoid overwhelming the CQC API
- It processes practices in batches of 50 for database insertion

## How to Update Data in the Future

Simply run the same curl command above. The function will:
1. Fetch the latest list of GP practices from CQC
2. Get updated details for each practice
3. Upsert the data (update existing records, insert new ones)
4. The `provider_id` field ensures no duplicates

## Querying the Data

Once populated, you can query the data using SQL. Examples:

### Find practices by constituency:
```sql
SELECT provider_name, postal_code, main_phone_number
FROM "CQC_List"
WHERE constituency = 'Westminster';
```

### Find practices by rating:
```sql
SELECT provider_name, overall_rating, region
FROM "CQC_List"
WHERE overall_rating = 'Outstanding';
```

### Find practices by local authority:
```sql
SELECT provider_name, postal_address_town_city, website
FROM "CQC_List"
WHERE local_authority = 'Birmingham';
```

### Get geographic distribution:
```sql
SELECT region, COUNT(*) as practice_count
FROM "CQC_List"
GROUP BY region
ORDER BY practice_count DESC;
```

## Monitoring Progress

To check the current state of the table:

```bash
curl -X POST "https://unveoqnlqnobufhublyw.supabase.co/functions/v1/verify-cqc-table" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMTcyNzYsImV4cCI6MjA3MDU5MzI3Nn0.g93OsXDpO3V9DToU7s-Z3SwBBnB84rBv0JMv-idgSME" \
  -H "Content-Type: application/json"
```

This will return the total count and sample records from the table.