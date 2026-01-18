-- ==========================================================
-- KUBERBOOK DEMO DATA POPULATION SCRIPT (FIXED v5)
-- ==========================================================
-- This version fixes the variable name collision error.
-- Username: demo
-- PIN: 12345
-- ==========================================================

-- 1. UPDATE DEMO VENDOR (Set PIN to 12345)
UPDATE public.vendors 
SET pin_hash = '$2a$10$8/qEq7adCx37a0FZ4wj0GeVmWX1k5S4tCNr5lhVh9zksI4/vpnUMW',
    is_active = true
WHERE username = 'demo';

-- 2. CLEANUP & GENERATE
DO $$
DECLARE
    -- Renamed variables to avoid column collisions
    v_vendor_id UUID;
    v_acc_ids UUID[];
    v_cat_ids UUID[];
    v_item_ids UUID[];
    v_cust_ids UUID[];
    v_exp_cat_ids UUID[];
    
    v_temp_id UUID;
    v_i INTEGER;
    v_j INTEGER;
    v_sale_id UUID;
    v_item_id UUID;
    v_cust_id UUID;
    v_acc_id UUID;
    
    cust_names TEXT[] := ARRAY['Rahul Sharma', 'Anjali Gupta', 'Vikram Singh', 'Sneha Reddy', 'Amit Kumar', 'Pooja Verma', 'Sanjay Dutt', 'Deepa Nair', 'Manoj Bajpayee', 'Kriti Sanon'];
    item_prefixes TEXT[] := ARRAY['Solar Panel', 'Lithium Battery', 'Inverter', 'Solar Pump', 'DC Cable', 'Charge Controller', 'Mounting Structure', 'Earthing Kit', 'Lighting Arrester', 'Solar Street Light'];
    exp_cats TEXT[] := ARRAY['Shop Rent', 'Electricity', 'Internet', 'Marketing', 'Salary', 'Transport', 'Cleaning', 'Tools', 'Stationery', 'Miscellaneous'];
BEGIN
    -- FETCH THE ACTUAL VENDOR ID
    SELECT id INTO v_vendor_id FROM public.vendors WHERE username = 'demo';
    
    IF v_vendor_id IS NULL THEN
        RAISE EXCEPTION 'Vendor "demo" not found.';
    END IF;

    -- CLEANUP (Isolated to demo user)
    DELETE FROM public.message_logs WHERE vendor_id = v_vendor_id;
    DELETE FROM public.scheduled_messages WHERE vendor_id = v_vendor_id;
    DELETE FROM public.transactions WHERE vendor_id = v_vendor_id;
    DELETE FROM public.income WHERE vendor_id = v_vendor_id;
    DELETE FROM public.expenses WHERE vendor_id = v_vendor_id;
    DELETE FROM public.sale_items WHERE sale_items.sale_id IN (SELECT id FROM public.sales WHERE vendor_id = v_vendor_id);
    DELETE FROM public.sales WHERE vendor_id = v_vendor_id;
    DELETE FROM public.customers WHERE vendor_id = v_vendor_id;
    DELETE FROM public.inventory_items WHERE vendor_id = v_vendor_id;
    DELETE FROM public.inventory_categories WHERE vendor_id = v_vendor_id;
    DELETE FROM public.expense_categories WHERE vendor_id = v_vendor_id;
    DELETE FROM public.accounts WHERE vendor_id = v_vendor_id;
    
    UPDATE public.bill_sequences SET last_number = 0 WHERE vendor_id = v_vendor_id;

    -- 2.1 ACCOUNTS
    INSERT INTO public.accounts (vendor_id, name, type, balance, is_default)
    VALUES (v_vendor_id, 'Cash', 'Account', 45000, true) RETURNING id INTO v_temp_id;
    v_acc_ids := array_append(v_acc_ids, v_temp_id);
    
    INSERT INTO public.accounts (vendor_id, name, type, balance, is_default)
    VALUES (v_vendor_id, 'PhonePe/UPI', 'Account', 12500, false) RETURNING id INTO v_temp_id;
    v_acc_ids := array_append(v_acc_ids, v_temp_id);
    
    INSERT INTO public.accounts (vendor_id, name, type, balance, is_default)
    VALUES (v_vendor_id, 'HDFC Bank', 'Account', 350000, false) RETURNING id INTO v_temp_id;
    v_acc_ids := array_append(v_acc_ids, v_temp_id);

    -- 2.2 BILL SEQUENCE
    INSERT INTO public.bill_sequences (vendor_id, last_number, prefix)
    VALUES (v_vendor_id, 0, 'KB')
    ON CONFLICT (vendor_id) DO NOTHING;

    -- 2.3 INVENTORY CATEGORIES
    FOR v_i IN 1..5 LOOP
        INSERT INTO public.inventory_categories (vendor_id, name)
        VALUES (v_vendor_id, (ARRAY['Solar Panels', 'Batteries', 'Accessories', 'Pumps', 'Lighting'])[v_i])
        RETURNING id INTO v_temp_id;
        v_cat_ids := array_append(v_cat_ids, v_temp_id);
    END LOOP;

    -- 2.4 INVENTORY ITEMS
    FOR v_i IN 1..60 LOOP
        INSERT INTO public.inventory_items (vendor_id, category_id, name, current_stock, min_stock_alert, unit, unit_price, cost_price)
        VALUES (
            v_vendor_id, 
            v_cat_ids[1 + floor(random() * array_length(v_cat_ids, 1))],
            item_prefixes[1 + floor(random() * array_length(item_prefixes, 1))] || ' ' || (100 + v_i),
            floor(random() * 50),
            5 + floor(random() * 10),
            CASE WHEN v_i % 5 = 0 THEN 'meter' ELSE 'pcs' END,
            500 + floor(random() * 20000),
            400 + floor(random() * 15000)
        ) RETURNING id INTO v_temp_id;
        v_item_ids := array_append(v_item_ids, v_temp_id);
    END LOOP;

    -- 2.5 CUSTOMERS
    FOR v_i IN 1..55 LOOP
        INSERT INTO public.customers (vendor_id, name, phone, notes)
        VALUES (
            v_vendor_id, 
            cust_names[1 + floor(random() * array_length(cust_names, 1))] || ' ' || v_i,
            '9' || lpad(floor(random() * 1000000000)::text, 9, '0'),
            'Customer notes for ' || v_i
        ) RETURNING id INTO v_temp_id;
        v_cust_ids := array_append(v_cust_ids, v_temp_id);
    END LOOP;

    -- 2.6 EXPENSE CATEGORIES
    FOR v_i IN 1..array_length(exp_cats, 1) LOOP
        INSERT INTO public.expense_categories (vendor_id, name)
        VALUES (v_vendor_id, exp_cats[v_i]) 
        RETURNING id INTO v_temp_id;
        v_exp_cat_ids := array_append(v_exp_cat_ids, v_temp_id);
    END LOOP;

    -- 2.7 EXPENSES
    FOR v_i IN 1..50 LOOP
        INSERT INTO public.expenses (vendor_id, account_id, category_id, category_name, amount, description, expense_date)
        VALUES (
            v_vendor_id,
            v_acc_ids[1 + floor(random() * array_length(v_acc_ids, 1))],
            v_exp_cat_ids[1 + floor(random() * array_length(v_exp_cat_ids, 1))],
            'Automatic Expense',
            100 + floor(random() * 5000),
            'Description for ' || exp_cats[1 + (v_i % array_length(exp_cats, 1))],
            CURRENT_DATE - (floor(random() * 180) * INTERVAL '1 day')
        );
    END LOOP;

    -- 2.8 SALES & SALE ITEMS
    FOR v_i IN 1..50 LOOP
        v_cust_id := v_cust_ids[1 + floor(random() * array_length(v_cust_ids, 1))];
        v_acc_id := v_acc_ids[1 + floor(random() * array_length(v_acc_ids, 1))];
        
        INSERT INTO public.sales (vendor_id, customer_id, account_id, bill_number, bill_id, subtotal, total_amount, payment_status, sale_date)
        VALUES (
            v_vendor_id, 
            v_cust_id, 
            v_acc_id, 
            'KB-DEMO-' || lpad(v_i::text, 3, '0'), 
            'B-KB-DEMO-' || lpad(v_i::text, 3, '0'), 
            10000, 10000, 
            CASE WHEN v_i % 10 = 0 THEN 'pending' WHEN v_i % 7 = 0 THEN 'partial' ELSE 'paid' END,
            CURRENT_DATE - (floor(random() * 180) * INTERVAL '1 day')
        ) RETURNING id INTO v_sale_id;

        FOR v_j IN 1..(1 + floor(random() * 3)) LOOP
            v_item_id := v_item_ids[1 + floor(random() * array_length(v_item_ids, 1))];
            INSERT INTO public.sale_items (sale_id, inventory_item_id, item_name, quantity, unit_price, subtotal, warranty_months, maintenance_interval_months, warranty_end_date)
            VALUES (
                v_sale_id, 
                v_item_id, 
                'Demo Item ' || v_j, 
                1 + floor(random() * 5), 
                2000, 2000,
                CASE WHEN v_i % 2 = 0 THEN 12 ELSE 0 END,
                CASE WHEN v_i % 3 = 0 THEN 6 ELSE NULL END,
                CASE WHEN v_i % 2 = 0 THEN CURRENT_DATE + (365 * INTERVAL '1 day') ELSE NULL END
            ) RETURNING id INTO v_temp_id;
            
            -- 2.9 SCHEDULED MESSAGES
            IF (v_i % 3 = 0) THEN
                INSERT INTO public.scheduled_messages (
                    vendor_id, customer_id, message_type, message_text, 
                    scheduled_date, status, template_name, template_params, 
                    related_sale_id, related_sale_item_id, item_name
                ) VALUES (
                    v_vendor_id, v_cust_id, 'maintenance', 
                    'Scheduled service for your equipment',
                    CURRENT_DATE + (floor(random() * 90) * INTERVAL '1 day'),
                    'pending',
                    'maintenance_reminder',
                    jsonb_build_array('Customer Name', 'Solar Inverter'),
                    v_sale_id, v_temp_id, 'Solar Inverter'
                );
            END IF;
        END LOOP;
    END LOOP;

    -- 2.10 TRANSACTIONS
    FOR v_i IN 1..20 LOOP
        INSERT INTO public.transactions (vendor_id, account_id, name, type, amount, transaction_date)
        VALUES (
            v_vendor_id,
            v_acc_ids[1 + floor(random() * array_length(v_acc_ids, 1))],
            'Manual Transaction ' || v_i,
            CASE WHEN v_i % 2 = 0 THEN 'income' ELSE 'expense' END,
            100 + floor(random() * 1000),
            CURRENT_DATE - (floor(random() * 30) * INTERVAL '1 day')
        );
    END LOOP;

END $$;
