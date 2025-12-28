-- ============================================
-- LOCAL VENDOR MANAGEMENT APP - DATABASE MIGRATION
-- Run this SQL in Supabase SQL Editor
-- ============================================

-- ============================================
-- MIGRATION 1: Enable UUID Extension
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- MIGRATION 2: Create Vendors Table
-- ============================================

CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(50) UNIQUE NOT NULL,
  pin_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  business_name VARCHAR(255) NOT NULL,
  phone VARCHAR(15),
  business_logo TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for login
CREATE INDEX idx_vendors_username ON vendors(username);

-- ============================================
-- MIGRATION 3: Create Accounts Table
-- ============================================
-- Accounts for tracking money (Cash, Axis Bank, PhonePe, etc.)
-- Type is free-text - vendors can name it anything

CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(100) NOT NULL,  -- Free text: "Cash", "Axis Bank", "PhonePe Business", etc.
  balance DECIMAL(12, 2) DEFAULT 0,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_accounts_vendor ON accounts(vendor_id);

-- Ensure only one default account per vendor
CREATE UNIQUE INDEX idx_accounts_default ON accounts(vendor_id) WHERE is_default = TRUE;

-- ============================================
-- MIGRATION 4: Create Customers Table
-- ============================================

CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(15),
  total_purchases INTEGER DEFAULT 0,
  total_spent DECIMAL(12, 2) DEFAULT 0,
  last_purchase_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast customer search by name
CREATE INDEX idx_customers_vendor ON customers(vendor_id);
CREATE INDEX idx_customers_name_search ON customers(vendor_id, LOWER(name));
CREATE INDEX idx_customers_phone ON customers(vendor_id, phone) WHERE phone IS NOT NULL;

-- ============================================
-- MIGRATION 5: Create Inventory Categories Table
-- ============================================

CREATE TABLE inventory_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inventory_categories_vendor ON inventory_categories(vendor_id);

-- ============================================
-- MIGRATION 6: Create Inventory Items Table
-- ============================================

CREATE TABLE inventory_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  category_id UUID REFERENCES inventory_categories(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  current_stock DECIMAL(10, 2) DEFAULT 0,
  min_stock_alert DECIMAL(10, 2) DEFAULT 0,
  unit VARCHAR(50) DEFAULT 'pcs',
  unit_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  cost_price DECIMAL(10, 2) DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inventory_vendor ON inventory_items(vendor_id);
CREATE INDEX idx_inventory_category ON inventory_items(category_id);
CREATE INDEX idx_inventory_low_stock ON inventory_items(vendor_id)
  WHERE current_stock <= min_stock_alert AND is_active = TRUE;

-- ============================================
-- MIGRATION 7: Create Sales Table
-- ============================================

CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  account_id UUID NOT NULL REFERENCES accounts(id),
  bill_number VARCHAR(50) NOT NULL,
  bill_id VARCHAR(20) UNIQUE NOT NULL,
  subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(12, 2) DEFAULT 0,
  discount_percent DECIMAL(5, 2) DEFAULT 0,
  tax_amount DECIMAL(12, 2) DEFAULT 0,
  total_amount DECIMAL(12, 2) NOT NULL,
  payment_status VARCHAR(20) DEFAULT 'paid' CHECK (payment_status IN ('paid', 'pending', 'partial')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sales_vendor ON sales(vendor_id);
CREATE INDEX idx_sales_customer ON sales(customer_id);
CREATE INDEX idx_sales_date ON sales(vendor_id, created_at DESC);
CREATE INDEX idx_sales_bill_id ON sales(bill_id);

-- ============================================
-- MIGRATION 8: Create Sale Items Table
-- ============================================

CREATE TABLE sale_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  inventory_item_id UUID REFERENCES inventory_items(id) ON DELETE SET NULL,
  item_name VARCHAR(255) NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX idx_sale_items_inventory ON sale_items(inventory_item_id);

-- ============================================
-- MIGRATION 9: Create Expenses Table
-- ============================================

CREATE TABLE expense_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id),
  category_id UUID REFERENCES expense_categories(id) ON DELETE SET NULL,
  category_name VARCHAR(100) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  description TEXT,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_expenses_vendor ON expenses(vendor_id);
CREATE INDEX idx_expenses_date ON expenses(vendor_id, expense_date DESC);
CREATE INDEX idx_expenses_category ON expenses(category_id);
CREATE INDEX idx_expense_categories_vendor ON expense_categories(vendor_id);

-- ============================================
-- MIGRATION 10: Create Income Table (Non-Sale Income)
-- ============================================

CREATE TABLE income (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id),
  sale_id UUID REFERENCES sales(id) ON DELETE SET NULL,
  amount DECIMAL(12, 2) NOT NULL,
  description TEXT,
  income_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_income_vendor ON income(vendor_id);
CREATE INDEX idx_income_date ON income(vendor_id, income_date DESC);

-- ============================================
-- MIGRATION 11: Create Scheduled Messages Table
-- ============================================

CREATE TABLE scheduled_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  message_type VARCHAR(50) NOT NULL CHECK (message_type IN ('maintenance', 'reminder', 'promotional', 'custom')),
  message_text TEXT NOT NULL,
  scheduled_date TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  aisensy_message_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_scheduled_messages_vendor ON scheduled_messages(vendor_id);
CREATE INDEX idx_scheduled_messages_pending ON scheduled_messages(scheduled_date, status)
  WHERE status = 'pending';

-- ============================================
-- MIGRATION 12: Create Message Logs Table
-- ============================================

CREATE TABLE message_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  scheduled_message_id UUID REFERENCES scheduled_messages(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_phone VARCHAR(15) NOT NULL,
  message_type VARCHAR(50) NOT NULL,
  message_text TEXT,
  cost DECIMAL(6, 4) DEFAULT 0,
  channel VARCHAR(20) DEFAULT 'whatsapp',
  status VARCHAR(50) NOT NULL,
  external_id VARCHAR(255),
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_message_logs_vendor ON message_logs(vendor_id);
CREATE INDEX idx_message_logs_date ON message_logs(vendor_id, sent_at DESC);

-- ============================================
-- MIGRATION 13: Create Message Templates Table
-- ============================================

CREATE TABLE message_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  message_type VARCHAR(50) NOT NULL,
  template_text TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_message_templates_vendor ON message_templates(vendor_id);

-- ============================================
-- MIGRATION 14: Create Vendor Sessions Table
-- ============================================
-- For authentication sessions

CREATE TABLE vendor_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vendor_sessions_token ON vendor_sessions(token);
CREATE INDEX idx_vendor_sessions_vendor ON vendor_sessions(vendor_id);

-- ============================================
-- MIGRATION 15: Updated At Trigger
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON vendors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON inventory_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- MIGRATION 16: Bill Number Sequence
-- ============================================
-- Each vendor has their own bill number sequence

CREATE TABLE bill_sequences (
  vendor_id UUID PRIMARY KEY REFERENCES vendors(id) ON DELETE CASCADE,
  last_number INTEGER DEFAULT 0,
  prefix VARCHAR(10) DEFAULT 'INV'
);

-- Function to get next bill number
CREATE OR REPLACE FUNCTION get_next_bill_number(p_vendor_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_prefix VARCHAR(10);
  v_number INTEGER;
BEGIN
  -- Insert or update sequence
  INSERT INTO bill_sequences (vendor_id, last_number, prefix)
  VALUES (p_vendor_id, 1, 'INV')
  ON CONFLICT (vendor_id)
  DO UPDATE SET last_number = bill_sequences.last_number + 1
  RETURNING prefix, last_number INTO v_prefix, v_number;

  RETURN v_prefix || '-' || LPAD(v_number::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- MIGRATION 17: Row Level Security (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE income ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_sequences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Note: These policies use a custom claim 'vendor_id' that should be set in the JWT
-- For service role, all access is granted automatically

-- Helper function to get current vendor_id from JWT or session
CREATE OR REPLACE FUNCTION auth.vendor_id()
RETURNS UUID AS $$
BEGIN
  RETURN NULLIF(current_setting('app.current_vendor_id', TRUE), '')::UUID;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Accounts policies
CREATE POLICY "Vendors can view own accounts" ON accounts
  FOR SELECT USING (vendor_id = auth.vendor_id());
CREATE POLICY "Vendors can insert own accounts" ON accounts
  FOR INSERT WITH CHECK (vendor_id = auth.vendor_id());
CREATE POLICY "Vendors can update own accounts" ON accounts
  FOR UPDATE USING (vendor_id = auth.vendor_id());
CREATE POLICY "Vendors can delete own accounts" ON accounts
  FOR DELETE USING (vendor_id = auth.vendor_id());

-- Customers policies
CREATE POLICY "Vendors can view own customers" ON customers
  FOR SELECT USING (vendor_id = auth.vendor_id());
CREATE POLICY "Vendors can insert own customers" ON customers
  FOR INSERT WITH CHECK (vendor_id = auth.vendor_id());
CREATE POLICY "Vendors can update own customers" ON customers
  FOR UPDATE USING (vendor_id = auth.vendor_id());
CREATE POLICY "Vendors can delete own customers" ON customers
  FOR DELETE USING (vendor_id = auth.vendor_id());

-- Inventory Categories
CREATE POLICY "Vendors can manage own inventory categories" ON inventory_categories
  FOR ALL USING (vendor_id = auth.vendor_id());

-- Inventory Items
CREATE POLICY "Vendors can manage own inventory" ON inventory_items
  FOR ALL USING (vendor_id = auth.vendor_id());

-- Sales
CREATE POLICY "Vendors can manage own sales" ON sales
  FOR ALL USING (vendor_id = auth.vendor_id());

-- Sale Items (needs join through sales)
CREATE POLICY "Vendors can manage own sale items" ON sale_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM sales WHERE sales.id = sale_items.sale_id
      AND sales.vendor_id = auth.vendor_id()
    )
  );

-- Expense Categories
CREATE POLICY "Vendors can manage own expense categories" ON expense_categories
  FOR ALL USING (vendor_id = auth.vendor_id());

-- Expenses
CREATE POLICY "Vendors can manage own expenses" ON expenses
  FOR ALL USING (vendor_id = auth.vendor_id());

-- Income
CREATE POLICY "Vendors can manage own income" ON income
  FOR ALL USING (vendor_id = auth.vendor_id());

-- Scheduled Messages
CREATE POLICY "Vendors can manage own messages" ON scheduled_messages
  FOR ALL USING (vendor_id = auth.vendor_id());

-- Message Logs
CREATE POLICY "Vendors can view own message logs" ON message_logs
  FOR SELECT USING (vendor_id = auth.vendor_id());

-- Message Templates
CREATE POLICY "Vendors can manage own templates" ON message_templates
  FOR ALL USING (vendor_id = auth.vendor_id());

-- Bill Sequences
CREATE POLICY "Vendors can manage own bill sequence" ON bill_sequences
  FOR ALL USING (vendor_id = auth.vendor_id());

-- ============================================
-- MIGRATION 18: Default Data Function
-- ============================================
-- Creates default accounts and categories for new vendor

CREATE OR REPLACE FUNCTION create_vendor_defaults(p_vendor_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Create default accounts (vendor can add more with any name/type)
  INSERT INTO accounts (vendor_id, name, type, is_default) VALUES
    (p_vendor_id, 'Cash', 'Cash', TRUE);

  -- Create default expense categories
  INSERT INTO expense_categories (vendor_id, name) VALUES
    (p_vendor_id, 'Rent'),
    (p_vendor_id, 'Electricity'),
    (p_vendor_id, 'Supplies'),
    (p_vendor_id, 'Salary'),
    (p_vendor_id, 'Transport'),
    (p_vendor_id, 'Other');

  -- Initialize bill sequence
  INSERT INTO bill_sequences (vendor_id, last_number, prefix)
  VALUES (p_vendor_id, 0, 'INV');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- MIGRATION 19: Create Initial Admin User
-- ============================================
-- Password: 12345 (hashed with bcrypt)
-- You should change this after first login

DO $$
DECLARE
  admin_id UUID;
BEGIN
  -- Insert admin user with PIN hash for '12345'
  -- bcrypt hash of '12345' with 10 rounds
  INSERT INTO vendors (username, pin_hash, name, business_name, is_admin, is_active)
  VALUES ('admin', '$2a$10$rQEY7DLHZ8oPx8rNQ.TSAO4Q4YG/V0VzFHwLGFg8bLzVxqq3YiQmO', 'Admin', 'System Admin', TRUE, TRUE)
  RETURNING id INTO admin_id;

  -- Create defaults for admin
  PERFORM create_vendor_defaults(admin_id);
END $$;

-- ============================================
-- END OF MIGRATIONS
-- ============================================
