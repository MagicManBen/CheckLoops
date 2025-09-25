# CQC API Integration Implementation Summary

## Overview
I've implemented a comprehensive data pipeline that fetches GP surgery information from the CQC (Care Quality Commission) API and stores every piece of data in a Supabase database table called "CQC All GPs".

## Implementation Components

### 1. Database Schema Updates (`update_cqc_table.sql`)
Created SQL script to add 30+ new columns to capture all CQC API data:

**Location Information:**
- `organisation_type`, `location_type`, `also_known_as`
- Full address fields: `address_line_1`, `address_line_2`, `town_city`, `county`, `region`, `postcode`
- Geographic data: `latitude`, `longitude`, `uprn`, `constituency`, `local_authority`

**NHS/Healthcare System Data:**
- `onspd_ccg_code`, `onspd_ccg_name` - Clinical Commissioning Group codes
- `onspd_icb_code`, `onspd_icb_name` - Integrated Care Board information
- `inspection_directorate`, `care_home`, `dormancy`, `number_of_beds`

**Provider Information:**
- `provider_name`, `provider_type`, `ownership_type`
- `companies_house_number`, `provider_registration_date`, `provider_registration_status`
- `main_phone_number`

**Complex Data (JSONB columns):**
- `current_ratings` - Full current CQC ratings breakdown
- `key_question_ratings` - Individual ratings for Safe, Effective, Caring, Responsive, Well-led
- `regulated_activities` - Services the location is registered to provide
- `relationships` - Related locations/providers
- `location_types`, `gac_service_types`, `specialisms`, `inspection_categories`
- `reports` - Inspection reports with dates and links

### 2. Supabase Edge Function (`fetch-cqc-details`)
Updated the serverless function to:
- Fetch location details from CQC API endpoint: `https://api.service.cqc.org.uk/public/v1/locations/{location_id}`
- Optionally fetch provider details from: `/providers/{provider_id}`
- Parse and map ALL fields from the API response to database columns
- Store both structured data (individual columns) and raw JSON responses (`location_source`, `provider_source`)
- Update timestamps (`updated_at`, `last_seen_at`)

### 3. HTML Interface (`cqctest.html`)
The web interface provides:
- Search functionality to find GP surgeries from the local database
- Modal popup showing surgery details with a "Fetch More Details" button
- Display of raw API response in a copyable JSON format
- Real-time updates showing when new data is fetched from CQC

## Data Flow

1. **Initial Search**: User searches for GP surgeries → queries existing data from Supabase table
2. **Selection**: User clicks on a surgery → modal opens showing current database information
3. **API Fetch**: User clicks "Fetch More Details" → triggers Supabase edge function
4. **CQC API Call**: Edge function fetches fresh data from CQC API using secured API key
5. **Data Storage**: All API response fields are parsed and stored in appropriate columns
6. **Response**: Complete API response is returned to frontend and displayed in modal

## Key Features

- **Complete Data Capture**: Every field from the CQC API is stored - nothing is lost
- **Dual Storage Strategy**:
  - Structured data in individual columns for easy querying
  - Raw API responses preserved in JSONB columns for reference
- **Provider Integration**: Automatically fetches and stores provider information when available
- **Secure API Key Management**: CQC API key stored as Supabase secret, never exposed to frontend
- **Real-time Updates**: Database is updated immediately when fresh data is fetched

## SQL Script to Run in Supabase

Run the contents of `update_cqc_table.sql` in the Supabase SQL editor to add all necessary columns.

## Deployed Function

The edge function `fetch-cqc-details` has been deployed to Supabase project `unveoqnlqnobufhublyw` and is ready for use.

## Example API Response Mapping

When the CQC API returns data like:
```json
{
  "locationId": "1-12784351550",
  "name": "Dr Buyanovsky Ltd",
  "currentRatings": {
    "overall": {
      "rating": "Requires improvement",
      "keyQuestionRatings": [...]
    }
  }
}
```

It's stored as:
- `location_id`: "1-12784351550"
- `location_name`: "Dr Buyanovsky Ltd"
- `overall_rating`: "Requires improvement"
- `current_ratings`: {full JSON object}
- Plus 50+ other fields capturing every detail

This ensures complete data preservation while maintaining queryable structured data for reporting and analysis.