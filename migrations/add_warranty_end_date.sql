-- Migration: Add warranty_end_date to sale_items for custom warranty expiry dates
-- Run this in Supabase SQL Editor

-- 1. Add warranty_end_date column to sale_items table
-- This allows overriding the calculated warranty expiry (purchase_date + warranty_months)
ALTER TABLE sale_items
ADD COLUMN IF NOT EXISTS warranty_end_date DATE;

-- 2. Update the get_warranty_expiry function to use warranty_end_date if set
CREATE OR REPLACE FUNCTION get_warranty_expiry(sale_item_id UUID)
RETURNS TIMESTAMPTZ AS $$
DECLARE
  warranty_end DATE;
  warranty_months_val INTEGER;
  sale_date TIMESTAMPTZ;
BEGIN
  SELECT si.warranty_end_date, si.warranty_months, s.sale_date
  INTO warranty_end, warranty_months_val, sale_date
  FROM sale_items si
  JOIN sales s ON s.id = si.sale_id
  WHERE si.id = sale_item_id;

  -- If a custom warranty_end_date is set, use it
  IF warranty_end IS NOT NULL THEN
    RETURN warranty_end::TIMESTAMPTZ;
  END IF;

  -- Otherwise, calculate from sale_date + warranty_months
  IF warranty_months_val IS NULL OR warranty_months_val = 0 THEN
    RETURN NULL;
  END IF;

  RETURN sale_date + (warranty_months_val || ' months')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

-- 3. Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_sale_items_warranty_end_date
ON sale_items(warranty_end_date)
WHERE warranty_end_date IS NOT NULL;

-- Add comment
COMMENT ON COLUMN sale_items.warranty_end_date IS 'Custom warranty expiry date. If set, overrides the calculated date (sale_date + warranty_months).';

-- Verify
SELECT 'Migration completed successfully!' as status;
