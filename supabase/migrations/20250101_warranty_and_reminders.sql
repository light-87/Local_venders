-- Migration: Add warranty tracking and enhanced reminders
-- Date: 2025-01-01
-- Description:
--   1. Add warranty fields to sale_items
--   2. Enhance scheduled_messages for manual WhatsApp reminders
--   3. Add maintenance scheduling support

-- ============================================
-- PART 1: Add warranty fields to sale_items
-- ============================================

-- Add warranty_months column (0 = no warranty, 6 = 6 months, 12 = 1 year, etc.)
ALTER TABLE sale_items
ADD COLUMN IF NOT EXISTS warranty_months INTEGER DEFAULT 0;

-- Add maintenance_interval_months column (NULL = no recurring, 3 = every 3 months)
ALTER TABLE sale_items
ADD COLUMN IF NOT EXISTS maintenance_interval_months INTEGER;

-- Add discount_percent column if not exists (for completeness)
ALTER TABLE sale_items
ADD COLUMN IF NOT EXISTS discount_percent DECIMAL(5, 2) DEFAULT 0;

-- ============================================
-- PART 2: Enhance scheduled_messages table
-- ============================================

-- Update status check constraint to include new statuses
ALTER TABLE scheduled_messages
DROP CONSTRAINT IF EXISTS scheduled_messages_status_check;

ALTER TABLE scheduled_messages
ADD CONSTRAINT scheduled_messages_status_check
CHECK (status IN ('pending', 'sent', 'completed', 'overdue', 'deleted', 'failed', 'cancelled'));

-- Add reminder_type to distinguish different kinds of reminders
ALTER TABLE scheduled_messages
ADD COLUMN IF NOT EXISTS reminder_type VARCHAR(50) DEFAULT 'custom'
CHECK (reminder_type IN ('maintenance', 'payment', 'follow_up', 'custom'));

-- Add reference to the sale and sale item for maintenance reminders
ALTER TABLE scheduled_messages
ADD COLUMN IF NOT EXISTS related_sale_id UUID REFERENCES sales(id) ON DELETE SET NULL;

ALTER TABLE scheduled_messages
ADD COLUMN IF NOT EXISTS related_sale_item_id UUID REFERENCES sale_items(id) ON DELETE SET NULL;

-- Track how many times this reminder was sent (for follow-ups)
ALTER TABLE scheduled_messages
ADD COLUMN IF NOT EXISTS sent_count INTEGER DEFAULT 0;

-- Store the item name for quick display (denormalized for convenience)
ALTER TABLE scheduled_messages
ADD COLUMN IF NOT EXISTS item_name VARCHAR(255);

-- Store the maintenance/appointment time slot
ALTER TABLE scheduled_messages
ADD COLUMN IF NOT EXISTS time_slot VARCHAR(100);

-- Track when the reminder was last sent via WhatsApp
ALTER TABLE scheduled_messages
ADD COLUMN IF NOT EXISTS last_sent_at TIMESTAMPTZ;

-- Track when maintenance was completed
ALTER TABLE scheduled_messages
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- ============================================
-- PART 3: Indexes for performance
-- ============================================

-- Index for finding reminders by status and date
CREATE INDEX IF NOT EXISTS idx_scheduled_messages_status_date
ON scheduled_messages(status, scheduled_date);

-- Index for finding reminders by sale item
CREATE INDEX IF NOT EXISTS idx_scheduled_messages_sale_item
ON scheduled_messages(related_sale_item_id)
WHERE related_sale_item_id IS NOT NULL;

-- Index for finding reminders by reminder type
CREATE INDEX IF NOT EXISTS idx_scheduled_messages_reminder_type
ON scheduled_messages(reminder_type, status);

-- ============================================
-- PART 4: Helper function to calculate warranty expiry
-- ============================================

-- Function to get warranty expiry date for a sale item
CREATE OR REPLACE FUNCTION get_warranty_expiry(sale_item_id UUID)
RETURNS TIMESTAMPTZ AS $$
DECLARE
  warranty_months_val INTEGER;
  sale_date TIMESTAMPTZ;
BEGIN
  SELECT si.warranty_months, s.created_at
  INTO warranty_months_val, sale_date
  FROM sale_items si
  JOIN sales s ON s.id = si.sale_id
  WHERE si.id = sale_item_id;

  IF warranty_months_val IS NULL OR warranty_months_val = 0 THEN
    RETURN NULL;
  END IF;

  RETURN sale_date + (warranty_months_val || ' months')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

-- Function to check if warranty is active
CREATE OR REPLACE FUNCTION is_warranty_active(sale_item_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  expiry_date TIMESTAMPTZ;
BEGIN
  expiry_date := get_warranty_expiry(sale_item_id);

  IF expiry_date IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN expiry_date > NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PART 5: Function to auto-generate maintenance reminders
-- ============================================

-- Function to create next maintenance reminder for a sale item
CREATE OR REPLACE FUNCTION create_next_maintenance_reminder(
  p_sale_item_id UUID,
  p_from_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS UUID AS $$
DECLARE
  v_sale_item RECORD;
  v_sale RECORD;
  v_customer RECORD;
  v_next_date TIMESTAMPTZ;
  v_reminder_id UUID;
  v_message_text TEXT;
BEGIN
  -- Get sale item details
  SELECT * INTO v_sale_item FROM sale_items WHERE id = p_sale_item_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sale item not found';
  END IF;

  -- Check if maintenance interval is set
  IF v_sale_item.maintenance_interval_months IS NULL OR v_sale_item.maintenance_interval_months = 0 THEN
    RETURN NULL;
  END IF;

  -- Get sale and customer details
  SELECT * INTO v_sale FROM sales WHERE id = v_sale_item.sale_id;
  SELECT * INTO v_customer FROM customers WHERE id = v_sale.customer_id;

  -- Calculate next maintenance date
  v_next_date := p_from_date + (v_sale_item.maintenance_interval_months || ' months')::INTERVAL;

  -- Create reminder message
  v_message_text := format(
    'Hi %s, your %s is due for maintenance. Please schedule a visit at your convenience.',
    v_customer.name,
    v_sale_item.item_name
  );

  -- Insert the reminder
  INSERT INTO scheduled_messages (
    vendor_id,
    customer_id,
    message_type,
    message_text,
    scheduled_date,
    status,
    reminder_type,
    related_sale_id,
    related_sale_item_id,
    item_name
  ) VALUES (
    v_sale.vendor_id,
    v_sale.customer_id,
    'maintenance',
    v_message_text,
    v_next_date,
    'pending',
    'maintenance',
    v_sale.id,
    p_sale_item_id,
    v_sale_item.item_name
  )
  RETURNING id INTO v_reminder_id;

  RETURN v_reminder_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON COLUMN sale_items.warranty_months IS 'Warranty period in months. 0 or NULL means no warranty.';
COMMENT ON COLUMN sale_items.maintenance_interval_months IS 'How often maintenance should be done, in months. NULL means no recurring maintenance.';
COMMENT ON COLUMN scheduled_messages.reminder_type IS 'Type of reminder: maintenance, payment, follow_up, custom';
COMMENT ON COLUMN scheduled_messages.sent_count IS 'Number of times this reminder was sent (increments on each follow-up)';
COMMENT ON COLUMN scheduled_messages.item_name IS 'Denormalized item name for quick display in reminder lists';
