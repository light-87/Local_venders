'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout';
import { Button, Input, Select, Textarea, useToast } from '@/components/ui';
import type { ExpenseCategory, Account } from '@/types';

export default function NewExpensePage() {
  const router = useRouter();
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);

  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [expenseDate, setExpenseDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, accRes] = await Promise.all([
          fetch('/api/expenses/categories'),
          fetch('/api/accounts'),
        ]);

        const catData = await catRes.json();
        const accData = await accRes.json();

        if (catData.success) setCategories(catData.categories);
        if (accData.success) {
          setAccounts(accData.accounts);
          const defaultAcc = accData.accounts.find((a: Account) => a.is_default);
          if (defaultAcc) setAccountId(defaultAcc.id);
        }
      } catch {
        error('Failed to load data');
      } finally {
        setDataLoading(false);
      }
    };

    fetchData();
  }, [error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!categoryId || !accountId || !amount) {
      error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId,
          accountId,
          amount: parseFloat(amount),
          description,
          expenseDate,
        }),
      });

      if (res.ok) {
        success('Expense recorded');
        router.push('/expenses');
        router.refresh();
      } else {
        const data = await res.json();
        error(data.error || 'Failed to record expense');
      }
    } catch {
      error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (dataLoading) {
    return (
      <div>
        <PageHeader title="Add Expense" showBack />
        <div className="p-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Add Expense" showBack />

      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        <Select
          label="Category *"
          options={categories.map((c) => ({ value: c.id, label: c.name }))}
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          placeholder="Select category"
        />

        <Input
          type="number"
          step="0.01"
          label="Amount *"
          placeholder="0.00"
          prefix="₹"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        <Select
          label="Payment Account *"
          options={accounts.map((a) => ({
            value: a.id,
            label: `${a.name} (${a.type})`,
          }))}
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
        />

        <Input
          type="date"
          label="Date"
          value={expenseDate}
          onChange={(e) => setExpenseDate(e.target.value)}
        />

        <Textarea
          label="Description"
          placeholder="Optional description..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <Button type="submit" fullWidth loading={loading}>
          Record Expense
        </Button>
      </form>
    </div>
  );
}
