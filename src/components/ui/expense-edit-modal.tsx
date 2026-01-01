'use client';

import { useState, useEffect } from 'react';
import { Modal, ConfirmModal } from './modal';
import { Button } from './button';
import { Input } from './input';
import { Select } from './select';
import { Textarea } from './textarea';
import { formatCurrency, formatDateShort } from '@/lib/utils/format';
import { Pencil, Trash2, Calendar, Tag, FileText, Wallet } from 'lucide-react';
import type { Expense, ExpenseCategory, Account } from '@/types';

interface ExpenseEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense: Expense | null;
  categories: ExpenseCategory[];
  accounts: Account[];
  onUpdate: (id: string, data: {
    categoryId?: string;
    accountId?: string;
    amount?: number;
    description?: string | null;
    expenseDate?: string;
  }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function ExpenseEditModal({
  isOpen,
  onClose,
  expense,
  categories,
  accounts,
  onUpdate,
  onDelete,
}: ExpenseEditModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form state
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [expenseDate, setExpenseDate] = useState('');

  // Reset form when expense changes
  useEffect(() => {
    if (expense) {
      setCategoryId(expense.category_id || '');
      setAccountId(expense.account_id);
      setAmount(String(expense.amount));
      setDescription(expense.description || '');
      setExpenseDate(expense.expense_date);
      setIsEditing(false);
    }
  }, [expense]);

  if (!expense) return null;

  const accountName = expense.account && typeof expense.account === 'object' && 'name' in expense.account
    ? (expense.account as { name: string }).name
    : 'Unknown';

  const handleSave = async () => {
    setLoading(true);
    try {
      await onUpdate(expense.id, {
        categoryId: categoryId || undefined,
        accountId: accountId || undefined,
        amount: parseFloat(amount),
        description: description || null,
        expenseDate,
      });
      setIsEditing(false);
      onClose();
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
      await onDelete(expense.id);
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
      <Modal isOpen={isOpen} onClose={handleClose} title={isEditing ? "Edit Expense" : "Expense Details"}>
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Category</p>
              <p className="text-lg font-semibold text-gray-900">{expense.category_name}</p>
            </div>
            <p className="text-2xl font-bold text-red-600 tabular-nums">
              -{formatCurrency(expense.amount)}
            </p>
          </div>

          {isEditing ? (
            /* Edit Form */
            <div className="space-y-4 py-2 border-t border-gray-100">
              {/* Category */}
              <Select
                label="Category"
                options={categories.map((c) => ({ value: c.id, label: c.name }))}
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
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
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
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
            <div className="space-y-3 py-2 border-t border-gray-100">
              {/* Date */}
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-medium text-gray-900">
                    {formatDateShort(expense.expense_date)}
                  </p>
                </div>
              </div>

              {/* Account */}
              <div className="flex items-start gap-3">
                <Wallet className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Account</p>
                  <p className="font-medium text-gray-900">{accountName}</p>
                </div>
              </div>

              {/* Description */}
              {expense.description && (
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Description</p>
                    <p className="text-gray-700">{expense.description}</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t border-gray-100">
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => setIsEditing(true)}
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="danger"
                  fullWidth
                  onClick={handleDeleteClick}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Expense?"
        message={`This will permanently delete this expense of ${formatCurrency(expense.amount)} for "${expense.category_name}". The account balance will be restored. This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
      />
    </>
  );
}
