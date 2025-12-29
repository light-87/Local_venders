-- Migration: Add transactions table and update accounts
-- Date: 2024-12-29
-- Description: Creates the unified transactions table for income/expense tracking
--              and makes the accounts.type column optional

-- ============================================
-- 1. Create transactions table
-- ============================================
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
  sale_id UUID REFERENCES sales(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_transactions_vendor_id ON transactions(vendor_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_sale_id ON transactions(sale_id);

-- Enable Row Level Security
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (vendors can only see their own transactions)
CREATE POLICY "Vendors can view own transactions" ON transactions
  FOR SELECT USING (vendor_id = auth.uid());

CREATE POLICY "Vendors can insert own transactions" ON transactions
  FOR INSERT WITH CHECK (vendor_id = auth.uid());

CREATE POLICY "Vendors can update own transactions" ON transactions
  FOR UPDATE USING (vendor_id = auth.uid());

CREATE POLICY "Vendors can delete own transactions" ON transactions
  FOR DELETE USING (vendor_id = auth.uid());

-- ============================================
-- 2. Update accounts table - make type optional
-- ============================================
-- Set default value for type column
ALTER TABLE accounts ALTER COLUMN type SET DEFAULT 'Account';

-- Make type column nullable (optional)
ALTER TABLE accounts ALTER COLUMN type DROP NOT NULL;

-- ============================================
-- 3. Migrate existing expenses to transactions (optional)
-- ============================================
-- This migrates any existing expenses to the new transactions table
-- Uncomment and run if you want to migrate existing data

/*
INSERT INTO transactions (vendor_id, account_id, name, description, type, amount, transaction_date, created_at)
SELECT
  vendor_id,
  account_id,
  COALESCE(category_name, 'Expense') as name,
  description,
  'expense' as type,
  amount,
  expense_date as transaction_date,
  created_at
FROM expenses
WHERE NOT EXISTS (
  SELECT 1 FROM transactions t
  WHERE t.vendor_id = expenses.vendor_id
  AND t.amount = expenses.amount
  AND t.transaction_date = expenses.expense_date
);
*/

-- ============================================
-- 4. Migrate existing income records to transactions (optional)
-- ============================================
-- This migrates any existing income records to the new transactions table
-- Uncomment and run if you want to migrate existing data

/*
INSERT INTO transactions (vendor_id, account_id, sale_id, name, description, type, amount, transaction_date, created_at)
SELECT
  vendor_id,
  account_id,
  sale_id,
  COALESCE(description, 'Income') as name,
  description,
  'income' as type,
  amount,
  income_date as transaction_date,
  created_at
FROM income
WHERE NOT EXISTS (
  SELECT 1 FROM transactions t
  WHERE t.vendor_id = income.vendor_id
  AND t.sale_id = income.sale_id
);
*/

-- ============================================
-- Notes:
-- ============================================
-- 1. The transactions table unifies income and expenses into a single view
-- 2. Sales automatically create 'income' type transactions
-- 3. Manual transactions can be 'income' or 'expense' type
-- 4. The accounts.type field is now optional (legacy support)
-- 5. RLS policies ensure vendors only see their own data
