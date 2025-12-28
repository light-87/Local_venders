import { validateSession } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { formatCurrency, formatDateShort } from '@/lib/utils/format';
import { PageHeader } from '@/components/layout';
import { Card, Badge, EmptyState } from '@/components/ui';
import { Receipt, Plus } from 'lucide-react';
import Link from 'next/link';

async function getExpenses(vendorId: string) {
  const supabase = createAdminClient();

  const { data: expenses } = await supabase
    .from('expenses')
    .select('*, category:expense_categories(id, name), account:accounts(id, name)')
    .eq('vendor_id', vendorId)
    .order('expense_date', { ascending: false })
    .limit(50);

  const total = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) ?? 0;

  return { expenses: expenses ?? [], total };
}

export default async function ExpensesPage() {
  const session = await validateSession();
  if (!session) return null;

  const { expenses, total } = await getExpenses(session.id);

  return (
    <div>
      <PageHeader
        title="Expenses"
        action={
          <Link
            href="/expenses/new"
            className="p-2 bg-brand-500 text-white rounded-xl"
          >
            <Plus className="w-5 h-5" />
          </Link>
        }
      />

      <div className="p-4 space-y-4">
        {/* Total */}
        <Card className="bg-red-50 border-red-100">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-red-700">Total Expenses</p>
              <p className="text-2xl font-semibold text-red-900 tabular-nums">
                {formatCurrency(total)}
              </p>
            </div>
            <Receipt className="w-8 h-8 text-red-300" />
          </div>
        </Card>

        {/* Expenses List */}
        {expenses.length > 0 ? (
          <div className="space-y-2">
            {expenses.map((expense) => (
              <Card key={expense.id}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-900">
                      {expense.category_name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {expense.description || 'No description'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDateShort(expense.expense_date)} •{' '}
                      {(expense.account as { name: string })?.name}
                    </p>
                  </div>
                  <p className="font-semibold text-red-600 tabular-nums">
                    -{formatCurrency(expense.amount)}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Receipt}
            title="No expenses recorded"
            description="Track your business expenses here"
            actionLabel="Add Expense"
            actionHref="/expenses/new"
          />
        )}
      </div>
    </div>
  );
}
