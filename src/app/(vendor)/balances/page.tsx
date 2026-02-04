'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout';
import { Card, Input, Button, Modal, Select, useToast } from '@/components/ui';
import { formatCurrency } from '@/lib/utils/format';
import {
  Search,
  User,
  Wallet,
  Phone,
  ChevronRight,
  MessageCircle,
  CreditCard,
  History,
  X,
} from 'lucide-react';
import Link from 'next/link';
import type { Customer, Account, CustomerBalanceTransaction } from '@/types';
import {
  createWhatsAppLink,
  generatePaymentReminderMessage,
} from '@/lib/utils/whatsapp';

interface CustomerWithBalance extends Customer {
  balance_amount: number;
}

export default function BalancesPage() {
  const { success, error } = useToast();

  // Data states
  const [customers, setCustomers] = useState<CustomerWithBalance[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [totalBalance, setTotalBalance] = useState(0);

  // UI states
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Payment modal states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithBalance | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number | ''>('');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Transaction history modal states
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyCustomer, setHistoryCustomer] = useState<CustomerWithBalance | null>(null);
  const [transactions, setTransactions] = useState<CustomerBalanceTransaction[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Vendor info for WhatsApp
  const [businessName, setBusinessName] = useState('');

  // Load customers with balance and accounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [balancesRes, accountsRes, settingsRes] = await Promise.all([
          fetch('/api/balances'),
          fetch('/api/accounts'),
          fetch('/api/settings'),
        ]);

        const balancesData = await balancesRes.json();
        const accountsData = await accountsRes.json();
        const settingsData = await settingsRes.json();

        if (balancesData.success) {
          setCustomers(balancesData.customers);
          setTotalBalance(balancesData.totalBalance);
        }

        if (accountsData.success) {
          setAccounts(accountsData.accounts);
          const defaultAcc = accountsData.accounts.find((a: Account) => a.is_default);
          if (defaultAcc) setSelectedAccountId(defaultAcc.id);
        }

        if (settingsData.success) {
          setBusinessName(settingsData.vendor?.business_name || '');
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
        error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [error]);

  // Filter customers by search
  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(search.toLowerCase()) ||
    customer.phone?.includes(search)
  );

  // Open payment modal
  const openPaymentModal = (customer: CustomerWithBalance) => {
    setSelectedCustomer(customer);
    setPaymentAmount('');
    setPaymentNotes('');
    setShowPaymentModal(true);
  };

  // Record payment
  const handleRecordPayment = async () => {
    if (!selectedCustomer || !paymentAmount || paymentAmount <= 0) {
      error('Please enter a valid amount');
      return;
    }

    if (!selectedAccountId) {
      error('Please select an account');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/balances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedCustomer.id,
          amount: paymentAmount,
          accountId: selectedAccountId,
          notes: paymentNotes || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        success(data.message);
        setShowPaymentModal(false);

        // Refresh the list
        const balancesRes = await fetch('/api/balances');
        const balancesData = await balancesRes.json();
        if (balancesData.success) {
          setCustomers(balancesData.customers);
          setTotalBalance(balancesData.totalBalance);
        }
      } else {
        error(data.error || 'Failed to record payment');
      }
    } catch (err) {
      console.error('Payment error:', err);
      error('Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  // Load transaction history
  const loadTransactionHistory = async (customer: CustomerWithBalance) => {
    setHistoryCustomer(customer);
    setShowHistoryModal(true);
    setLoadingHistory(true);

    try {
      const res = await fetch(`/api/balances/${customer.id}`);
      const data = await res.json();

      if (data.success) {
        setTransactions(data.transactions);
      }
    } catch (err) {
      console.error('Failed to load history:', err);
      error('Failed to load transaction history');
    } finally {
      setLoadingHistory(false);
    }
  };

  // Send WhatsApp reminder
  const sendWhatsAppReminder = (customer: CustomerWithBalance) => {
    if (!customer.phone) {
      error('Customer has no phone number');
      return;
    }

    const message = generatePaymentReminderMessage({
      customerName: customer.name,
      amount: customer.balance_amount,
      businessName: businessName || 'Our Store',
    });

    const whatsappUrl = createWhatsAppLink(customer.phone, message);
    window.open(whatsappUrl, '_blank');
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Balances" showBack />
        <div className="p-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24">
      <PageHeader title="Balances" showBack />

      <div className="p-4 space-y-4">
        {/* Summary Card */}
        <Card className="bg-amber-50 border-amber-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-amber-700">Total Pending Balance</p>
              <p className="text-2xl font-bold text-amber-800 tabular-nums">
                {formatCurrency(totalBalance)}
              </p>
              <p className="text-xs text-amber-600 mt-1">
                {customers.length} customer{customers.length !== 1 ? 's' : ''} with balance
              </p>
            </div>
            <div className="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center">
              <Wallet className="w-7 h-7 text-amber-600" />
            </div>
          </div>
        </Card>

        {/* Search */}
        <Input
          type="search"
          placeholder="Search customers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          startIcon={<Search className="w-5 h-5" />}
        />

        {/* Customers List */}
        {filteredCustomers.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Wallet className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-gray-600 font-medium">No pending balances</p>
            <p className="text-sm text-gray-400 mt-1">All customers have cleared their dues</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredCustomers.map((customer) => (
              <Card key={customer.id} className="relative">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <Link href={`/customers/${customer.id}`}>
                        <p className="font-semibold text-gray-900 hover:text-brand-600">
                          {customer.name}
                        </p>
                      </Link>
                      {customer.phone && (
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {customer.phone}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-amber-700 tabular-nums">
                      {formatCurrency(customer.balance_amount)}
                    </p>
                    <p className="text-xs text-gray-500">pending</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-3 border-t border-gray-100">
                  <Button
                    variant="primary"
                    size="sm"
                    className="flex-1"
                    icon={<CreditCard className="w-4 h-4" />}
                    onClick={() => openPaymentModal(customer)}
                  >
                    Record Payment
                  </Button>
                  {customer.phone && (
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={<MessageCircle className="w-4 h-4" />}
                      onClick={() => sendWhatsAppReminder(customer)}
                      className="!bg-green-50 !text-green-700 !border-green-200 hover:!bg-green-100"
                    >
                      Remind
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<History className="w-4 h-4" />}
                    onClick={() => loadTransactionHistory(customer)}
                  >
                    History
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Payment Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Record Payment"
      >
        {selectedCustomer && (
          <div className="space-y-4">
            {/* Customer Info */}
            <div className="p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{selectedCustomer.name}</p>
                    <p className="text-sm text-gray-500">
                      Balance: {formatCurrency(selectedCustomer.balance_amount)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Amount Input */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                Payment Amount
              </label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value ? Number(e.target.value) : '')}
                    startIcon="₹"
                  />
                </div>
                <Button
                  variant="ghost"
                  onClick={() => setPaymentAmount(selectedCustomer.balance_amount)}
                >
                  Full
                </Button>
              </div>
            </div>

            {/* Account Selection */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                Receive To
              </label>
              <Select
                options={accounts.map((a) => ({ value: a.id, label: a.name }))}
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
              />
            </div>

            {/* Notes */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                Notes (Optional)
              </label>
              <Input
                placeholder="e.g., Cash payment, UPI transfer"
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
              />
            </div>

            {/* Remaining Balance Preview */}
            {paymentAmount !== '' && paymentAmount > 0 && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-xl">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-green-700">After payment</span>
                  <span className="font-bold text-green-800 tabular-nums">
                    {formatCurrency(Math.max(0, selectedCustomer.balance_amount - paymentAmount))}
                  </span>
                </div>
                {paymentAmount >= selectedCustomer.balance_amount && (
                  <p className="text-xs text-green-600 mt-1">Balance will be cleared!</p>
                )}
              </div>
            )}

            {/* Submit Button */}
            <Button
              fullWidth
              loading={submitting}
              onClick={handleRecordPayment}
              disabled={!paymentAmount || paymentAmount <= 0 || !selectedAccountId}
            >
              Record Payment
            </Button>
          </div>
        )}
      </Modal>

      {/* Transaction History Modal */}
      <Modal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        title="Balance History"
      >
        {historyCustomer && (
          <div className="space-y-4">
            {/* Customer Info */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-amber-600" />
                </div>
                <p className="font-medium text-gray-900">{historyCustomer.name}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Current Balance</p>
                <p className="font-bold text-amber-700 tabular-nums">
                  {formatCurrency(historyCustomer.balance_amount)}
                </p>
              </div>
            </div>

            {/* Transactions List */}
            {loadingHistory ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No transactions found</p>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
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
          </div>
        )}
      </Modal>
    </div>
  );
}
