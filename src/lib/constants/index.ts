// Session configuration
export const SESSION_COOKIE_NAME = 'vendor_session';
export const SESSION_DURATION_DAYS = 7;

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Stock status thresholds
export const STOCK_STATUS = {
  OUT_OF_STOCK: 0,
  LOW_STOCK: 'low', // When current_stock <= min_stock_alert
  IN_STOCK: 'in_stock',
} as const;

// Payment status
export const PAYMENT_STATUS = {
  PAID: 'paid',
  PENDING: 'pending',
  PARTIAL: 'partial',
} as const;

// Message types
export const MESSAGE_TYPES = {
  MAINTENANCE: 'maintenance',
  REMINDER: 'reminder',
  PROMOTIONAL: 'promotional',
  CUSTOM: 'custom',
} as const;

// Message status
export const MESSAGE_STATUS = {
  PENDING: 'pending',
  SENT: 'sent',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
} as const;

// Default units for inventory
export const DEFAULT_UNITS = [
  'pcs',
  'kg',
  'g',
  'ltr',
  'ml',
  'box',
  'pack',
  'dozen',
  'meter',
  'ft',
] as const;

// Dashboard periods
export const DASHBOARD_PERIODS = {
  TODAY: 'today',
  WEEK: 'week',
  MONTH: 'month',
  CUSTOM: 'custom',
} as const;

// Navigation items for bottom nav
export const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { href: '/inventory', label: 'Inventory', icon: 'Package' },
  { href: '/sales/new', label: 'New Sale', icon: 'PlusCircle' },
  { href: '/customers', label: 'Customers', icon: 'Users' },
  { href: '/settings', label: 'More', icon: 'Menu' },
] as const;
