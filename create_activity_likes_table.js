/**
 * Script to create the activity_likes table in Supabase
 * Run this script to set up the database structure for activity likes
 */

// Get Supabase configuration from environment or config file
const CONFIG = require('./config.js');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role key for admin privileges
const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_SERVICE_KEY);

async function createActivityLikesTable() {
  try {
    console.log('Creating activity_likes table...');
    
    // Create the table using Supabase PostgreSQL
    const { error } = await supabase.rpc('create_activity_likes_table', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.activity_likes (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          site_id TEXT NOT NULL,
          activity_type TEXT NOT NULL,
          activity_id TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
          
          -- Add a unique constraint to prevent duplicate likes
          CONSTRAINT unique_activity_like UNIQUE (user_id, activity_type, activity_id)
        );
        
        -- Add RLS policies for security
        ALTER TABLE public.activity_likes ENABLE ROW LEVEL SECURITY;
        
        -- Policy to allow users to see all likes for their site
        CREATE POLICY "Users can view likes for their site" ON public.activity_likes
          FOR SELECT USING (
            site_id IN (
              SELECT site_id FROM public.master_users
              WHERE auth_user_id = auth.uid()
            )
          );
        
        -- Policy to allow users to create their own likes
        CREATE POLICY "Users can create their own likes" ON public.activity_likes
          FOR INSERT WITH CHECK (
            auth.uid() = user_id AND
            site_id IN (
              SELECT site_id FROM public.master_users
              WHERE auth_user_id = auth.uid()
            )
          );
        
        -- Policy to allow users to delete their own likes
        CREATE POLICY "Users can delete their own likes" ON public.activity_likes
          FOR DELETE USING (
            auth.uid() = user_id
          );
          
        -- Create index for faster queries
        CREATE INDEX idx_activity_likes_activity ON public.activity_likes(activity_type, activity_id);
        CREATE INDEX idx_activity_likes_user ON public.activity_likes(user_id);
        CREATE INDEX idx_activity_likes_site ON public.activity_likes(site_id);
      `
    });
    
    if (error) {
      console.error('Error creating activity_likes table:', error);
    } else {
      console.log('Successfully created activity_likes table!');
    }
    
    // Set up realtime subscriptions for the table
    const { error: realtimeError } = await supabase.rpc('enable_realtime_for_table', {
      table_name: 'activity_likes'
    });
    
    if (realtimeError) {
      console.error('Error enabling realtime for activity_likes:', realtimeError);
    } else {
      console.log('Successfully enabled realtime for activity_likes!');
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the function
createActivityLikesTable()
  .then(() => console.log('Script completed'))
  .catch(err => console.error('Script failed:', err));