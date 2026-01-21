'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Input, Select, Textarea, Modal, ConfirmModal, useToast } from '@/components/ui';
import { inventoryItemSchema, type InventoryItemInput } from '@/lib/utils/validators';
import { DEFAULT_UNITS } from '@/lib/constants';
import type { InventoryItem, InventoryCategory } from '@/types';
import { Trash2 } from 'lucide-react';

interface InventoryFormProps {
  item?: InventoryItem;
  categories: InventoryCategory[];
  onSuccess?: () => void; // Callback when item is successfully created/updated
  isModal?: boolean; // When used in a modal, don't navigate away
}

export function InventoryForm({ item, categories, onSuccess, isModal }: InventoryFormProps) {
  const router = useRouter();
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [localCategories, setLocalCategories] = useState(categories);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<InventoryItemInput>({
    resolver: zodResolver(inventoryItemSchema),
    defaultValues: {
      name: item?.name ?? '',
      categoryId: item?.category_id ?? null,
      currentStock: item?.current_stock ?? 0,
      unit: item?.unit ?? 'pcs',
      unitPrice: item?.unit_price ?? 0,
      costPrice: item?.cost_price ?? 0,
      minStockAlert: item?.min_stock_alert ?? 0,
      description: item?.description ?? '',
    },
  });

  const categoryId = watch('categoryId');

  const onSubmit = async (data: InventoryItemInput) => {
    setLoading(true);
    try {
      const url = item ? `/api/inventory/${item.id}` : '/api/inventory';
      const method = item ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        success(item ? 'Item updated' : 'Item created');
        if (isModal && onSuccess) {
          onSuccess();
        } else {
          router.push('/inventory');
          router.refresh();
        }
      } else {
        const json = await res.json();
        error(json.error || 'Failed to save item');
      }
    } catch {
      error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!item) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/inventory/${item.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        success('Item deleted');
        router.push('/inventory');
        router.refresh();
      } else {
        error('Failed to delete item');
      }
    } catch {
      error('Something went wrong');
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;

    setCategoryLoading(true);
    try {
      const res = await fetch('/api/inventory/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName.trim() }),
      });

      if (res.ok) {
        const json = await res.json();
        setLocalCategories((prev) => [...prev, json.category]);
        setValue('categoryId', json.category.id);
        setShowCategoryModal(false);
        setNewCategoryName('');
        success('Category created');
      } else {
        error('Failed to create category');
      }
    } catch {
      error('Something went wrong');
    } finally {
      setCategoryLoading(false);
    }
  };

  const categoryOptions = [
    { value: '', label: 'No Category' },
    ...localCategories.map((c) => ({ value: c.id, label: c.name })),
    { value: '__new__', label: '+ Create New Category' },
  ];

  const unitOptions = DEFAULT_UNITS.map((u) => ({ value: u, label: u }));

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Item Name *"
        placeholder="e.g., Wireless Mouse"
        error={errors.name?.message}
        {...register('name')}
      />

      <Select
        label="Category"
        options={categoryOptions}
        value={categoryId ?? ''}
        onChange={(e) => {
          if (e.target.value === '__new__') {
            setShowCategoryModal(true);
          } else {
            setValue('categoryId', e.target.value || null);
          }
        }}
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          type="number"
          step="0.01"
          label="Current Stock"
          error={errors.currentStock?.message}
          {...register('currentStock', { valueAsNumber: true })}
        />
        <Select
          label="Unit"
          options={unitOptions}
          error={errors.unit?.message}
          {...register('unit')}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          type="number"
          step="0.01"
          label="Selling Price *"
          startIcon="₹"
          error={errors.unitPrice?.message}
          {...register('unitPrice', { valueAsNumber: true })}
        />
        <Input
          type="number"
          step="0.01"
          label="Cost Price"
          startIcon="₹"
          error={errors.costPrice?.message}
          {...register('costPrice', { valueAsNumber: true })}
        />
      </div>

      <Input
        type="number"
        step="0.01"
        label="Low Stock Alert"
        helperText="Get alerted when stock falls below this level"
        error={errors.minStockAlert?.message}
        {...register('minStockAlert', { valueAsNumber: true })}
      />

      <Textarea
        label="Description"
        placeholder="Optional description..."
        {...register('description')}
      />

      <div className="flex gap-3 pt-4">
        {item && !isModal && (
          <Button
            type="button"
            variant="danger"
            icon={<Trash2 className="w-5 h-5" />}
            onClick={() => setShowDeleteModal(true)}
          />
        )}
        <Button type="submit" fullWidth loading={loading}>
          {item ? 'Update Item' : 'Add Item'}
        </Button>
      </div>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Item"
        message="Are you sure you want to delete this item? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        loading={loading}
      />

      {/* Create Category Modal */}
      <Modal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        title="Create Category"
      >
        <div className="space-y-4">
          <Input
            label="Category Name"
            placeholder="e.g., Electronics"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
          />
          <Button
            fullWidth
            loading={categoryLoading}
            onClick={handleCreateCategory}
          >
            Create Category
          </Button>
        </div>
      </Modal>
    </form>
  );
}
