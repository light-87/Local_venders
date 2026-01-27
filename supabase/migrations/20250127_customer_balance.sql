-- Customer Balance Feature Migration
-- Adds support for tracking customer balances and partial payments

-- 1. Add balance_amount column to customers table
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS balance_amount DECIMAL(12, 2) DEFAULT 0;

-- 2. Add amount_paid and balance_amount to sales table
ALTER TABLE sales
ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(12, 2),
ADD COLUMN IF NOT EXISTS balance_amount DECIMAL(12, 2) DEFAULT 0;

-- Set amount_paid = total_amount for existing sales (they were fully paid)
UPDATE sales
SET amount_paid = total_amount, balance_amount = 0
WHERE amount_paid IS NULL;

-- 3. Create customer_balance_transactions table
CREATE TABLE IF NOT EXISTS customer_balance_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    sale_id UUID REFERENCES sales(id) ON DELETE SET NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('sale', 'payment')),
    amount DECIMAL(12, 2) NOT NULL,
    running_balance DECIMAL(12, 2) NOT NULL,
    notes TEXT,
    payment_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_customer_balance_transactions_customer
ON customer_balance_transactions(customer_id);

CREATE INDEX IF NOT EXISTS idx_customer_balance_transactions_vendor
ON customer_balance_transactions(vendor_id);

CREATE INDEX IF NOT EXISTS idx_customer_balance_transactions_created
ON customer_balance_transactions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_customers_balance
ON customers(vendor_id, balance_amount)
WHERE balance_amount > 0;

-- 5. Create function to update customer balance
CREATE OR REPLACE FUNCTION update_customer_balance()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.type = 'sale' THEN
            -- Sale adds to balance (customer owes more)
            UPDATE customers
            SET balance_amount = balance_amount + NEW.amount,
                updated_at = NOW()
            WHERE id = NEW.customer_id;
        ELSIF NEW.type = 'payment' THEN
            -- Payment reduces balance (customer paid)
            UPDATE customers
            SET balance_amount = balance_amount - NEW.amount,
                updated_at = NOW()
            WHERE id = NEW.customer_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Create trigger for automatic balance updates
DROP TRIGGER IF EXISTS trigger_update_customer_balance ON customer_balance_transactions;
CREATE TRIGGER trigger_update_customer_balance
AFTER INSERT ON customer_balance_transactions
FOR EACH ROW
EXECUTE FUNCTION update_customer_balance();

-- 7. Enable RLS on the new table
ALTER TABLE customer_balance_transactions ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policies
CREATE POLICY "Vendors can view their own balance transactions"
ON customer_balance_transactions
FOR SELECT
USING (vendor_id = current_setting('app.current_vendor_id', true)::uuid);

CREATE POLICY "Vendors can insert their own balance transactions"
ON customer_balance_transactions
FOR INSERT
WITH CHECK (vendor_id = current_setting('app.current_vendor_id', true)::uuid);

-- Note: For admin client access, RLS is bypassed
