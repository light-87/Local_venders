'use client';

import { useState } from 'react';
import { Modal, ConfirmModal } from './modal';
import { Badge } from './badge';
import { Button } from './button';
import { formatCurrency, formatDateShort } from '@/lib/utils/format';
import { ArrowDownLeft, ArrowUpRight, Trash2, Calendar, Wallet, FileText, ShoppingBag } from 'lucide-react';
import type { Transaction } from '@/types';

interface TransactionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  onDelete: (id: string) => Promise<void>;
}

export function TransactionDetailModal({
  isOpen,
  onClose,
  transaction,
  onDelete,
}: TransactionDetailModalProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!transaction) return null;

  const isIncome = transaction.type === 'income';
  const hasSale = !!transaction.sale_id;
  const account = transaction.account as { id: string; name: string } | undefined;
  const sale = transaction.sale as { id: string; bill_number: string; customer?: { id: string; name: string } } | undefined;

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

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Transaction Details">
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

            {/* Description */}
            {transaction.description && (
              <div className="pt-2 border-t border-gray-100">
                <p className="text-sm text-gray-500 mb-1">Description</p>
                <p className="text-gray-700">{transaction.description}</p>
              </div>
            )}
          </div>

          {/* Delete Button */}
          <div className="pt-4 border-t border-gray-100">
            <Button
              variant="danger"
              fullWidth
              onClick={handleDeleteClick}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Transaction
            </Button>
            {hasSale && (
              <p className="text-xs text-amber-600 text-center mt-2">
                This will also delete the linked sale and restore inventory
              </p>
            )}
          </div>
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
            : `This will permanently delete this ${transaction.type} transaction. The account balance will be adjusted accordingly. This action cannot be undone.`
        }
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
      />
    </>
  );
}
