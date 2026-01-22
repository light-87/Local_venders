'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, WarrantyEditModal, useToast } from '@/components/ui';
import { formatDateShort } from '@/lib/utils/format';
import { Shield, Wrench, AlertCircle, Pencil } from 'lucide-react';
import Link from 'next/link';

interface ServiceReminder {
  label: string;
  interval_months: number;
}

// Helper to safely parse service_reminders (handles both JSONB and double-encoded string)
function parseServiceReminders(data: unknown): ServiceReminder[] {
  if (!data) return [];
  if (Array.isArray(data)) return data as ServiceReminder[];
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

interface SaleItem {
  id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  warranty_months: number | null;
  warranty_end_date: string | null;
  maintenance_interval_months: number | null;
  service_reminders?: ServiceReminder[];
  installation_date?: string | null;
  created_at: string;
  sale: {
    id: string;
    bill_id: string;
    created_at: string;
    sale_date: string;
  };
}

interface WarrantyItemsSectionProps {
  items: SaleItem[];
}

function getWarrantyStatus(item: SaleItem): {
  status: 'active' | 'expiring' | 'expired' | 'none';
  label: string;
  daysLeft?: number;
  expiryDate?: string;
} {
  if (!item.warranty_months || item.warranty_months === 0) {
    return { status: 'none', label: 'No Warranty' };
  }

  let expiryDate: Date;

  // Use custom warranty_end_date if set, otherwise calculate from sale date
  if (item.warranty_end_date) {
    expiryDate = new Date(item.warranty_end_date);
  } else {
    const purchaseDate = new Date(item.sale.sale_date || item.sale.created_at);
    expiryDate = new Date(purchaseDate);
    expiryDate.setMonth(expiryDate.getMonth() + item.warranty_months);
  }

  const now = new Date();
  const daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const expiryDateStr = expiryDate.toISOString().split('T')[0] ?? '';

  if (daysLeft < 0) {
    return { status: 'expired', label: 'Expired', daysLeft, expiryDate: expiryDateStr };
  } else if (daysLeft <= 30) {
    return { status: 'expiring', label: `${daysLeft} days left`, daysLeft, expiryDate: expiryDateStr };
  } else {
    const monthsLeft = Math.floor(daysLeft / 30);
    return { status: 'active', label: `${monthsLeft} months left`, daysLeft, expiryDate: expiryDateStr };
  }
}

export function WarrantyItemsSection({ items }: WarrantyItemsSectionProps) {
  const router = useRouter();
  const { success, error } = useToast();
  const [selectedItem, setSelectedItem] = useState<SaleItem | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const handleItemClick = (item: SaleItem, e: React.MouseEvent) => {
    e.preventDefault();
    setSelectedItem(item);
    setShowEditModal(true);
  };

  const handleUpdateWarranty = async (id: string, data: {
    warrantyMonths?: number;
    warrantyEndDate?: string | null;
    maintenanceIntervalMonths?: number | null;
    installationDate?: string | null;
    serviceReminders?: Array<{ label: string; interval_months: number }>;
  }) => {
    try {
      const res = await fetch(`/api/sale-items/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to update warranty');
      }

      success('Item updated successfully');
      router.refresh();
    } catch (err) {
      error(err instanceof Error ? err.message : 'Something went wrong');
      throw err;
    }
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <>
      <section>
        <h3 className="text-sm font-medium text-gray-500 mb-3">Purchased Items</h3>
        <div className="space-y-2">
          {items.map((item) => {
            const warranty = getWarrantyStatus(item);
            return (
              <Card
                key={item.id}
                variant="interactive"
                className="p-3 cursor-pointer"
                onClick={(e) => handleItemClick(item, e)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 truncate">{item.item_name}</p>
                      <Pencil className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    </div>
                    <p className="text-sm text-gray-500">
                      {item.installation_date ? 'Installed' : 'Purchased'} {formatDateShort(item.installation_date || item.sale.sale_date || item.sale.created_at)}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {/* Warranty Badge */}
                      {item.warranty_months && item.warranty_months > 0 && (
                        <span
                          className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                            warranty.status === 'active'
                              ? 'bg-green-50 text-green-700'
                              : warranty.status === 'expiring'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-red-50 text-red-700'
                          }`}
                        >
                          <Shield className="w-3 h-3" />
                          {warranty.label}
                        </span>
                      )}
                      {/* Custom date indicator */}
                      {item.warranty_end_date && (
                        <span className="inline-flex items-center gap-1 text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">
                          Custom expiry
                        </span>
                      )}
                      {/* Service Reminders Badges */}
                      {parseServiceReminders(item.service_reminders).length > 0 ? (
                        parseServiceReminders(item.service_reminders).map((reminder, idx) => (
                          <span key={idx} className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                            <Wrench className="w-3 h-3" />
                            {reminder.label}: {reminder.interval_months}mo
                          </span>
                        ))
                      ) : (
                        /* Fallback to legacy maintenance interval */
                        item.maintenance_interval_months && item.maintenance_interval_months > 0 && (
                          <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                            <Wrench className="w-3 h-3" />
                            Every {item.maintenance_interval_months}mo
                          </span>
                        )
                      )}
                    </div>
                  </div>
                  {warranty.status === 'expiring' && (
                    <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                  )}
                </div>
              </Card>
            );
          })}
        </div>
        <p className="text-xs text-gray-400 mt-2 text-center">
          Tap an item to edit warranty
        </p>
      </section>

      {selectedItem && (
        <WarrantyEditModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedItem(null);
          }}
          item={{
            id: selectedItem.id,
            item_name: selectedItem.item_name,
            warranty_months: selectedItem.warranty_months,
            warranty_end_date: selectedItem.warranty_end_date,
            maintenance_interval_months: selectedItem.maintenance_interval_months,
            service_reminders: parseServiceReminders(selectedItem.service_reminders),
            installation_date: selectedItem.installation_date || null,
            purchaseDate: selectedItem.sale.sale_date || selectedItem.sale.created_at,
          }}
          onUpdate={handleUpdateWarranty}
        />
      )}
    </>
  );
}
