-- Multi-Language Maintenance Template Migration
-- Run this manually in Supabase SQL Editor

-- Step 1: Add language column to message_templates table
-- This allows storing multiple templates per vendor (one per language)
ALTER TABLE message_templates
ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'en';

-- Step 2: Add unique constraint to prevent duplicate templates per language
-- First, we need to handle any existing duplicates
-- This constraint ensures each vendor can only have one template per message_type per language
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_vendor_message_type_language'
  ) THEN
    ALTER TABLE message_templates
    ADD CONSTRAINT unique_vendor_message_type_language
    UNIQUE (vendor_id, message_type, language);
  END IF;
END $$;

-- Step 3: Add preferred template language to vendors table
-- This tracks which language the vendor is currently using
ALTER TABLE vendors
ADD COLUMN IF NOT EXISTS preferred_template_language VARCHAR(10) DEFAULT 'en';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_message_templates_language
ON message_templates(vendor_id, message_type, language);

-- Verification queries (optional - run these to verify the migration worked)
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'message_templates';
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'vendors';
