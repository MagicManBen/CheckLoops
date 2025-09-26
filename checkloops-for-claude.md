# CheckLoops System Overview for Claude

## System Architecture

CheckLoops is a healthcare practice management system built on Supabase that provides tools for GP practices in the UK. It integrates with NHS and CQC (Care Quality Commission) data APIs to provide a comprehensive view of healthcare practices.

## File Links

### Edge Functions
- [extract-certificate-v2/index.ts](https://github.com/MagicManBen/CheckLoops/blob/main/supabase/functions/extract-certificate-v2/index.ts)
- [fetch-cqc-details/index.ts](https://github.com/MagicManBen/CheckLoops/blob/main/supabase/functions/fetch-cqc-details/index.ts)
- [fetch-nhs-data-complete/index.ts](https://github.com/MagicManBen/CheckLoops/blob/main/supabase/functions/fetch-nhs-data-complete/index.ts)
- [_shared/cors.ts](https://github.com/MagicManBen/CheckLoops/blob/main/supabase/functions/_shared/cors.ts)

### Client Pages
- [cqctest-detailed-full-fixed.html](https://github.com/MagicManBen/CheckLoops/blob/main/cqctest-detailed-full-fixed.html)
- [nhs-gp-dashboard-ultra-debug.html](https://github.com/MagicManBen/CheckLoops/blob/main/nhs-gp-dashboard-ultra-debug.html)
- [certificate-uploader.js](https://github.com/MagicManBen/CheckLoops/blob/main/certificate-uploader.js)
- [certificate-uploader.css](https://github.com/MagicManBen/CheckLoops/blob/main/certificate-uploader.css)

### Database
- [SUPABASE_BACKUP_DATABASE.sql](https://github.com/MagicManBen/CheckLoops/blob/main/SUPABASE_BACKUP_DATABASE.sql)
- [ADD_NHS_COLUMNS_TO_CQC_TABLE.sql](https://github.com/MagicManBen/CheckLoops/blob/main/ADD_NHS_COLUMNS_TO_CQC_TABLE.sql)
- [add_assessment_columns.sql](https://github.com/MagicManBen/CheckLoops/blob/main/add_assessment_columns.sql)

### Admin
- [admin-dashboard.html](https://github.com/MagicManBen/CheckLoops/blob/main/admin-dashboard.html)
- [ADMIN_ACCESS_FIX_SUMMARY.md](https://github.com/MagicManBen/CheckLoops/blob/main/ADMIN_ACCESS_FIX_SUMMARY.md)

### Key Components

1. **Supabase Database**:
   - PostgreSQL database with tables for users, practices, and healthcare data
   - Key tables include: `CQC All GPs`, `NHS_All_GPs`, and various user/staff tables

2. **Supabase Edge Functions**:
   - Backend serverless functions running on Deno runtime
   - Handle API integrations, data processing, and AI features

3. **Web Frontend**:
   - HTML/JS client for searching and managing GP practices
   - Dashboards for viewing practice information from both CQC and NHS sources
   - Certificate management for staff training records

## Healthcare Data Integration

The system integrates with two primary external APIs:

1. **CQC API**: 
   - Provides official Care Quality Commission data about healthcare providers
   - Used to fetch details about practice registration, inspections, and ratings
   - Endpoint: `https://api.service.cqc.org.uk/public/v1`

2. **NHS APIs**:
   - ODS API (`https://directory.spineservices.nhs.uk/ORD/2-0-0/organisations/`)
   - OpenPrescribing API for medication data

## Supabase Edge Functions

Key Edge Functions in the system:

1. **[fetch-cqc-details](https://github.com/MagicManBen/CheckLoops/blob/main/supabase/functions/fetch-cqc-details/index.ts)**:
   - Fetches detailed CQC information for a location
   - Stores data in `CQC All GPs` table
   - Handles comprehensive provider assessment data

2. **[fetch-nhs-data-complete](https://github.com/MagicManBen/CheckLoops/blob/main/supabase/functions/fetch-nhs-data-complete/index.ts)**:
   - Fetches NHS ODS and prescribing data
   - Integrates with multiple NHS data sources
   - Updates both `NHS_All_GPs` and `CQC All GPs` tables

3. **[extract-certificate-v2](https://github.com/MagicManBen/CheckLoops/blob/main/supabase/functions/extract-certificate-v2/index.ts)** (currently failing):
   - Processes training certificates uploaded by users
   - Uses OpenAI API to extract information from PDFs and images
   - Issue: PDF parsing library dependency is causing deployment failures

4. **Other Edge Functions**:
   - [_shared/cors.ts](https://github.com/MagicManBen/CheckLoops/blob/main/supabase/functions/_shared/cors.ts) - Shared CORS headers
   - [extract-certificate](https://github.com/MagicManBen/CheckLoops/blob/main/supabase/functions/extract-certificate/index.ts) - Original certificate processor
   - [extract-complaint](https://github.com/MagicManBen/CheckLoops/blob/main/supabase/functions/extract-complaint/index.ts) - Complaint analysis

## Client Web Pages

1. **[cqctest-detailed-full-fixed.html](https://github.com/MagicManBen/CheckLoops/blob/main/cqctest-detailed-full-fixed.html)**:
   - Search interface for GP surgeries in CQC database
   - Provides detailed view of practice information
   - Allows fetching and saving both CQC and NHS data

2. **[nhs-gp-dashboard-ultra-debug.html](https://github.com/MagicManBen/CheckLoops/blob/main/nhs-gp-dashboard-ultra-debug.html)**:
   - Advanced debugging dashboard for NHS data integration
   - Visualizes API connections and data flows
   - Shows detailed logs of all operations

3. **Certificate Upload System**:
   - [certificate-uploader.js](https://github.com/MagicManBen/CheckLoops/blob/main/certificate-uploader.js) - Main JavaScript implementation
   - [certificate-uploader.css](https://github.com/MagicManBen/CheckLoops/blob/main/certificate-uploader.css) - Styling for the uploader
   - Integrates with the `extract-certificate-v2` Edge Function
   - Uses PDF.js for client-side extraction when possible

4. **Admin Pages**:
   - [admin-dashboard.html](https://github.com/MagicManBen/CheckLoops/blob/main/admin-dashboard.html) - Main admin interface
   - [admin-dashboard-holiday-fix.js](https://github.com/MagicManBen/CheckLoops/blob/main/admin-dashboard-holiday-fix.js) - Holiday approval system
   - [admin-session-check.js](https://github.com/MagicManBen/CheckLoops/blob/main/admin-session-check.js) - Authentication verification

## Database Schema

The full database schema can be found in the [SUPABASE_BACKUP_DATABASE.sql](https://github.com/MagicManBen/CheckLoops/blob/main/SUPABASE_BACKUP_DATABASE.sql) file, with additional SQL scripts for specific features:
- [ADD_NHS_COLUMNS_TO_CQC_TABLE.sql](https://github.com/MagicManBen/CheckLoops/blob/main/ADD_NHS_COLUMNS_TO_CQC_TABLE.sql)
- [add_assessment_columns.sql](https://github.com/MagicManBen/CheckLoops/blob/main/add_assessment_columns.sql)

Key tables in the system:

1. **CQC All GPs**:
   - Main table for GP practice information
   - Combines data from CQC and NHS sources
   - Contains location details, ratings, inspection data
   - Key fields: `location_id`, `provider_id`, `location_name`, `ods_code`, `postcode`, `overall_rating`
   - JSON fields: `location_source`, `provider_source`, `nhs_ods_data`, `nhs_prescribing_data`

2. **NHS_All_GPs**:
   - Specific NHS data for practices
   - Linked to CQC data via ODS codes (`practice_ods_code`)
   - Contains prescribing data and other NHS-specific information
   - JSONB fields for storing complex nested data structures

3. **training_records** and related tables:
   - Store staff training information (`user_id`, `training_type_id`, `completion_date`, `expiry_date`)
   - Link to uploaded certificate files (`certificate_url`)
   - Support expiry date tracking and reminders
   - Connected to `master_users` table for staff information

4. **master_users**:
   - Combined user information from various profile tables
   - Stores user roles and access permissions
   - Contains both `role` and `access_type` fields for authorization
   - Used for Row Level Security (RLS) policy checks
   - Issues documented in [ADMIN_ACCESS_FIX_SUMMARY.md](https://github.com/MagicManBen/CheckLoops/blob/main/ADMIN_ACCESS_FIX_SUMMARY.md)

## Authentication & Security

- Uses Supabase Auth for user authentication
- Edge Functions require Bearer token authentication
- Service role keys used for privileged operations

## AI Integration

- OpenAI integration for:
  - Certificate text extraction (GPT-4o-mini)
  - Image analysis of certificates (GPT-4o with Vision)
  - Complaint analysis and meeting transcription

## Issue with extract-certificate-v2

The [extract-certificate-v2](https://github.com/MagicManBen/CheckLoops/blob/main/supabase/functions/extract-certificate-v2/index.ts) Edge Function is failing to deploy due to issues with the PDF parsing dependency. There's also a [backup version](https://github.com/MagicManBen/CheckLoops/blob/main/supabase/functions/extract-certificate-v2/index.ts.backup) showing the problematic code.

### Error When Deploying

The deployment fails when running `supabase functions deploy extract-certificate-v2` with errors related to the PDF parsing library:

```
Error: Failed to initialize module "https://deno.land/x/pdf_parse@v1.1.1/mod.ts".
Error: error: Uncaught TypeError: Cannot read properties of undefined (reading 'TextDecoder')
```

The PDF parsing library is not fully compatible with the Deno Deploy environment.

### Original Implementation (Failing)

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import OpenAI from "npm:openai@^4.57.0"
import * as pdfParse from "https://deno.land/x/pdf_parse@v1.1.1/mod.ts"

// Later in the code:
// Process PDFs with the library
const pdfData = await pdfParse.default(uint8Array)
contentText = pdfData.text || ''
```

### Modified Implementation (Working)

The working version removes dependency on PDF parsing libraries and instead:
1. Uses OpenAI's Vision capabilities for images
2. For PDFs, converts to base64 and treats them as images for GPT-4o Vision
3. Falls back to client-side parsing when possible

```typescript
// PDF handling without the dependency
if (contentType.includes('pdf')) {
  console.log('[DEBUG] Processing PDF file - converting to base64 for AI')
  // For PDFs, convert to base64 and let GPT-4 Vision handle it
  // GPT-4 Vision can process PDFs as images
  const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))
  contentText = `[IMAGE:${base64}]`
  console.log('[DEBUG] PDF converted to base64 for vision processing')
}
```

### Environment Variables

The system uses the following environment variables:
- `SUPABASE_URL` - Supabase project URL (https://unveoqnlqnobufhublyw.supabase.co)
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for admin access
- `OPENAI_API_KEY` or `CheckLoopsAI` - OpenAI API key for AI features
- `CQC_API_KEY` - API key for CQC integration (5b91c30763b4466e89727c0c555e47a6)

The Supabase anon key used in client applications:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMTcyNzYsImV4cCI6MjA3MDU5MzI3Nn0.g93OsXDpO3V9DToU7s-Z3SwBBnB84rBv0JMv-idgSME
```

## Client-Side Certificate Processing

The certificate-uploader.js file implements client-side certificate handling:
- Uses PDF.js for client-side text extraction when possible
- Falls back to server-side processing via the Edge Function
- Provides detailed debugging information
- Handles the upload and storage of certificate files in Supabase storage
- Uses AI to extract structured information from certificates

## Data Flow

1. User searches for a GP practice by name, location, or postcode
2. System fetches basic information from the CQC All GPs table
3. User can request detailed information that triggers Edge Functions
4. Edge Functions fetch data from CQC and NHS APIs
5. Retrieved data is stored in the database and displayed to the user
6. For certificates, users upload files that are processed with AI to extract information

## Technical Challenges

1. **PDF Processing in Deno**: Deno's restrictions on third-party modules make PDF parsing challenging.
2. **Combining NHS and CQC Data**: The system must match records between different systems using ODS codes.
3. **Edge Function Limitations**: Size and dependency constraints affect complex operations.

## Additional Resources

- [certificate-uploader-debug.js](https://github.com/MagicManBen/CheckLoops/blob/main/certificate-uploader-debug.js) - Debugging tools for certificate uploads
- [analyze_training_system.js](https://github.com/MagicManBen/CheckLoops/blob/main/analyze_training_system.js) - Analysis of the training certificate system
- [BACKUP_README.md](https://github.com/MagicManBen/CheckLoops/blob/main/BACKUP_README.md) - Information about database backups
- [backup_supabase.sh](https://github.com/MagicManBen/CheckLoops/blob/main/backup_supabase.sh) - Script for backing up the Supabase database