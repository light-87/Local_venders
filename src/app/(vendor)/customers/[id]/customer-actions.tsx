'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, ConfirmModal, useToast } from '@/components/ui';
import { Pencil, Trash2, MessageCircle } from 'lucide-react';
import { CustomerEditModal } from './customer-edit-modal';
import type { Customer } from '@/types';

interface CustomerActionsProps {
  customer: Customer;
}

export function CustomerActions({ customer }: CustomerActionsProps) {
  const router = useRouter();
  const { success, error } = useToast();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [whatsappLoading, setWhatsappLoading] = useState(false);

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/customers/${customer.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        success('Customer deleted');
        router.push('/customers');
        router.refresh();
      } else {
        const json = await res.json();
        error(json.error || 'Failed to delete customer');
      }
    } catch {
      error('Something went wrong');
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
    }
  };

  const handleWhatsApp = async () => {
    // Open window immediately to avoid popup blocker (must be synchronous with user click)
    const newWindow = window.open('', '_blank');

    setWhatsappLoading(true);
    try {
      // Fetch fresh customer data to get the latest phone number (with cache busting)
      const res = await fetch(`/api/customers/${customer.id}?t=${Date.now()}`, {
        cache: 'no-store',
      });
      const json = await res.json();

      if (json.success && json.customer?.phone) {
        const phone = json.customer.phone.replace(/\D/g, '');
        const url = `https://wa.me/${phone.startsWith('91') ? phone : '91' + phone}`;
        if (newWindow) {
          newWindow.location.href = url;
        }
      } else if (json.success && !json.customer?.phone) {
        if (newWindow) newWindow.close();
        error('Customer has no phone number');
      } else {
        if (newWindow) newWindow.close();
        error('Failed to fetch customer data');
      }
    } catch {
      if (newWindow) newWindow.close();
      error('Something went wrong');
    } finally {
      setWhatsappLoading(false);
    }
  };

  return (
    <>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          icon={<Pencil className="w-4 h-4" />}
          onClick={() => setShowEditModal(true)}
        >
          Edit
        </Button>
        {customer.phone && (
          <Button
            variant="secondary"
            size="sm"
            icon={<MessageCircle className="w-4 h-4" />}
            onClick={handleWhatsApp}
            loading={whatsappLoading}
          >
            WhatsApp
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          icon={<Trash2 className="w-4 h-4 text-red-500" />}
          onClick={() => setShowDeleteModal(true)}
        />
      </div>

      <CustomerEditModal
        customer={customer}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
      />

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Customer"
        message={`Are you sure you want to delete "${customer.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        loading={deleteLoading}
      />
    </>
  );
}
