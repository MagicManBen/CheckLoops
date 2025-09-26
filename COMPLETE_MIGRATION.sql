-- Complete Migration Script for NHS + CQC Integration
-- Run this in Supabase SQL Editor to ensure all required columns exist
-- Date: December 2024

-- ============================================
-- STEP 1: Add all missing columns
-- ============================================

-- Core NHS fields
ALTER TABLE "CQC All GPs" ADD COLUMN IF NOT EXISTS "nhs_ods_data" jsonb;
ALTER TABLE "CQC All GPs" ADD COLUMN IF NOT EXISTS "last_nhs_update" timestamp with time zone;
ALTER TABLE "CQC All GPs" ADD COLUMN IF NOT EXISTS "nhs_last_updated" timestamp with time zone;
ALTER TABLE "CQC All GPs" ADD COLUMN IF NOT EXISTS "ods_code" text;

-- Raw JSON storage
ALTER TABLE "CQC All GPs" ADD COLUMN IF NOT EXISTS "location_source" jsonb;
ALTER TABLE "CQC All GPs" ADD COLUMN IF NOT EXISTS "provider_source" jsonb;

-- Basic location information
ALTER TABLE "CQC All GPs" ADD COLUMN IF NOT EXISTS "location_name" text;
ALTER TABLE "CQC All GPs" ADD COLUMN IF NOT EXISTS "provider_id" text;
ALTER TABLE "CQC All GPs" ADD COLUMN IF NOT EXISTS "provider_name" text;
ALTER TABLE "CQC All GPs" ADD COLUMN IF NOT EXISTS "organisation_type" text;
ALTER TABLE "CQC All GPs" ADD COLUMN IF NOT EXISTS "location_type" text;

-- Address fields
ALTER TABLE "CQC All GPs" ADD COLUMN IF NOT EXISTS "address_line_1" text;
ALTER TABLE "CQC All GPs" ADD COLUMN IF NOT EXISTS "address_line_2" text;
ALTER TABLE "CQC All GPs" ADD COLUMN IF NOT EXISTS "town_city" text;
ALTER TABLE "CQC All GPs" ADD COLUMN IF NOT EXISTS "county" text;
ALTER TABLE "CQC All GPs" ADD COLUMN IF NOT EXISTS "postcode" text;
ALTER TABLE "CQC All GPs" ADD COLUMN IF NOT EXISTS "region" text;
ALTER TABLE "CQC All GPs" ADD COLUMN IF NOT EXISTS "uprn" text;

-- Geographic data
ALTER TABLE "CQC All GPs" ADD COLUMN IF NOT EXISTS "latitude" text;
ALTER TABLE "CQC All GPs" ADD COLUMN IF NOT EXISTS "longitude" text;

-- Contact information
ALTER TABLE "CQC All GPs" ADD COLUMN IF NOT EXISTS "main_phone_number" text;
ALTER TABLE "CQC All GPs" ADD COLUMN IF NOT EXISTS "website" text;
ALTER TABLE "CQC All GPs" ADD COLUMN IF NOT EXISTS "number_of_beds" integer;

-- Administrative data
ALTER TABLE "CQC All GPs" ADD COLUMN IF NOT EXISTS "constituency" text;
ALTER TABLE "CQC All GPs" ADD COLUMN IF NOT EXISTS "local_authority" text;
ALTER TABLE "CQC All GPs" ADD COLUMN IF NOT EXISTS "inspection_directorate" text;

-- NHS/CCG/ICB information
ALTER TABLE "CQC All GPs" ADD COLUMN IF NOT EXISTS "onspd_ccg_code" text;
ALTER TABLE "CQC All GPs" ADD COLUMN IF NOT EXISTS "onspd_ccg_name" text;
ALTER TABLE "CQC All GPs" ADD COLUMN IF NOT EXISTS "ods_ccg_code" text;
ALTER TABLE "CQC All GPs" ADD COLUMN IF NOT EXISTS "ods_ccg_name" text;
ALTER TABLE "CQC All GPs" ADD COLUMN IF NOT EXISTS "onspd_icb_code" text;
ALTER TABLE "CQC All GPs" ADD COLUMN IF NOT EXISTS "onspd_icb_name" text;

-- Registration and status
ALTER TABLE "CQC All GPs" ADD COLUMN IF NOT EXISTS "registration_date" text;
ALTER TABLE "CQC All GPs" ADD COLUMN IF NOT EXISTS "registration_status" text;
ALTER TABLE "CQC All GPs" ADD COLUMN IF NOT EXISTS "deregistration_date" text;
ALTER TABLE "CQC All GPs" ADD COLUMN IF NOT EXISTS "dormancy" text;
ALTER TABLE "CQC All GPs" ADD COLUMN IF NOT EXISTS "care_home" text;

-- Ratings and inspection
ALTER TABLE "CQC All GPs" ADD COLUMN IF NOT EXISTS "overall_rating" text;
ALTER TABLE "CQC All GPs" ADD COLUMN IF NOT EXISTS "current_ratings" jsonb;
ALTER TABLE "CQC All GPs" ADD COLUMN IF NOT EXISTS "key_question_ratings" jsonb;
ALTER TABLE "CQC All GPs" ADD COLUMN IF NOT EXISTS "last_inspection_date" text;
ALTER TABLE "CQC All GPs" ADD COLUMN IF NOT EXISTS "last_report_date" text;

-- Complex data structures
ALTER TABLE "CQC All GPs" ADD COLUMN IF NOT EXISTS "regulated_activities" jsonb;
ALTER TABLE "CQC All GPs" ADD COLUMN IF NOT EXISTS "relationships" jsonb;
ALTER TABLE "CQC All GPs" ADD COLUMN IF NOT EXISTS "location_types" jsonb;
ALTER TABLE "CQC All GPs" ADD COLUMN IF NOT EXISTS "gac_service_types" jsonb;
ALTER TABLE "CQC All GPs" ADD COLUMN IF NOT EXISTS "specialisms" jsonb;
ALTER TABLE "CQC All GPs" ADD COLUMN IF NOT EXISTS "inspection_categories" jsonb;
ALTER TABLE "CQC All GPs" ADD COLUMN IF NOT EXISTS "inspection_areas" jsonb;
ALTER TABLE "CQC All GPs" ADD COLUMN IF NOT EXISTS "reports" jsonb;
ALTER TABLE "CQC All GPs" ADD COLUMN IF NOT EXISTS "contacts" jsonb;

-- Provider-specific fields
ALTER TABLE "CQC All GPs" ADD COLUMN IF NOT EXISTS "provider_type" text;
ALTER TABLE "CQC All GPs" ADD COLUMN IF NOT EXISTS "ownership_type" text;
ALTER TABLE "CQC All GPs" ADD COLUMN IF NOT EXISTS "companies_house_number" text;
ALTER TABLE "CQC All GPs" ADD COLUMN IF NOT EXISTS "provider_registration_date" text;
ALTER TABLE "CQC All GPs" ADD COLUMN IF NOT EXISTS "provider_registration_status" text;
ALTER TABLE "CQC All GPs" ADD COLUMN IF NOT EXISTS "provider_brand_id" text;
ALTER TABLE "CQC All GPs" ADD COLUMN IF NOT EXISTS "provider_brand_name" text;
ALTER TABLE "CQC All GPs" ADD COLUMN IF NOT EXISTS "provider_location_ids" jsonb;

-- Provider address fields
ALTER TABLE "CQC All GPs" ADD COLUMN IF NOT EXISTS "provider_address_line_1" text;
ALTER TABLE "CQC All GPs" ADD COLUMN IF NOT EXISTS "provider_address_line_2" text;
ALTER TABLE "CQC All GPs" ADD COLUMN IF NOT EXISTS "provider_town_city" text;
ALTER TABLE "CQC All GPs" ADD COLUMN IF NOT EXISTS "provider_county" text;
ALTER TABLE "CQC All GPs" ADD COLUMN IF NOT EXISTS "provider_postcode" text;
ALTER TABLE "CQC All GPs" ADD COLUMN IF NOT EXISTS "provider_region" text;
ALTER TABLE "CQC All GPs" ADD COLUMN IF NOT EXISTS "provider_uprn" text;

-- Provider geographic data
ALTER TABLE "CQC All GPs" ADD COLUMN IF NOT EXISTS "provider_latitude" text;
ALTER TABLE "CQC All GPs" ADD COLUMN IF NOT EXISTS "provider_longitude" text;

-- Provider administrative data
ALTER TABLE "CQC All GPs" ADD COLUMN IF NOT EXISTS "provider_constituency" text;
ALTER TABLE "CQC All GPs" ADD COLUMN IF NOT EXISTS "provider_local_authority" text;
ALTER TABLE "CQC All GPs" ADD COLUMN IF NOT EXISTS "provider_inspection_directorate" text;
ALTER TABLE "CQC All GPs" ADD COLUMN IF NOT EXISTS "provider_main_phone_number" text;
ALTER TABLE "CQC All GPs" ADD COLUMN IF NOT EXISTS "provider_website" text;
ALTER TABLE "CQC All GPs" ADD COLUMN IF NOT EXISTS "provider_onspd_icb_code" text;
ALTER TABLE "CQC All GPs" ADD COLUMN IF NOT EXISTS "provider_onspd_icb_name" text;
ALTER TABLE "CQC All GPs" ADD COLUMN IF NOT EXISTS "provider_inspection_areas" jsonb;

-- Timestamps
ALTER TABLE "CQC All GPs" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone DEFAULT NOW();
ALTER TABLE "CQC All GPs" ADD COLUMN IF NOT EXISTS "last_seen_at" timestamp with time zone;

-- Legacy fields (for backward compatibility)
ALTER TABLE "CQC All GPs" ADD COLUMN IF NOT EXISTS "ratings" jsonb;

-- ============================================
-- STEP 2: Create indexes for performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_cqc_all_gps_ods_code ON "CQC All GPs" (ods_code);
CREATE INDEX IF NOT EXISTS idx_cqc_all_gps_location_id ON "CQC All GPs" (location_id);
CREATE INDEX IF NOT EXISTS idx_cqc_all_gps_provider_id ON "CQC All GPs" (provider_id);
CREATE INDEX IF NOT EXISTS idx_cqc_all_gps_postcode ON "CQC All GPs" (postcode);
CREATE INDEX IF NOT EXISTS idx_cqc_all_gps_location_name ON "CQC All GPs" (location_name);
CREATE INDEX IF NOT EXISTS idx_cqc_all_gps_overall_rating ON "CQC All GPs" (overall_rating);

-- Index for JSON fields (GIN indexes for JSONB queries)
CREATE INDEX IF NOT EXISTS idx_cqc_all_gps_location_source ON "CQC All GPs" USING GIN (location_source);
CREATE INDEX IF NOT EXISTS idx_cqc_all_gps_nhs_ods_data ON "CQC All GPs" USING GIN (nhs_ods_data);

-- ============================================
-- STEP 3: Create or update the trigger for updated_at
-- ============================================

-- Create the function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists and recreate
DROP TRIGGER IF EXISTS update_cqc_all_gps_updated_at ON "CQC All GPs";

CREATE TRIGGER update_cqc_all_gps_updated_at
BEFORE UPDATE ON "CQC All GPs"
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STEP 4: Grant permissions (if needed)
-- ============================================

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON "CQC All GPs" TO authenticated;
GRANT SELECT, INSERT, UPDATE ON "CQC All GPs" TO service_role;

-- ============================================
-- STEP 5: Create RPC function to check columns
-- ============================================

CREATE OR REPLACE FUNCTION get_table_columns(table_name text)
RETURNS TABLE(column_name text, data_type text, is_nullable text)
LANGUAGE sql
STABLE
AS $$
  SELECT
    column_name::text,
    data_type::text,
    is_nullable::text
  FROM information_schema.columns
  WHERE table_name = $1
  ORDER BY ordinal_position;
$$;

-- ============================================
-- VERIFICATION QUERY - Run this to check all columns
-- ============================================

-- Check if all required columns exist
SELECT
  COUNT(*) as total_columns,
  COUNT(CASE WHEN column_name IN (
    'nhs_ods_data', 'last_nhs_update', 'ods_code', 'location_source', 'provider_source',
    'main_phone_number', 'website', 'address_line_1', 'postcode', 'latitude', 'longitude',
    'onspd_ccg_code', 'onspd_icb_code', 'overall_rating'
  ) THEN 1 END) as critical_columns_present
FROM information_schema.columns
WHERE table_name = 'CQC All GPs';

-- Show sample of data to verify
SELECT
  location_id,
  location_name,
  ods_code,
  main_phone_number,
  last_nhs_update,
  CASE
    WHEN nhs_ods_data IS NOT NULL THEN 'Has NHS data'
    ELSE 'No NHS data'
  END as nhs_status,
  CASE
    WHEN location_source IS NOT NULL THEN 'Has CQC data'
    ELSE 'No CQC data'
  END as cqc_status
FROM "CQC All GPs"
LIMIT 5;