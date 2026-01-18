-- ==========================================================
-- KUBERBOOK ANALYTICS DATA SCRIPT (FIXED v3)
-- ==========================================================
-- This version explicitly sets 'created_at' timestamps so 
-- the app's analytics page (which groups by created_at)
-- displays the monthly distribution correctly.
-- Username: demo
-- ==========================================================

DO $$
DECLARE
    v_vendor_id UUID;
    v_acc_cash_id UUID;
    v_acc_upi_id UUID;
    v_acc_bank_id UUID;
    
    v_cust_ids UUID[];
    v_cat_ids UUID[];
    v_item_ids UUID[];
    v_exp_cat_ids UUID[];
    
    v_month_offset INTEGER;
    v_month_start TIMESTAMP WITH TIME ZONE;
    v_sale_date TIMESTAMP WITH TIME ZONE;
    v_exp_date DATE;
    
    v_sale_id UUID;
    v_temp_id UUID;
    v_income_amount NUMERIC;
    v_expense_amount NUMERIC;
    
    v_i INTEGER;
BEGIN
    -- 1. FETCH IDs
    SELECT id INTO v_vendor_id FROM public.vendors WHERE username = 'demo';
    IF v_vendor_id IS NULL THEN RAISE EXCEPTION 'Demo vendor not found'; END IF;

    SELECT id INTO v_acc_cash_id FROM public.accounts WHERE vendor_id = v_vendor_id AND name = 'Cash' LIMIT 1;
    SELECT id INTO v_acc_upi_id FROM public.accounts WHERE vendor_id = v_vendor_id AND name = 'PhonePe/UPI' LIMIT 1;
    SELECT id INTO v_acc_bank_id FROM public.accounts WHERE vendor_id = v_vendor_id AND name = 'HDFC Bank' LIMIT 1;
    
    SELECT array_agg(id) INTO v_cust_ids FROM public.customers WHERE vendor_id = v_vendor_id;
    SELECT array_agg(id) INTO v_exp_cat_ids FROM public.expense_categories WHERE vendor_id = v_vendor_id;

    -- 2. CLEANUP
    DELETE FROM public.transactions WHERE vendor_id = v_vendor_id;
    DELETE FROM public.income WHERE vendor_id = v_vendor_id;
    DELETE FROM public.expenses WHERE vendor_id = v_vendor_id;
    DELETE FROM public.sale_items WHERE sale_id IN (SELECT id FROM public.sales WHERE vendor_id = v_vendor_id);
    DELETE FROM public.sales WHERE vendor_id = v_vendor_id;

    -- 3. GENERATE TRENDING DATA
    FOR v_month_offset IN 0..11 LOOP
        v_month_start := date_trunc('month', CURRENT_TIMESTAMP - (v_month_offset * INTERVAL '1 month'));
        
        -- A. SALES (INCOME)
        FOR v_i IN 1..(6 + floor(random() * 5)) LOOP
            -- Create a timestamp within the month
            v_sale_date := v_month_start + (floor(random() * 25) * INTERVAL '1 day') + (floor(random() * 12) * INTERVAL '1 hour');
            
            -- Increment income slightly each month (growth)
            v_income_amount := 18000 + ((11 - v_month_offset) * 1200) + (random() * 4000);
            
            INSERT INTO public.sales (
                vendor_id, customer_id, account_id, bill_number, bill_id, 
                subtotal, total_amount, payment_status, sale_date, created_at
            ) VALUES (
                v_vendor_id, 
                v_cust_ids[1 + (v_i % array_length(v_cust_ids, 1))],
                CASE WHEN v_i % 3 = 0 THEN v_acc_cash_id WHEN v_i % 3 = 1 THEN v_acc_upi_id ELSE v_acc_bank_id END,
                'KB-' || to_char(v_month_start, 'YYMM') || '-' || lpad(v_i::text, 2, '0'),
                'B-KB-' || to_char(v_month_start, 'YYMM') || '-' || lpad(v_i::text, 2, '0'),
                v_income_amount, v_income_amount, 'paid', v_sale_date::date, v_sale_date
            ) RETURNING id INTO v_sale_id;

            INSERT INTO public.transactions (vendor_id, account_id, sale_id, name, type, amount, transaction_date, created_at)
            VALUES (
                v_vendor_id, 
                CASE WHEN v_i % 3 = 0 THEN v_acc_cash_id WHEN v_i % 3 = 1 THEN v_acc_upi_id ELSE v_acc_bank_id END,
                v_sale_id, 'Sale: KB-' || to_char(v_month_start, 'YYMM') || '-' || lpad(v_i::text, 2, '0'),
                'income', v_income_amount, v_sale_date::date, v_sale_date
            );
        END LOOP;

        -- B. EXPENSES (Keep expenses lower than income for profit)
        FOR v_i IN 1..(4 + floor(random() * 3)) LOOP
            v_sale_date := v_month_start + (floor(random() * 25) * INTERVAL '1 day') + (floor(random() * 12) * INTERVAL '1 hour');
            v_expense_amount := 7000 + ((11 - v_month_offset) * 400) + (random() * 2000);
            
            INSERT INTO public.expenses (
                vendor_id, account_id, category_id, category_name, 
                amount, description, expense_date, created_at
            ) VALUES (
                v_vendor_id, v_acc_cash_id, 
                v_exp_cat_ids[1 + (v_i % array_length(v_exp_cat_ids, 1))],
                'Operating Expense', v_expense_amount, 
                'Fixed overhead for ' || to_char(v_month_start, 'Month YYYY'),
                v_sale_date::date, v_sale_date
            ) RETURNING id INTO v_temp_id;

            INSERT INTO public.transactions (vendor_id, account_id, expense_id, name, type, amount, transaction_date, created_at)
            VALUES (
                v_vendor_id, v_acc_cash_id, v_temp_id, 
                'Monthly Overhead', 'expense', v_expense_amount, v_sale_date::date, v_sale_date
            );
        END LOOP;

        -- C. SERVICE INCOME
        v_income_amount := 3000 + (random() * 2000);
        v_sale_date := v_month_start + INTERVAL '15 days';
        
        INSERT INTO public.income (vendor_id, account_id, amount, description, income_date, created_at)
        VALUES (v_vendor_id, v_acc_upi_id, v_income_amount, 'Installation Services', v_sale_date::date, v_sale_date);

        INSERT INTO public.transactions (vendor_id, account_id, name, type, amount, transaction_date, created_at)
        VALUES (v_vendor_id, v_acc_upi_id, 'Service Fee', 'income', v_income_amount, v_sale_date::date, v_sale_date);

    END LOOP;

    -- 4. UPDATE ACCOUNT BALANCES
    UPDATE public.accounts SET balance = 120000 WHERE id = v_acc_cash_id;
    UPDATE public.accounts SET balance = 85000 WHERE id = v_acc_upi_id;
    UPDATE public.accounts SET balance = 1250000 WHERE id = v_acc_bank_id;

END $$;
