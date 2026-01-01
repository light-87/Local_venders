'use client';

import { useState, useEffect } from 'react';
import { Modal, ConfirmModal } from './modal';
import { Button } from './button';
import { Input } from './input';
import { Textarea } from './textarea';
import { formatCurrency, formatDateShort } from '@/lib/utils/format';
import { Pencil, Trash2, Calendar, Tag, FileText, X } from 'lucide-react';
import type { Sale } from '@/types';

interface SaleEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
  onUpdate: (id: string, data: {
    discountAmount?: number;
    discountPercent?: number;
    discountDescription?: string | null;
    saleDate?: string;
    notes?: string | null;
  }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function SaleEditModal({
  isOpen,
  onClose,
  sale,
  onUpdate,
  onDelete,
}: SaleEditModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form state
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [discountDescription, setDiscountDescription] = useState('');
  const [saleDate, setSaleDate] = useState('');
  const [notes, setNotes] = useState('');

  // Reset form when sale changes
  useEffect(() => {
    if (sale) {
      setDiscountAmount(sale.discount_amount || 0);
      setDiscountPercent(sale.discount_percent || 0);
      setDiscountDescription(sale.discount_description || '');
      setSaleDate(sale.sale_date || '');
      setNotes(sale.notes || '');
      setIsEditing(false);
    }
  }, [sale]);

  if (!sale) return null;

  const customerName = sale.customer && typeof sale.customer === 'object' && 'name' in sale.customer
    ? (sale.customer as { name: string }).name
    : 'Walk-in';

  const handleSave = async () => {
    setLoading(true);
    try {
      await onUpdate(sale.id, {
        discountAmount: discountPercent > 0 ? 0 : discountAmount,
        discountPercent: discountPercent > 0 ? discountPercent : 0,
        discountDescription: discountDescription || null,
        saleDate,
        notes: notes || null,
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
      await onDelete(sale.id);
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
      <Modal isOpen={isOpen} onClose={handleClose} title={isEditing ? "Edit Sale" : "Sale Details"}>
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Bill Number</p>
              <p className="text-lg font-semibold text-gray-900">{sale.bill_number}</p>
            </div>
            <p className="text-2xl font-bold text-green-600 tabular-nums">
              {formatCurrency(sale.total_amount)}
            </p>
          </div>

          {/* Customer */}
          <div className="py-2 border-t border-gray-100">
            <p className="text-sm text-gray-500">Customer</p>
            <p className="font-medium text-gray-900">{customerName}</p>
          </div>

          {isEditing ? (
            /* Edit Form */
            <div className="space-y-4 py-2 border-t border-gray-100">
              {/* Discount */}
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-gray-600 mb-2">
                  <Tag className="w-4 h-4" />
                  Discount
                </label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      type="number"
                      placeholder="Amount"
                      value={discountAmount || ''}
                      onChange={(e) => {
                        setDiscountAmount(Number(e.target.value));
                        setDiscountPercent(0);
                      }}
                      startIcon="₹"
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      type="number"
                      placeholder="Percent"
                      value={discountPercent || ''}
                      onChange={(e) => {
                        setDiscountPercent(Number(e.target.value));
                        setDiscountAmount(0);
                      }}
                      endIcon="%"
                    />
                  </div>
                </div>
              </div>

              {/* Discount Description */}
              <Input
                label="Discount Reason"
                placeholder="e.g., Festival offer, Loyal customer"
                value={discountDescription}
                onChange={(e) => setDiscountDescription(e.target.value)}
              />

              {/* Sale Date */}
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-gray-600 mb-2">
                  <Calendar className="w-4 h-4" />
                  Sale Date
                </label>
                <Input
                  type="date"
                  value={saleDate}
                  onChange={(e) => setSaleDate(e.target.value)}
                />
              </div>

              {/* Notes */}
              <Textarea
                label="Notes"
                placeholder="Additional notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
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
                  <p className="text-sm text-gray-500">Sale Date</p>
                  <p className="font-medium text-gray-900">
                    {formatDateShort(sale.sale_date || sale.created_at)}
                  </p>
                </div>
              </div>

              {/* Discount */}
              {(sale.discount_amount > 0 || sale.discount_percent > 0) && (
                <div className="flex items-start gap-3">
                  <Tag className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Discount</p>
                    <p className="font-medium text-green-600">
                      {sale.discount_percent > 0
                        ? `${sale.discount_percent}% (-${formatCurrency(sale.discount_amount)})`
                        : `-${formatCurrency(sale.discount_amount)}`}
                    </p>
                    {sale.discount_description && (
                      <p className="text-sm text-gray-500">{sale.discount_description}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Notes */}
              {sale.notes && (
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Notes</p>
                    <p className="text-gray-700">{sale.notes}</p>
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
        title="Delete Sale?"
        message={`This will permanently delete sale "${sale.bill_number}" and restore the inventory. The account balance will be adjusted accordingly. This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
      />
    </>
  );
}
