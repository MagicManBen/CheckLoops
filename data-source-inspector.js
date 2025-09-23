/**
 * CheckLoops Data Source Inspector
 *
 * This utility helps inspect and verify the data sources and settings
 * used by the CheckLoops application.
 */

// SQL to create site_settings table if it doesn't exist
const CREATE_SITE_SETTINGS_TABLE = `
-- Create site_settings table for feature toggles
CREATE TABLE IF NOT EXISTS site_settings (
  site_id INTEGER PRIMARY KEY,
  enable_achievements BOOLEAN DEFAULT true,
  enable_avatars BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_site_settings_site_id ON site_settings(site_id);

-- Enable Row Level Security
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to manage settings
CREATE POLICY "Admins can manage site settings" ON site_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM master_users
      WHERE master_users.user_id = auth.uid()
      AND master_users.site_id = site_settings.site_id
      AND master_users.role IN ('admin', 'owner')
    )
  );

-- Create policy for all users to read their site settings
CREATE POLICY "Users can view their site settings" ON site_settings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM master_users
      WHERE master_users.user_id = auth.uid()
      AND master_users.site_id = site_settings.site_id
    )
  );

-- Insert default settings for existing sites
INSERT INTO site_settings (site_id, enable_achievements, enable_avatars)
SELECT id, true, true FROM sites
ON CONFLICT (site_id) DO NOTHING;
`;

// Function to check if features are enabled
async function checkFeatureSettings(supabase, siteId) {
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .eq('site_id', siteId)
      .single();

    if (error) {
      console.log('No settings found, using defaults');
      return {
        enable_achievements: true,
        enable_avatars: true
      };
    }

    return data;
  } catch (error) {
    console.error('Error checking feature settings:', error);
    return {
      enable_achievements: true,
      enable_avatars: true
    };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CREATE_SITE_SETTINGS_TABLE,
    checkFeatureSettings
  };
}

// Instructions for manual setup
console.log(`
==============================================
SITE SETTINGS TABLE SETUP
==============================================

To enable the Achievements and Avatars toggles:

1. Go to your Supabase SQL Editor
2. Run the following SQL:

${CREATE_SITE_SETTINGS_TABLE}

3. The admin-dashboard will now show:
   - Enable Achievements toggle
   - Enable Avatars toggle

4. Settings apply to all users with the same site_id

==============================================
`);