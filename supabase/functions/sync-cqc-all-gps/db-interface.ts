// Database interface for interacting with Supabase
// Handles upserting records and checking for existing data

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { CqcGpRecord } from './data-processor.ts';

export class DatabaseInterface {
  private supabase: SupabaseClient;
  private tableName = '"CQC All GPs"';
  
  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  
  // Upsert a single GP record
  async upsertGpRecord(record: CqcGpRecord): Promise<void> {
    const { error } = await this.supabase
      .from(this.tableName)
      .upsert([record], {
        onConflict: 'location_id',
        ignoreDuplicates: false
      });
      
    if (error) {
      throw new Error(`Failed to upsert record ${record.location_id}: ${error.message}`);
    }
  }
  
  // Bulk upsert multiple GP records
  async bulkUpsertGpRecords(records: CqcGpRecord[]): Promise<number> {
    if (records.length === 0) {
      return 0;
    }
    
    // Split into chunks to avoid request size limits
    const chunkSize = 100;
    const chunks = [];
    
    for (let i = 0; i < records.length; i += chunkSize) {
      chunks.push(records.slice(i, i + chunkSize));
    }
    
    let totalUpserted = 0;
    
    for (const chunk of chunks) {
      const { error, count } = await this.supabase
        .from(this.tableName)
        .upsert(chunk, {
          onConflict: 'location_id',
          ignoreDuplicates: false,
          count: 'exact'
        });
        
      if (error) {
        throw new Error(`Failed to bulk upsert records: ${error.message}`);
      }
      
      totalUpserted += count || 0;
    }
    
    return totalUpserted;
  }
  
  // Check if a location exists in the database
  async locationExists(locationId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('location_id')
      .eq('location_id', locationId)
      .maybeSingle();
      
    if (error) {
      throw new Error(`Failed to check if location ${locationId} exists: ${error.message}`);
    }
    
    return !!data;
  }
  
  // Get the timestamp of the most recent record for incremental syncs
  async getLatestUpdateTimestamp(): Promise<string | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('updated_at')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();
      
    if (error) {
      // If no records exist, this is expected
      if (error.code === 'PGRST116') {
        return null;
      }
      
      throw new Error(`Failed to get latest update timestamp: ${error.message}`);
    }
    
    return data.updated_at;
  }
}