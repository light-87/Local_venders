import { z } from 'zod';

// Common schemas
export const phoneSchema = z
  .string()
  .regex(/^[0-9]{10}$/, 'Phone number must be 10 digits')
  .optional()
  .or(z.literal(''));

export const pinSchema = z
  .string()
  .length(5, 'PIN must be exactly 5 digits')
  .regex(/^[0-9]{5}$/, 'PIN must contain only digits');

// Auth schemas
export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  pin: pinSchema,
});

export const changePinSchema = z
  .object({
    currentPin: pinSchema,
    newPin: pinSchema,
    confirmPin: pinSchema,
  })
  .refine((data) => data.newPin === data.confirmPin, {
    message: 'PINs do not match',
    path: ['confirmPin'],
  });

// Customer schemas
export const customerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: phoneSchema,
  notes: z.string().optional(),
});

// Inventory schemas
export const inventoryItemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  categoryId: z.string().uuid().optional().nullable(),
  currentStock: z.number().min(0, 'Stock cannot be negative'),
  unit: z.string().min(1, 'Unit is required'),
  unitPrice: z.number().min(0, 'Price cannot be negative'),
  costPrice: z.number().min(0, 'Cost cannot be negative').optional(),
  minStockAlert: z.number().min(0, 'Alert level cannot be negative'),
  description: z.string().optional(),
});

export const inventoryCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
});

// Sale schemas
export const saleItemSchema = z.object({
  inventoryItemId: z.string().uuid(),
  quantity: z.number().positive('Quantity must be positive'),
  unitPrice: z.number().min(0, 'Price cannot be negative'),
  warrantyMonths: z.number().min(0).optional(),
  maintenanceIntervalMonths: z.number().min(0).optional(),
});

export const createSaleSchema = z.object({
  customerId: z.string().uuid().optional().nullable(),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  accountId: z.string().uuid(),
  items: z.array(saleItemSchema).min(1, 'At least one item is required'),
  discountAmount: z.number().min(0).optional(),
  discountPercent: z.number().min(0).max(100).optional(),
  taxAmount: z.number().min(0).optional(),
  notes: z.string().optional(),
});

// Expense schemas
export const expenseSchema = z.object({
  categoryId: z.string().uuid(),
  accountId: z.string().uuid(),
  amount: z.number().positive('Amount must be positive'),
  description: z.string().optional(),
  expenseDate: z.string().optional(),
});

export const expenseCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
});

// Account schemas
export const accountSchema = z.object({
  name: z.string().min(1, 'Account name is required'),
});

// Transaction schemas
export const transactionSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  accountId: z.string().uuid(),
  type: z.enum(['income', 'expense']),
  amount: z.number().positive('Amount must be positive'),
  transactionDate: z.string().optional(),
});

// Vendor schemas
export const vendorProfileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  businessName: z.string().min(1, 'Business name is required'),
  phone: phoneSchema,
});

export const createVendorSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .regex(/^[a-z0-9_]+$/, 'Username can only contain lowercase letters, numbers, and underscores'),
  pin: pinSchema,
  name: z.string().min(1, 'Name is required'),
  businessName: z.string().min(1, 'Business name is required'),
  phone: phoneSchema,
});

// Type exports
export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePinInput = z.infer<typeof changePinSchema>;
export type CustomerInput = z.infer<typeof customerSchema>;
export type InventoryItemInput = z.infer<typeof inventoryItemSchema>;
export type InventoryCategoryInput = z.infer<typeof inventoryCategorySchema>;
export type CreateSaleInput = z.infer<typeof createSaleSchema>;
export type ExpenseInput = z.infer<typeof expenseSchema>;
export type ExpenseCategoryInput = z.infer<typeof expenseCategorySchema>;
export type AccountInput = z.infer<typeof accountSchema>;
export type TransactionInput = z.infer<typeof transactionSchema>;
export type VendorProfileInput = z.infer<typeof vendorProfileSchema>;
export type CreateVendorInput = z.infer<typeof createVendorSchema>;
