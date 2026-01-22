export * from './database';

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// Dashboard types
export interface DashboardSummary {
  totalSales: number;
  totalExpenses: number;
  netProfit: number;
  transactionCount: number;
}

export interface DashboardData {
  summary: DashboardSummary;
  salesByDay: Array<{ date: string; amount: number }>;
  expensesByCategory: Array<{ category: string; amount: number }>;
  lowStockItems: Array<{
    id: string;
    name: string;
    currentStock: number;
    minStockAlert: number;
    unit: string;
  }>;
  recentSales: Array<{
    id: string;
    billNumber: string;
    customerName: string | null;
    totalAmount: number;
    createdAt: string;
  }>;
}

// Service reminder for cart items (multiple reminders per item)
export interface CartServiceReminder {
  label: string;
  intervalValue: number;
  intervalUnit: 'months' | 'years';
}

// Cart types for sales
export interface CartItem {
  inventoryItemId: string | null; // null for small/misc items
  name: string;
  quantity: number;
  unitPrice: number;
  unit: string;
  availableStock: number;
  warrantyValue?: number;
  warrantyUnit?: 'months' | 'years';
  // Legacy single maintenance field (kept for backward compatibility)
  maintenanceValue?: number;
  maintenanceUnit?: 'months' | 'years';
  // New: multiple service reminders per item
  serviceReminders?: CartServiceReminder[];
  isSmallItem?: boolean; // For miscellaneous/small items
}

// Bill types (for public viewing)
export interface BillData {
  billNumber: string;
  billId: string;
  date: string;
  vendor: {
    name: string;
    businessName: string;
    phone: string | null;
    logo: string | null;
  };
  customer: {
    name: string;
  } | null;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }>;
  subtotal: number;
  discountAmount: number;
  discountPercent: number;
  taxAmount: number;
  totalAmount: number;
  paymentStatus: string;
}

// Session/Auth types
export interface SessionVendor {
  id: string;
  username: string;
  name: string;
  businessName: string;
  phone: string | null;
  businessLogo: string | null;
  isAdmin: boolean;
}

// Pagination types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Filter types
export interface DateRangeFilter {
  from: string;
  to: string;
}

export interface InventoryFilter {
  search?: string;
  categoryId?: string;
  lowStockOnly?: boolean;
}

export interface SalesFilter {
  from?: string;
  to?: string;
  customerId?: string;
}

export interface ExpenseFilter {
  from?: string;
  to?: string;
  categoryId?: string;
  accountId?: string;
}
