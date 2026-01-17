-- ============================================
-- MIGRATION: Add UPI ID for Payment Links
-- ============================================
-- Adds upi_id column to vendors table for generating payment links in bills

ALTER TABLE vendors ADD COLUMN IF NOT EXISTS upi_id VARCHAR(100);

-- Add a comment explaining the column
COMMENT ON COLUMN vendors.upi_id IS 'UPI VPA for payment links (e.g., name@okhdfcbank)';
