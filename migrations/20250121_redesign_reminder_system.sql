-- ============================================
-- MIGRATION: Redesign Reminder System
-- Date: 2025-01-21
-- Description:
--   1. Add address field to customers
--   2. Add sale_type to sales for record-only entries
--   3. Add service_reminders JSON to sale_items for multiple reminders per item
-- ============================================

-- ============================================
-- 1. Add address column to customers table
-- ============================================
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS address TEXT;

-- Add index for address search (optional, can be removed if not needed)
CREATE INDEX IF NOT EXISTS idx_customers_address ON customers(vendor_id) WHERE address IS NOT NULL;

-- ============================================
-- 2. Add sale_type column to sales table
-- Values: 'regular' (default) or 'service_record' (for existing customers, no inventory/income impact)
-- ============================================
ALTER TABLE sales
ADD COLUMN IF NOT EXISTS sale_type VARCHAR(20) DEFAULT 'regular'
CHECK (sale_type IN ('regular', 'service_record'));

-- Add index for filtering by sale type
CREATE INDEX IF NOT EXISTS idx_sales_type ON sales(vendor_id, sale_type);

-- ============================================
-- 3. Add service_reminders JSON column to sale_items table
-- Format: [{ "label": "Membrane Filter", "interval_months": 6 }, ...]
-- This allows multiple service reminders per item
-- ============================================
ALTER TABLE sale_items
ADD COLUMN IF NOT EXISTS service_reminders JSONB DEFAULT '[]'::jsonb;

-- ============================================
-- 4. Update discount_description column if not exists
-- (Adding this as it might be missing in some setups)
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sales' AND column_name = 'discount_description'
  ) THEN
    ALTER TABLE sales ADD COLUMN discount_description TEXT;
  END IF;
END $$;

-- ============================================
-- END OF MIGRATION
-- ============================================
