import type { SupabaseClient } from '@supabase/supabase-js';
import { getISTDateString } from '@/lib/utils/format';

interface CreateExpenseInput {
  vendorId: string;
  accountId: string;
  categoryId: string;
  categoryName: string;
  amount: number;
  description?: string | null;
  expenseDate?: string;
}

interface CreateExpenseResult {
  id: string;
  amount: number;
  expense_date: string;
  account_id: string;
  category_id: string;
  category_name: string;
  description: string | null;
}

/**
 * Create an expense row, debit the account balance, and write the matching
 * unified-transaction row. Shared between the manual expense API and the
 * inventory auto-expense flow so balance/transaction logic lives in one place.
 */
export async function createExpense(
  supabase: SupabaseClient,
  input: CreateExpenseInput
): Promise<CreateExpenseResult> {
  const expenseDate = input.expenseDate || getISTDateString();
  const description = input.description ?? null;

  const { data: expense, error: expenseError } = await supabase
    .from('expenses')
    .insert({
      vendor_id: input.vendorId,
      account_id: input.accountId,
      category_id: input.categoryId,
      category_name: input.categoryName,
      amount: input.amount,
      description,
      expense_date: expenseDate,
    })
    .select()
    .single();

  if (expenseError || !expense) {
    throw new Error(expenseError?.message ?? 'Failed to create expense');
  }

  const { data: account } = await supabase
    .from('accounts')
    .select('balance')
    .eq('id', input.accountId)
    .single();

  if (account) {
    await supabase
      .from('accounts')
      .update({ balance: Number(account.balance) - input.amount })
      .eq('id', input.accountId);
  }

  await supabase.from('transactions').insert({
    vendor_id: input.vendorId,
    account_id: input.accountId,
    expense_id: expense.id,
    name: input.categoryName,
    description,
    type: 'expense',
    amount: input.amount,
    transaction_date: expenseDate,
  });

  return expense as CreateExpenseResult;
}

/**
 * Resolve (or lazily create) an expense category by name for a vendor.
 * Used by auto-expense flows that need a known category like "Inventory Purchase"
 * without forcing the vendor to set it up themselves.
 */
export async function ensureExpenseCategory(
  supabase: SupabaseClient,
  vendorId: string,
  name: string
): Promise<{ id: string; name: string }> {
  const { data: existing } = await supabase
    .from('expense_categories')
    .select('id, name')
    .eq('vendor_id', vendorId)
    .ilike('name', name)
    .maybeSingle();

  if (existing) {
    return existing as { id: string; name: string };
  }

  const { data: created, error } = await supabase
    .from('expense_categories')
    .insert({ vendor_id: vendorId, name })
    .select('id, name')
    .single();

  if (error || !created) {
    throw new Error(error?.message ?? 'Failed to create expense category');
  }

  return created as { id: string; name: string };
}

/**
 * Pick the vendor's default account (or any account if none is marked default).
 * Returns null if the vendor has no accounts — callers should treat that as
 * "skip auto-expense" rather than erroring, so vendors without accounts set up
 * can still add inventory.
 */
export async function getDefaultAccountId(
  supabase: SupabaseClient,
  vendorId: string
): Promise<string | null> {
  const { data: defaultAccount } = await supabase
    .from('accounts')
    .select('id')
    .eq('vendor_id', vendorId)
    .eq('is_default', true)
    .maybeSingle();

  if (defaultAccount) return defaultAccount.id as string;

  const { data: anyAccount } = await supabase
    .from('accounts')
    .select('id')
    .eq('vendor_id', vendorId)
    .limit(1)
    .maybeSingle();

  return (anyAccount?.id as string) ?? null;
}

interface InventoryExpenseInput {
  vendorId: string;
  itemName: string;
  qtyAdded: number;
  costPrice: number;
  unit: string;
}

/**
 * Create the auto-expense triggered when inventory is added or restocked.
 * Skips silently when there's nothing meaningful to record (no cost, no qty,
 * or no account set up). Returns the created expense or null.
 */
export async function createInventoryExpense(
  supabase: SupabaseClient,
  input: InventoryExpenseInput
): Promise<CreateExpenseResult | null> {
  if (input.qtyAdded <= 0 || input.costPrice <= 0) return null;

  const accountId = await getDefaultAccountId(supabase, input.vendorId);
  if (!accountId) return null;

  const category = await ensureExpenseCategory(
    supabase,
    input.vendorId,
    'Inventory Purchase'
  );

  const amount = Number((input.qtyAdded * input.costPrice).toFixed(2));

  return createExpense(supabase, {
    vendorId: input.vendorId,
    accountId,
    categoryId: category.id,
    categoryName: category.name,
    amount,
    description: `Stocked ${input.qtyAdded} ${input.unit} of ${input.itemName}`,
  });
}
