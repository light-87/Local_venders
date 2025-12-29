'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout';
import { Button, Input, Select, Textarea, useToast } from '@/components/ui';
import type { Account } from '@/types';

export default function NewTransactionPage() {
  const router = useRouter();
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  const [accounts, setAccounts] = useState<Account[]>([]);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [accountId, setAccountId] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [transactionDate, setTransactionDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const accRes = await fetch('/api/accounts');
        const accData = await accRes.json();

        if (accData.success) {
          setAccounts(accData.accounts);
          const defaultAcc = accData.accounts.find((a: Account) => a.is_default);
          if (defaultAcc) setAccountId(defaultAcc.id);
        }
      } catch {
        error('Failed to load accounts');
      } finally {
        setDataLoading(false);
      }
    };

    fetchData();
  }, [error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !accountId || !amount) {
      error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          accountId,
          type,
          amount: parseFloat(amount),
          transactionDate,
        }),
      });

      if (res.ok) {
        success('Transaction recorded');
        router.push('/transactions');
        router.refresh();
      } else {
        const data = await res.json();
        error(data.error || 'Failed to record transaction');
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
        <PageHeader title="Add Transaction" showBack />
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
      <PageHeader title="Add Transaction" showBack />

      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {/* Type Toggle */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Type *
          </label>
          <div className="flex rounded-xl overflow-hidden border border-gray-200">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                type === 'expense'
                  ? 'bg-red-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                type === 'income'
                  ? 'bg-green-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Income
            </button>
          </div>
        </div>

        <Input
          label="Name *"
          placeholder="e.g., Electricity Bill, Rent"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <Input
          type="number"
          step="0.01"
          label="Amount *"
          placeholder="0.00"
          startIcon="₹"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        <Select
          label="Account *"
          options={accounts.map((a) => ({
            value: a.id,
            label: a.name,
          }))}
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          placeholder="Select account"
        />

        <Input
          type="date"
          label="Date"
          value={transactionDate}
          onChange={(e) => setTransactionDate(e.target.value)}
        />

        <Textarea
          label="Description (Optional)"
          placeholder="Add notes about this transaction..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <Button type="submit" fullWidth loading={loading}>
          {type === 'expense' ? 'Record Expense' : 'Record Income'}
        </Button>
      </form>
    </div>
  );
}
