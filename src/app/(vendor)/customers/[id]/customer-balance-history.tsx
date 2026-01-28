'use client';

import { useState, useEffect } from 'react';
import { Card, Button, useToast } from '@/components/ui';
import { formatCurrency } from '@/lib/utils/format';
import { History, ChevronDown, ChevronUp, Wallet } from 'lucide-react';
import type { CustomerBalanceTransaction } from '@/types';

interface CustomerBalanceHistoryProps {
  customerId: string;
  currentBalance: number;
}

export function CustomerBalanceHistory({ customerId, currentBalance }: CustomerBalanceHistoryProps) {
  const { error } = useToast();
  const [transactions, setTransactions] = useState<CustomerBalanceTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, [customerId]);

  const fetchTransactions = async () => {
    try {
      const res = await fetch(`/api/balances/${customerId}`);
      const data = await res.json();

      if (data.success) {
        setTransactions(data.transactions);
      }
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  // Don't show if no balance and no transactions
  if (!loading && transactions.length === 0 && currentBalance === 0) {
    return null;
  }

  return (
    <section>
      <h3 className="text-sm font-medium text-gray-500 mb-3">Balance History</h3>
      <Card>
        {/* Summary Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
              <Wallet className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Current Balance</p>
              <p className={`text-xl font-bold tabular-nums ${currentBalance > 0 ? 'text-amber-700' : 'text-green-600'}`}>
                {formatCurrency(currentBalance)}
              </p>
            </div>
          </div>
          {transactions.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              icon={showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              onClick={() => setShowHistory(!showHistory)}
            >
              <History className="w-4 h-4 mr-1" />
              {showHistory ? 'Hide' : 'Show'} ({transactions.length})
            </Button>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        )}

        {/* Transactions List */}
        {!loading && showHistory && transactions.length > 0 && (
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className={`p-3 rounded-lg border ${
                  tx.type === 'sale'
                    ? 'bg-amber-50 border-amber-200'
                    : 'bg-green-50 border-green-200'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className={`font-medium ${
                      tx.type === 'sale' ? 'text-amber-800' : 'text-green-800'
                    }`}>
                      {tx.type === 'sale' ? 'Balance Added' : 'Payment Received'}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(tx.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    {tx.notes && (
                      <p className="text-xs text-gray-600 mt-1">{tx.notes}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className={`font-bold tabular-nums ${
                      tx.type === 'sale' ? 'text-amber-700' : 'text-green-700'
                    }`}>
                      {tx.type === 'sale' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </p>
                    <p className="text-xs text-gray-500 tabular-nums">
                      Bal: {formatCurrency(tx.running_balance)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && transactions.length === 0 && currentBalance > 0 && (
          <p className="text-center text-gray-500 py-4 text-sm">No transaction history available</p>
        )}
      </Card>
    </section>
  );
}
