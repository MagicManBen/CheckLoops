-- Mandatory Training Tables for CheckLoop
-- Run these commands in your Supabase SQL editor

-- 1. Training Types Table
CREATE TABLE training_types (
    id SERIAL PRIMARY KEY,
    site_id INTEGER NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    validity_months INTEGER, -- How many months the training is valid for (NULL = no expiry)
    is_clinical_required BOOLEAN DEFAULT FALSE, -- Required for clinical staff
    is_non_clinical_required BOOLEAN DEFAULT FALSE, -- Required for non-clinical staff
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Training Records Table
CREATE TABLE training_records (
    id SERIAL PRIMARY KEY,
    site_id INTEGER NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    staff_id INTEGER NOT NULL REFERENCES kiosk_users(id) ON DELETE CASCADE,
    training_type_id INTEGER NOT NULL REFERENCES training_types(id) ON DELETE CASCADE,
    completion_date DATE NOT NULL,
    expiry_date DATE, -- Calculated or manually set
    certificate_url TEXT, -- URL to the uploaded certificate
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(site_id, staff_id, training_type_id) -- One record per staff/training combination
);

-- 3. Add indexes for performance
CREATE INDEX idx_training_types_site_id ON training_types(site_id);
CREATE INDEX idx_training_records_site_id ON training_records(site_id);
CREATE INDEX idx_training_records_staff_id ON training_records(staff_id);
CREATE INDEX idx_training_records_training_type_id ON training_records(training_type_id);
CREATE INDEX idx_training_records_expiry_date ON training_records(expiry_date);

-- 4. Add RLS (Row Level Security) policies
ALTER TABLE training_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_records ENABLE ROW LEVEL SECURITY;

-- Policies for training_types
CREATE POLICY "Users can view training types for their site" ON training_types
    FOR SELECT USING (site_id IN (SELECT site_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage training types for their site" ON training_types
    FOR ALL USING (site_id IN (SELECT site_id FROM profiles WHERE user_id = auth.uid()));

-- Policies for training_records
CREATE POLICY "Users can view training records for their site" ON training_records
    FOR SELECT USING (site_id IN (SELECT site_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage training records for their site" ON training_records
    FOR ALL USING (site_id IN (SELECT site_id FROM profiles WHERE user_id = auth.uid()));

-- 5. Add some default training types 
-- First, let's find your actual site_id and insert the training types
DO $$
DECLARE
    actual_site_id INTEGER;
BEGIN
    -- Get the first site_id from your sites table
    SELECT id INTO actual_site_id FROM sites LIMIT 1;
    
    -- If no sites exist, show an error
    IF actual_site_id IS NULL THEN
        RAISE EXCEPTION 'No sites found in the sites table. Please create a site first.';
    END IF;
    
    -- Insert training types using the actual site_id
    INSERT INTO training_types (site_id, name, description, validity_months, is_clinical_required, is_non_clinical_required) VALUES
    (actual_site_id, 'Basic Life Support (BLS)', 'Adult and paediatric basic life support training', 12, TRUE, FALSE),
    (actual_site_id, 'Safeguarding Adults Level 1', 'Basic awareness of adult safeguarding', 36, TRUE, TRUE),
    (actual_site_id, 'Safeguarding Children Level 1', 'Basic awareness of child safeguarding', 36, TRUE, TRUE),
    (actual_site_id, 'Safeguarding Children Level 2', 'Working with children safeguarding training', 36, TRUE, FALSE),
    (actual_site_id, 'Fire Safety Training', 'Fire safety awareness and evacuation procedures', 12, TRUE, TRUE),
    (actual_site_id, 'Manual Handling', 'Safe manual handling techniques', 36, TRUE, TRUE),
    (actual_site_id, 'Infection Prevention & Control Level 1', 'Basic IPC principles', 12, TRUE, TRUE),
    (actual_site_id, 'Infection Prevention & Control Level 2', 'Advanced IPC for clinical staff', 12, TRUE, FALSE),
    (actual_site_id, 'GDPR & Data Protection', 'Data protection and patient confidentiality', 24, TRUE, TRUE),
    (actual_site_id, 'Health & Safety', 'Workplace health and safety awareness', 36, TRUE, TRUE),
    (actual_site_id, 'Anaphylaxis Management', 'Recognition and treatment of anaphylaxis', 12, TRUE, FALSE),
    (actual_site_id, 'Mental Health First Aid', 'Mental health awareness and first aid', 36, TRUE, FALSE),
    (actual_site_id, 'Dementia Awareness', 'Understanding and supporting patients with dementia', 36, TRUE, FALSE),
    (actual_site_id, 'Violence & Aggression Management', 'De-escalation and personal safety', 12, TRUE, TRUE),
    (actual_site_id, 'Equality & Diversity', 'Promoting equality and inclusion', 36, TRUE, TRUE);
    
    RAISE NOTICE 'Successfully created training types for site_id: %', actual_site_id;
END $$;

-- 6. Update function for automatic timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_training_types_updated_at
    BEFORE UPDATE ON training_types
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_training_records_updated_at
    BEFORE UPDATE ON training_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
