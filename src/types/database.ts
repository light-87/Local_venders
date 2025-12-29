export interface Vendor {
  id: string;
  username: string;
  pin_hash: string;
  name: string;
  business_name: string;
  phone: string | null;
  business_logo: string | null;
  is_admin: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Account {
  id: string;
  vendor_id: string;
  name: string;
  balance: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  vendor_id: string;
  name: string;
  phone: string | null;
  total_purchases: number;
  total_spent: number;
  last_purchase_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface InventoryCategory {
  id: string;
  vendor_id: string;
  name: string;
  created_at: string;
}

export interface InventoryItem {
  id: string;
  vendor_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  current_stock: number;
  min_stock_alert: number;
  unit: string;
  unit_price: number;
  cost_price: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joined fields
  category?: InventoryCategory;
}

export interface Sale {
  id: string;
  vendor_id: string;
  customer_id: string | null;
  account_id: string;
  bill_number: string;
  bill_id: string;
  subtotal: number;
  discount_amount: number;
  discount_percent: number;
  tax_amount: number;
  total_amount: number;
  payment_status: 'paid' | 'pending' | 'partial';
  notes: string | null;
  created_at: string;
  // Joined fields
  customer?: Customer;
  account?: Account;
  items?: SaleItem[];
}

export interface SaleItem {
  id: string;
  sale_id: string;
  inventory_item_id: string | null;
  item_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  created_at: string;
}

export interface ExpenseCategory {
  id: string;
  vendor_id: string;
  name: string;
  created_at: string;
}

export interface Expense {
  id: string;
  vendor_id: string;
  account_id: string;
  category_id: string | null;
  category_name: string;
  amount: number;
  description: string | null;
  expense_date: string;
  created_at: string;
  // Joined fields
  account?: Account;
  category?: ExpenseCategory;
}

export interface Income {
  id: string;
  vendor_id: string;
  account_id: string;
  sale_id: string | null;
  amount: number;
  description: string | null;
  income_date: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  vendor_id: string;
  account_id: string;
  sale_id: string | null;
  name: string;
  description: string | null;
  type: 'income' | 'expense';
  amount: number;
  transaction_date: string;
  created_at: string;
  // Joined fields
  account?: Account;
  sale?: Sale;
}

export interface ScheduledMessage {
  id: string;
  vendor_id: string;
  customer_id: string;
  message_type: 'maintenance' | 'reminder' | 'promotional' | 'custom';
  message_text: string;
  scheduled_date: string;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  sent_at: string | null;
  error_message: string | null;
  aisensy_message_id: string | null;
  created_at: string;
  // Joined fields
  customer?: Customer;
}

export interface MessageLog {
  id: string;
  vendor_id: string;
  scheduled_message_id: string | null;
  customer_id: string | null;
  customer_phone: string;
  message_type: string;
  message_text: string | null;
  cost: number;
  channel: string;
  status: string;
  external_id: string | null;
  sent_at: string;
}

export interface MessageTemplate {
  id: string;
  vendor_id: string;
  name: string;
  message_type: string;
  template_text: string;
  is_active: boolean;
  created_at: string;
}

export interface VendorSession {
  id: string;
  vendor_id: string;
  token: string;
  expires_at: string;
  created_at: string;
}

export interface BillSequence {
  vendor_id: string;
  last_number: number;
  prefix: string;
}
