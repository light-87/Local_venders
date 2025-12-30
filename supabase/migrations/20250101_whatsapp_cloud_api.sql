-- Migration: Add WhatsApp Cloud API support
-- Date: 2025-01-01
-- Description: Adds WhatsApp credentials to vendors table and updates message tables

-- ============================================
-- 1. Add WhatsApp credentials to vendors table
-- ============================================
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS whatsapp_phone_number_id VARCHAR(50);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS whatsapp_access_token TEXT;

-- ============================================
-- 2. Rename aisensy_message_id to external_message_id (more generic)
-- ============================================
ALTER TABLE scheduled_messages RENAME COLUMN aisensy_message_id TO external_message_id;

-- ============================================
-- 3. Add template fields to scheduled_messages
-- ============================================
-- For WhatsApp Cloud API, we need to store template name and parameters
ALTER TABLE scheduled_messages ADD COLUMN IF NOT EXISTS template_name VARCHAR(100);
ALTER TABLE scheduled_messages ADD COLUMN IF NOT EXISTS template_params JSONB DEFAULT '[]'::jsonb;
ALTER TABLE scheduled_messages ADD COLUMN IF NOT EXISTS template_language VARCHAR(10) DEFAULT 'en';

-- ============================================
-- 4. Create vendor_whatsapp_templates table
-- ============================================
-- Stores the template names vendors have created in WhatsApp Manager
CREATE TABLE IF NOT EXISTS vendor_whatsapp_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  template_name VARCHAR(100) NOT NULL,  -- Name in WhatsApp Manager
  display_name VARCHAR(100) NOT NULL,   -- Friendly name for UI
  description TEXT,                      -- What this template is for
  category VARCHAR(20) DEFAULT 'UTILITY' CHECK (category IN ('MARKETING', 'UTILITY', 'AUTHENTICATION')),
  param_count INTEGER DEFAULT 0,         -- Number of parameters needed
  sample_params TEXT[],                  -- Example values for each param
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(vendor_id, template_name)
);

CREATE INDEX IF NOT EXISTS idx_vendor_whatsapp_templates_vendor ON vendor_whatsapp_templates(vendor_id);

-- Enable RLS
ALTER TABLE vendor_whatsapp_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Vendors can manage own whatsapp templates" ON vendor_whatsapp_templates
  FOR ALL USING (vendor_id = public.get_current_vendor_id());

-- Add updated_at trigger
CREATE TRIGGER update_vendor_whatsapp_templates_updated_at
  BEFORE UPDATE ON vendor_whatsapp_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. Update message_logs for WhatsApp Cloud API
-- ============================================
-- Add WhatsApp-specific fields
ALTER TABLE message_logs ADD COLUMN IF NOT EXISTS template_name VARCHAR(100);
ALTER TABLE message_logs ADD COLUMN IF NOT EXISTS whatsapp_message_id VARCHAR(255);

-- ============================================
-- Notes:
-- ============================================
-- 1. whatsapp_phone_number_id: The Phone Number ID from Meta Developer Console
-- 2. whatsapp_access_token: Permanent access token (System User token)
-- 3. template_name: Must match exactly with WhatsApp Manager template name
-- 4. template_params: JSON array of parameter values, e.g., ["AC Unit", "filter cleaning"]
-- 5. template_language: Language code, e.g., "en", "en_US", "hi"
