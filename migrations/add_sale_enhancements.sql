-- Migration: Add sale enhancements (discount description, sale date)
-- Run this in Supabase SQL Editor

-- 1. Add discount_description column to sales table
ALTER TABLE sales
ADD COLUMN IF NOT EXISTS discount_description TEXT;

-- 2. Add sale_date column to sales table (for custom sale dates)
-- This allows backdating sales while keeping created_at as the record creation timestamp
ALTER TABLE sales
ADD COLUMN IF NOT EXISTS sale_date DATE DEFAULT CURRENT_DATE;

-- 3. Update existing sales to have sale_date based on created_at
UPDATE sales
SET sale_date = DATE(created_at AT TIME ZONE 'Asia/Kolkata')
WHERE sale_date IS NULL;

-- 4. Add expense_id to transactions table to link expenses with transactions
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS expense_id UUID REFERENCES expenses(id) ON DELETE CASCADE;

-- 5. Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_transactions_expense_id ON transactions(expense_id);
CREATE INDEX IF NOT EXISTS idx_sales_sale_date ON sales(sale_date);

-- 6. Backfill: Create transaction records for existing expenses that don't have them
INSERT INTO transactions (vendor_id, account_id, expense_id, name, description, type, amount, transaction_date, created_at)
SELECT
    e.vendor_id,
    e.account_id,
    e.id as expense_id,
    e.category_name as name,
    e.description,
    'expense' as type,
    e.amount,
    e.expense_date as transaction_date,
    e.created_at
FROM expenses e
LEFT JOIN transactions t ON t.expense_id = e.id
WHERE t.id IS NULL;

-- Verify the migration
SELECT 'Migration completed successfully!' as status;
SELECT
    (SELECT COUNT(*) FROM sales WHERE discount_description IS NOT NULL) as sales_with_description,
    (SELECT COUNT(*) FROM sales WHERE sale_date IS NOT NULL) as sales_with_date,
    (SELECT COUNT(*) FROM transactions WHERE expense_id IS NOT NULL) as expense_transactions;
