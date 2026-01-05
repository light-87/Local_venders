'use client';

import { useState, useEffect } from 'react';
import { Modal, ConfirmModal } from './modal';
import { Badge } from './badge';
import { Button } from './button';
import { Input } from './input';
import { Select } from './select';
import { Textarea } from './textarea';
import { formatCurrency, formatDateShort } from '@/lib/utils/format';
import { ArrowDownLeft, ArrowUpRight, Trash2, Calendar, Wallet, FileText, ShoppingBag, Pencil, Receipt } from 'lucide-react';
import type { Transaction, Account } from '@/types';

interface TransactionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  accounts: Account[];
  onUpdate: (id: string, data: {
    name?: string;
    description?: string | null;
    amount?: number;
    accountId?: string;
    transactionDate?: string;
  }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function TransactionDetailModal({
  isOpen,
  onClose,
  transaction,
  accounts,
  onUpdate,
  onDelete,
}: TransactionDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState('');
  const [transactionDate, setTransactionDate] = useState('');

  // Reset form when transaction changes
  useEffect(() => {
    if (transaction) {
      setName(transaction.name);
      setDescription(transaction.description || '');
      setAmount(String(transaction.amount));
      setAccountId(transaction.account_id);
      setTransactionDate(transaction.transaction_date);
      setIsEditing(false);
    }
  }, [transaction]);

  if (!transaction) return null;

  const isIncome = transaction.type === 'income';
  const hasSale = !!transaction.sale_id;
  const hasExpense = !!transaction.expense_id;
  const isLinked = hasSale || hasExpense;
  const account = transaction.account as { id: string; name: string } | undefined;
  const sale = transaction.sale as { id: string; bill_number: string; customer?: { id: string; name: string } } | undefined;

  const handleSave = async () => {
    setLoading(true);
    try {
      await onUpdate(transaction.id, {
        name,
        description: description || null,
        amount: parseFloat(amount),
        accountId,
        transactionDate,
      });
      setIsEditing(false);
      onClose();
    } catch {
      // Error handled by parent
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = () => {
    setShowConfirm(true);
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      await onDelete(transaction.id);
      setShowConfirm(false);
      onClose();
    } finally {
      setDeleting(false);
    }
  };

  const handleClose = () => {
    setIsEditing(false);
    onClose();
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleClose} title={isEditing ? "Edit Transaction" : "Transaction Details"}>
        <div className="space-y-4">
          {/* Type and Amount Header */}
          <div className="flex items-center gap-4">
            <div
              className={`w-14 h-14 rounded-full flex items-center justify-center ${
                isIncome
                  ? 'bg-green-100 text-green-600'
                  : 'bg-red-100 text-red-600'
              }`}
            >
              {isIncome ? (
                <ArrowDownLeft className="w-7 h-7" />
              ) : (
                <ArrowUpRight className="w-7 h-7" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Badge variant={isIncome ? 'success' : 'error'}>
                  {isIncome ? 'Income' : 'Expense'}
                </Badge>
                {hasSale && (
                  <Badge variant="info">Sale</Badge>
                )}
                {hasExpense && (
                  <Badge variant="warning">Expense</Badge>
                )}
              </div>
              <p
                className={`text-2xl font-bold tabular-nums ${
                  isIncome ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
              </p>
            </div>
          </div>

          {isEditing ? (
            /* Edit Form */
            <div className="space-y-4 py-2 border-t border-gray-100">
              {/* Name */}
              <Input
                label="Name"
                placeholder="Transaction name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

              {/* Amount */}
              <Input
                type="number"
                step="0.01"
                label="Amount"
                placeholder="0.00"
                startIcon="₹"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />

              {/* Account */}
              <Select
                label="Account"
                options={accounts.map((a) => ({ value: a.id, label: a.name }))}
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
              />

              {/* Date */}
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-gray-600 mb-2">
                  <Calendar className="w-4 h-4" />
                  Date
                </label>
                <Input
                  type="date"
                  value={transactionDate}
                  onChange={(e) => setTransactionDate(e.target.value)}
                />
              </div>

              {/* Description */}
              <Textarea
                label="Description"
                placeholder="Optional description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
                <Button
                  fullWidth
                  loading={loading}
                  onClick={handleSave}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          ) : (
            /* View Mode */
            <>
              {/* Details */}
              <div className="space-y-3 pt-2 border-t border-gray-100">
                {/* Name */}
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-medium text-gray-900">{transaction.name}</p>
                  </div>
                </div>

                {/* Date */}
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Date</p>
                    <p className="font-medium text-gray-900">
                      {formatDateShort(transaction.transaction_date)}
                    </p>
                  </div>
                </div>

                {/* Account */}
                <div className="flex items-start gap-3">
                  <Wallet className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Account</p>
                    <p className="font-medium text-gray-900">
                      {account?.name || 'Unknown'}
                    </p>
                  </div>
                </div>

                {/* Sale info if linked */}
                {hasSale && sale && (
                  <div className="flex items-start gap-3">
                    <ShoppingBag className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Linked Sale</p>
                      <p className="font-medium text-gray-900">
                        Bill #{sale.bill_number}
                        {sale.customer && (
                          <span className="text-gray-500 font-normal">
                            {' '}• {sale.customer.name}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                )}

                {/* Expense info if linked */}
                {hasExpense && (
                  <div className="flex items-start gap-3">
                    <Receipt className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Linked Expense</p>
                      <p className="font-medium text-gray-900">
                        From Expenses page
                      </p>
                    </div>
                  </div>
                )}

                {/* Description */}
                {transaction.description && (
                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-sm text-gray-500 mb-1">Description</p>
                    <p className="text-gray-700">{transaction.description}</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-gray-100 space-y-2">
                {isLinked ? (
                  <p className="text-sm text-amber-600 text-center mb-2">
                    {hasSale
                      ? 'Edit this sale from Sales History page'
                      : 'Edit this expense from Expenses page'}
                  </p>
                ) : (
                  <Button
                    variant="secondary"
                    fullWidth
                    onClick={() => setIsEditing(true)}
                  >
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit Transaction
                  </Button>
                )}
                <Button
                  variant="danger"
                  fullWidth
                  onClick={handleDeleteClick}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Transaction
                </Button>
                {isLinked && (
                  <p className="text-xs text-amber-600 text-center">
                    {hasSale
                      ? 'This will also delete the linked sale and restore inventory'
                      : 'This will also delete the linked expense'}
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Transaction?"
        message={
          hasSale
            ? `This will permanently delete this transaction and the linked sale "${sale?.bill_number}". The inventory will be restored and the account balance will be adjusted. This action cannot be undone.`
            : hasExpense
            ? `This will permanently delete this transaction and the linked expense. The account balance will be restored. This action cannot be undone.`
            : `This will permanently delete this ${transaction.type} transaction. The account balance will be adjusted accordingly. This action cannot be undone.`
        }
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
      />
    </>
  );
}
