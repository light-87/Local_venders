'use client';

import { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/layout';
import { Card, Badge, EmptyState, Select, useToast, TransactionDetailModal } from '@/components/ui';
import { formatCurrency, formatDateShort } from '@/lib/utils/format';
import { ArrowDownLeft, ArrowUpRight, Plus, Filter, Receipt } from 'lucide-react';
import Link from 'next/link';
import type { Transaction, Account } from '@/types';

export default function TransactionsPage() {
  const { error, success } = useToast();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [totals, setTotals] = useState({ income: 0, expense: 0, net: 0 });

  // Filters
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [accountFilter, setAccountFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  // Transaction detail modal
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Fetch transactions function (reusable)
  const fetchTransactions = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (typeFilter) params.append('type', typeFilter);
      if (accountFilter) params.append('accountId', accountFilter);

      const res = await fetch(`/api/transactions?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setTransactions(data.transactions);
        setTotals(data.totals);
      }
    } catch {
      error('Failed to load transactions');
    }
  }, [typeFilter, accountFilter, error]);

  // Handle transaction click - fetch full details
  const handleTransactionClick = async (transaction: Transaction) => {
    try {
      const res = await fetch(`/api/transactions/${transaction.id}`);
      const data = await res.json();

      if (data.success) {
        setSelectedTransaction(data.transaction);
        setShowDetailModal(true);
      } else {
        error('Failed to load transaction details');
      }
    } catch {
      error('Failed to load transaction details');
    }
  };

  // Handle transaction delete
  const handleDeleteTransaction = async (id: string) => {
    const res = await fetch(`/api/transactions/${id}`, {
      method: 'DELETE',
    });
    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to delete transaction');
    }

    success(data.deletedSale ? 'Transaction and sale deleted' : 'Transaction deleted');
    await fetchTransactions();
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [transRes, accRes] = await Promise.all([
          fetch('/api/transactions'),
          fetch('/api/accounts'),
        ]);

        const transData = await transRes.json();
        const accData = await accRes.json();

        if (transData.success) {
          setTransactions(transData.transactions);
          setTotals(transData.totals);
        }
        if (accData.success) {
          setAccounts(accData.accounts);
        }
      } catch {
        error('Failed to load transactions');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [error]);

  useEffect(() => {
    const fetchFiltered = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (typeFilter) params.append('type', typeFilter);
        if (accountFilter) params.append('accountId', accountFilter);

        const res = await fetch(`/api/transactions?${params.toString()}`);
        const data = await res.json();

        if (data.success) {
          setTransactions(data.transactions);
          setTotals(data.totals);
        }
      } catch {
        error('Failed to load transactions');
      } finally {
        setLoading(false);
      }
    };

    fetchFiltered();
  }, [typeFilter, accountFilter, error]);

  if (loading && transactions.length === 0) {
    return (
      <div>
        <PageHeader
          title="Transactions"
          action={
            <Link
              href="/transactions/new"
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
        title="Transactions"
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-xl transition-colors ${
                showFilters || typeFilter || accountFilter
                  ? 'bg-brand-100 text-brand-600'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              <Filter className="w-5 h-5" />
            </button>
            <Link
              href="/transactions/new"
              className="p-2 bg-brand-500 text-white rounded-xl"
            >
              <Plus className="w-5 h-5" />
            </Link>
          </div>
        }
      />

      <div className="p-4 space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-2">
          <Card className="bg-green-50 border-green-100">
            <p className="text-xs text-green-600">Income</p>
            <p className="text-lg font-semibold text-green-700 tabular-nums">
              {formatCurrency(totals.income)}
            </p>
          </Card>
          <Card className="bg-red-50 border-red-100">
            <p className="text-xs text-red-600">Expense</p>
            <p className="text-lg font-semibold text-red-700 tabular-nums">
              {formatCurrency(totals.expense)}
            </p>
          </Card>
          <Card className={`${totals.net >= 0 ? 'bg-blue-50 border-blue-100' : 'bg-amber-50 border-amber-100'}`}>
            <p className={`text-xs ${totals.net >= 0 ? 'text-blue-600' : 'text-amber-600'}`}>Net</p>
            <p className={`text-lg font-semibold tabular-nums ${totals.net >= 0 ? 'text-blue-700' : 'text-amber-700'}`}>
              {formatCurrency(totals.net)}
            </p>
          </Card>
        </div>

        {/* Filters */}
        {showFilters && (
          <Card className="space-y-3">
            <div className="flex gap-2">
              <div className="flex-1">
                <Select
                  options={[
                    { value: '', label: 'All Types' },
                    { value: 'income', label: 'Income' },
                    { value: 'expense', label: 'Expense' },
                  ]}
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <Select
                  options={[
                    { value: '', label: 'All Accounts' },
                    ...accounts.map((a) => ({ value: a.id, label: a.name })),
                  ]}
                  value={accountFilter}
                  onChange={(e) => setAccountFilter(e.target.value)}
                />
              </div>
            </div>
            {(typeFilter || accountFilter) && (
              <button
                onClick={() => {
                  setTypeFilter('');
                  setAccountFilter('');
                }}
                className="text-sm text-brand-500"
              >
                Clear filters
              </button>
            )}
          </Card>
        )}

        {/* Transaction List */}
        {transactions.length > 0 ? (
          <div className="space-y-2">
            {transactions.map((transaction) => (
              <Card
                key={transaction.id}
                className="cursor-pointer active:scale-[0.98] transition-transform"
                onClick={() => handleTransactionClick(transaction)}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      transaction.type === 'income'
                        ? 'bg-green-100 text-green-600'
                        : 'bg-red-100 text-red-600'
                    }`}
                  >
                    {transaction.type === 'income' ? (
                      <ArrowDownLeft className="w-5 h-5" />
                    ) : (
                      <ArrowUpRight className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 truncate">
                        {transaction.name}
                      </p>
                      {transaction.sale_id && (
                        <Badge variant="info" size="sm">Sale</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>{formatDateShort(transaction.transaction_date)}</span>
                      <span>•</span>
                      <span className="truncate">
                        {(transaction.account as { name: string })?.name}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-semibold tabular-nums ${
                        transaction.type === 'income'
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {transaction.type === 'income' ? '+' : '-'}
                      {formatCurrency(transaction.amount)}
                    </p>
                  </div>
                </div>
                {transaction.description && (
                  <p className="mt-2 text-sm text-gray-500 pl-13">
                    {transaction.description}
                  </p>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Receipt className="h-8 w-8" />}
            title="No transactions found"
            description={
              typeFilter || accountFilter
                ? 'Try adjusting your filters'
                : 'Record your first transaction to get started'
            }
            actionLabel={!typeFilter && !accountFilter ? 'Add Transaction' : undefined}
            actionHref={!typeFilter && !accountFilter ? '/transactions/new' : undefined}
          />
        )}
      </div>

      {/* Transaction Detail Modal */}
      <TransactionDetailModal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedTransaction(null);
        }}
        transaction={selectedTransaction}
        onDelete={handleDeleteTransaction}
      />
    </div>
  );
}
