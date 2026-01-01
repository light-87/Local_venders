'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatCurrency, formatDateShort } from '@/lib/utils/format';
import { PageHeader } from '@/components/layout';
import { Card, EmptyState, ExpenseEditModal, useToast } from '@/components/ui';
import { Receipt, Plus } from 'lucide-react';
import Link from 'next/link';
import type { Expense, ExpenseCategory, Account } from '@/types';

export default function ExpensesPage() {
  const { error, success } = useToast();
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [total, setTotal] = useState(0);

  // Modal states
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      const [expRes, catRes, accRes] = await Promise.all([
        fetch('/api/expenses'),
        fetch('/api/expenses/categories'),
        fetch('/api/accounts'),
      ]);

      const expData = await expRes.json();
      const catData = await catRes.json();
      const accData = await accRes.json();

      if (expData.success) {
        setExpenses(expData.expenses);
        setTotal(expData.total);
      }
      if (catData.success) {
        setCategories(catData.categories);
      }
      if (accData.success) {
        setAccounts(accData.accounts);
      }
    } catch {
      error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle expense click - fetch full details
  const handleExpenseClick = async (expense: Expense) => {
    try {
      const res = await fetch(`/api/expenses/${expense.id}`);
      const data = await res.json();

      if (data.success) {
        setSelectedExpense(data.expense);
        setShowEditModal(true);
      } else {
        error('Failed to load expense details');
      }
    } catch {
      error('Failed to load expense details');
    }
  };

  // Handle expense update
  const handleUpdateExpense = async (id: string, updateData: {
    categoryId?: string;
    accountId?: string;
    amount?: number;
    description?: string | null;
    expenseDate?: string;
  }) => {
    const res = await fetch(`/api/expenses/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData),
    });
    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to update expense');
    }

    success('Expense updated');
    await fetchData();
  };

  // Handle expense delete
  const handleDeleteExpense = async (id: string) => {
    const res = await fetch(`/api/expenses/${id}`, {
      method: 'DELETE',
    });
    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to delete expense');
    }

    success('Expense deleted');
    await fetchData();
  };

  if (loading) {
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
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

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
              <Card
                key={expense.id}
                variant="interactive"
                className="cursor-pointer"
                onClick={() => handleExpenseClick(expense)}
              >
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
            icon={<Receipt className="h-8 w-8" />}
            title="No expenses recorded"
            description="Track your business expenses here"
            actionLabel="Add Expense"
            actionHref="/expenses/new"
          />
        )}
      </div>

      {/* Expense Edit Modal */}
      <ExpenseEditModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedExpense(null);
        }}
        expense={selectedExpense}
        categories={categories}
        accounts={accounts}
        onUpdate={handleUpdateExpense}
        onDelete={handleDeleteExpense}
      />
    </div>
  );
}
