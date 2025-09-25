// Edge Function: sync-cqc-all-gps
// Purpose: Fetch GP practices from CQC API and upsert into "CQC All GPs" table
// Modes: full (fetch all) or delta (fetch changes only)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { CqcApiClient } from './api-client.ts';
import { DataProcessor } from './data-processor.ts';
import { DatabaseInterface } from './db-interface.ts';

// Define constants with hardcoded credentials
const CQC_BASE_URL = 'https://api.cqc.org.uk/public/v1';
const CQC_API_KEY = '5b91c30763b4466e89727c0c555e47a6'; // Hardcoded API key
const SUPABASE_URL = 'https://unveoqnlqnobufhublyw.supabase.co'; // Hardcoded Supabase URL
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwMzE5OTkzMSwiZXhwIjoyMDk4MzE1OTMxfQ.5rxkEBBp1gimzFRUyjIkh9q8Bp6k9JbPIZUq-IKu8Jc'; // Hardcoded service role key
const GP_LOCATIONS_ENDPOINT = '/locations?inspectionCategoryName=GP%20Practices&perPage=500';

// Define types
interface SyncOptions {
  mode: 'full' | 'delta';
  startTimestamp?: string;
  endTimestamp?: string;
}

interface ProcessingStats {
  locationsProcessed: number;
  providersProcessed: number;
  reportsProcessed: number;
  recordsUpserted: number;
  pagesTraversed: number;
  retryAttempts: number;
  startTime: number;
  errors: Array<{ message: string, details?: any }>;
}

// Main handler for the Edge Function
Deno.serve(async (req: Request) => {
  try {
    // Validate JWT/Authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Bearer token required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse request parameters
    const url = new URL(req.url);
    const mode = url.searchParams.get('mode') as 'full' | 'delta' || 'full';
    const startTimestamp = url.searchParams.get('startTimestamp') || undefined;
    const endTimestamp = url.searchParams.get('endTimestamp') || undefined;

    // Validate parameters
    if (mode !== 'full' && mode !== 'delta') {
      return new Response(JSON.stringify({ error: 'Invalid mode parameter. Use "full" or "delta".' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (mode === 'delta' && !startTimestamp) {
      return new Response(JSON.stringify({ error: 'Delta mode requires startTimestamp parameter' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Initialize processing stats
    const stats: ProcessingStats = {
      locationsProcessed: 0,
      providersProcessed: 0,
      reportsProcessed: 0,
      recordsUpserted: 0,
      pagesTraversed: 0,
      retryAttempts: 0,
      startTime: Date.now(),
      errors: []
    };

    // Initialize services with hardcoded credentials
    const apiClient = new CqcApiClient(CQC_API_KEY);
    const dataProcessor = new DataProcessor();
    const dbInterface = new DatabaseInterface(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Execute the appropriate sync mode
    if (mode === 'full') {
      await fullSync(apiClient, dataProcessor, dbInterface, stats);
    } else if (startTimestamp) {
      await deltaSync(apiClient, dataProcessor, dbInterface, startTimestamp, endTimestamp, stats);
    }

    // Update stats with retry attempts
    stats.retryAttempts = apiClient.getRetryAttempts();

    // Calculate execution time
    const executionTime = Date.now() - stats.startTime;

    // Return success response with stats
    return new Response(JSON.stringify({
      status: 'success',
      mode,
      ...stats,
      executionTimeMs: executionTime,
      errorCount: stats.errors.length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error: any) {
    console.error('Sync failed:', error);
    
    return new Response(JSON.stringify({
      status: 'error',
      message: error?.message || 'Unknown error occurred',
      details: error?.stack || ''
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

// Full sync implementation - get all GP practices and update database
async function fullSync(
  apiClient: CqcApiClient, 
  dataProcessor: DataProcessor, 
  dbInterface: DatabaseInterface, 
  stats: ProcessingStats
): Promise<void> {
  // Fetch all GP locations
  const locations = await apiClient.fetchAllGpLocations();
  stats.pagesTraversed = Math.ceil(locations.length / 500);
  
  // Process locations in batches to avoid memory issues
  const batchSize = 50;
  for (let i = 0; i < locations.length; i += batchSize) {
    const batch = locations.slice(i, i + batchSize);
    const records = [];
    
    // Process each location
    for (const location of batch) {
      try {
        // Fetch detailed location data
        const locationDetail = await apiClient.fetchLocationById(location.locationId);
        stats.locationsProcessed++;
        
        // Fetch provider data
        let provider = null;
        if (locationDetail.providerId) {
          provider = await apiClient.fetchProviderById(locationDetail.providerId);
          stats.providersProcessed++;
        }
        
        // Fetch reports if available
        const reports = [];
        const reportLinks = [
          ...(locationDetail.reports || []),
          ...(provider?.reports || [])
        ];
        
        const uniqueReportIds = new Set();
        for (const report of reportLinks) {
          // Avoid duplicates
          if (report.reportLinkId && !uniqueReportIds.has(report.reportLinkId)) {
            uniqueReportIds.add(report.reportLinkId);
            try {
              const reportDetail = await apiClient.fetchReportById(report.reportLinkId);
              reports.push(reportDetail);
              stats.reportsProcessed++;
            } catch (error: any) {
              stats.errors.push({
                message: `Failed to fetch report ${report.reportLinkId}`,
                details: error?.message
              });
            }
          }
        }
        
        // Process and prepare record
        const record = dataProcessor.processLocation(locationDetail, provider, reports);
        records.push(record);
      } catch (error: any) {
        stats.errors.push({
          message: `Failed to process location ${location.locationId}`,
          details: error?.message
        });
      }
    }
    
    // Bulk upsert records
    if (records.length > 0) {
      try {
        const upsertCount = await dbInterface.bulkUpsertGpRecords(records);
        stats.recordsUpserted += upsertCount;
      } catch (error: any) {
        stats.errors.push({
          message: `Failed to upsert batch of ${records.length} records`,
          details: error?.message
        });
      }
    }
  }
}

// Delta sync implementation - get only changed records since last sync
async function deltaSync(
  apiClient: CqcApiClient, 
  dataProcessor: DataProcessor, 
  dbInterface: DatabaseInterface, 
  startTimestamp: string, 
  endTimestamp: string | undefined, 
  stats: ProcessingStats
): Promise<void> {
  // Fetch location changes
  const locationChanges = await apiClient.fetchLocationChanges(startTimestamp, endTimestamp);
  
  // Fetch provider changes
  const providerChanges = await apiClient.fetchProviderChanges(startTimestamp, endTimestamp);
  
  // Extract unique IDs
  const locationIds = new Set(locationChanges.map(change => change.id));
  const providerIds = new Set(providerChanges.map(change => change.id));
  
  // Process changed locations
  for (const locationId of locationIds) {
    try {
      // Fetch detailed location data
      const location = await apiClient.fetchLocationById(locationId);
      stats.locationsProcessed++;
      
      // Only process GP practices
      const isGpPractice = location.inspectionCategories?.some(
        (cat: any) => cat.name === 'GP Practices' || cat.name === 'GP practices'
      );
      
      if (!isGpPractice) {
        continue;
      }
      
      // Fetch provider data
      let provider = null;
      if (location.providerId) {
        provider = await apiClient.fetchProviderById(location.providerId);
        stats.providersProcessed++;
      }
      
      // Fetch reports if available
      const reports = [];
      const reportLinks = [
        ...(location.reports || []),
        ...(provider?.reports || [])
      ];
      
      const uniqueReportIds = new Set();
      for (const report of reportLinks) {
        // Avoid duplicates
        if (report.reportLinkId && !uniqueReportIds.has(report.reportLinkId)) {
          uniqueReportIds.add(report.reportLinkId);
          try {
            const reportDetail = await apiClient.fetchReportById(report.reportLinkId);
            reports.push(reportDetail);
            stats.reportsProcessed++;
          } catch (error: any) {
            stats.errors.push({
              message: `Failed to fetch report ${report.reportLinkId}`,
              details: error?.message
            });
          }
        }
      }
      
      // Process and prepare record
      const record = dataProcessor.processLocation(location, provider, reports);
      
      // Upsert single record
      await dbInterface.upsertGpRecord(record);
      stats.recordsUpserted++;
    } catch (error: any) {
      stats.errors.push({
        message: `Failed to process location ${locationId}`,
        details: error?.message
      });
    }
  }
  
  // Process providers that have changed but their locations weren't in the change list
  for (const providerId of providerIds) {
    try {
      const provider = await apiClient.fetchProviderById(providerId);
      stats.providersProcessed++;
      
      // Skip if this provider doesn't have locations or they were already processed
      if (!provider.locations || provider.locations.length === 0) {
        continue;
      }
      
      // Process only GP practice locations that weren't already processed
      for (const locationRef of provider.locations) {
        if (locationIds.has(locationRef.locationId)) {
          // Skip if already processed above
          continue;
        }
        
        // Check if this is a GP practice location
        try {
          const location = await apiClient.fetchLocationById(locationRef.locationId);
          stats.locationsProcessed++;
          
          // Only process GP practices
          const isGpPractice = location.inspectionCategories?.some(
            (cat: any) => cat.name === 'GP Practices' || cat.name === 'GP practices'
          );
          
          if (!isGpPractice) {
            continue;
          }
          
          // Fetch reports if available
          const reports = [];
          const reportLinks = [
            ...(location.reports || []),
            ...(provider.reports || [])
          ];
          
          const uniqueReportIds = new Set();
          for (const report of reportLinks) {
            // Avoid duplicates
            if (report.reportLinkId && !uniqueReportIds.has(report.reportLinkId)) {
              uniqueReportIds.add(report.reportLinkId);
              try {
                const reportDetail = await apiClient.fetchReportById(report.reportLinkId);
                reports.push(reportDetail);
                stats.reportsProcessed++;
              } catch (error: any) {
                stats.errors.push({
                  message: `Failed to fetch report ${report.reportLinkId}`,
                  details: error?.message
                });
              }
            }
          }
          
          // Process and prepare record
          const record = dataProcessor.processLocation(location, provider, reports);
          
          // Upsert single record
          await dbInterface.upsertGpRecord(record);
          stats.recordsUpserted++;
          
        } catch (error: any) {
          stats.errors.push({
            message: `Failed to process provider's location ${locationRef.locationId}`,
            details: error?.message
          });
        }
      }
    } catch (error: any) {
      stats.errors.push({
        message: `Failed to process provider ${providerId}`,
        details: error?.message
      });
    }
  }
}