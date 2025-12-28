'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Modal, Input, Button, Textarea, useToast } from '@/components/ui';
import type { Customer } from '@/types';

interface CustomerEditModalProps {
  customer: Customer;
  isOpen: boolean;
  onClose: () => void;
}

export function CustomerEditModal({ customer, isOpen, onClose }: CustomerEditModalProps) {
  const router = useRouter();
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: customer.name,
    phone: customer.phone || '',
    notes: customer.notes || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      error('Name is required');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/customers/${customer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.phone.trim() || null,
          notes: form.notes.trim() || null,
        }),
      });

      if (res.ok) {
        success('Customer updated');
        onClose();
        router.refresh();
      } else {
        const json = await res.json();
        error(json.error || 'Failed to update customer');
      }
    } catch {
      error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Customer">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Customer Name"
          placeholder="Enter customer name"
          value={form.name}
          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          required
        />
        <Input
          label="Phone Number"
          type="tel"
          placeholder="Enter phone number (optional)"
          value={form.phone}
          onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
        />
        <Textarea
          label="Notes"
          placeholder="Add notes about this customer (optional)"
          value={form.notes}
          onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
          rows={3}
        />
        <Button type="submit" fullWidth loading={loading}>
          Save Changes
        </Button>
      </form>
    </Modal>
  );
}
