# NHS ODS API Fix Documentation

## Problem Summary

The NHS+CQC integration in the CheckLoop system was failing because the NHS ODS API endpoint was not returning data for any practices. This resulted in incomplete data in the "CQC All GPs" database table, where only CQC data was being written but NHS ODS data was missing.

## Investigation Findings

1. Log analysis showed that the NHS ODS API calls were consistently failing across all GP practices.
2. The original NHS ODS API endpoint (`directory.spineservices.nhs.uk`) was no longer reliably responding to requests.
3. There are multiple NHS API endpoints available for ODS data, but the system was only trying one.

## Fix Implementation

The solution involves:

1. Updated the NHS ODS API endpoints to use more modern replacements:
   - Primary: `https://api.nhs.uk/organisation-api/organisations/{ods_code}`
   - Secondary: `https://directory-api.nhs.uk/ord/2-0-0/organisations/{ods_code}`
   - Fallback: `https://directory.spineservices.nhs.uk/ORD/2-0-0/organisations/{ods_code}`

2. Implemented a cascading fallback system that tries each endpoint in sequence until one works.

3. Created diagnostic tools to test the different NHS API endpoints:
   - `nhs-api-tester.html`: Tests which NHS API endpoints are working for specific ODS codes
   - `nhs-ods-api-fix-tester.html`: Tests the new NHS ODS API fix function directly

4. Deployed a special-purpose function (`nhs-ods-api-fix`) that demonstrates the fix.

5. Improved data extraction logic to handle different response formats from the various NHS API endpoints.

## Testing

The fix has been tested with different ODS codes to verify that:

1. The system now reliably fetches NHS ODS data using the multi-endpoint approach.
2. Different response formats are correctly parsed and normalized.
3. If all endpoints fail, a minimal record is created to avoid database errors.

## Technical Details

### NHS API Endpoints

1. **Primary Endpoint**
   - URL: `https://api.nhs.uk/organisation-api/organisations/{ods_code}`
   - Header: `Subscription-Key: 8f9a6c9a728348d2a02c803204a74b5a`
   - Format: FHIR JSON

2. **Directory API Endpoint**
   - URL: `https://directory-api.nhs.uk/ord/2-0-0/organisations/{ods_code}`
   - Header: `Accept: application/fhir+json`
   - Format: NHS ORD format

3. **Fallback Endpoint**
   - URL: `https://directory.spineservices.nhs.uk/ORD/2-0-0/organisations/{ods_code}`
   - Header: `Accept: application/fhir+json`
   - Format: NHS ORD format

### Data Extraction Logic

The fix includes improved logic to extract ODS data from different response formats:

1. Traditional ORD format (used by directory-api and fallback endpoints)
   - Looks for nested `Organisation` object with `GeoLoc`, `Roles`, etc.

2. FHIR format (used by primary endpoint)
   - Looks for flattened structure with `name`, `address`, `telecom`, etc.

3. Either format can contain address, contact, and relationship data in different structures.

## Next Steps

1. Monitor the success rates of NHS ODS API calls with the new endpoints.
2. Consider implementing additional error handling or data validation if needed.
3. Update the main NHS+CQC integration function with these changes once verified.

## Example Test Cases

| ODS Code | Expected to Work With |
|----------|----------------------|
| G0102001 | Primary Endpoint     |
| Y02622   | Directory API        |
| F84041   | Any endpoint         |

These test cases can be used to verify the fix is working correctly.