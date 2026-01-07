'use client';

import { useState, useEffect } from 'react';
import { Modal } from './modal';
import { Button } from './button';
import { Input } from './input';
import { formatDateShort } from '@/lib/utils/format';
import { Shield, Calendar, Wrench } from 'lucide-react';

interface WarrantyItem {
  id: string;
  item_name: string;
  warranty_months: number | null;
  warranty_end_date: string | null;
  maintenance_interval_months: number | null;
  purchaseDate: string;
}

interface WarrantyEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: WarrantyItem | null;
  onUpdate: (id: string, data: {
    warrantyMonths?: number;
    warrantyEndDate?: string | null;
    maintenanceIntervalMonths?: number | null;
  }) => Promise<void>;
}

function calculateWarrantyEndDate(purchaseDate: string, warrantyMonths: number): string {
  const date = new Date(purchaseDate);
  date.setMonth(date.getMonth() + warrantyMonths);
  return date.toISOString().split('T')[0] ?? '';
}

function getWarrantyStatus(endDate: string): { status: 'active' | 'expiring' | 'expired'; daysLeft: number } {
  const now = new Date();
  const expiry = new Date(endDate);
  const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysLeft < 0) {
    return { status: 'expired', daysLeft };
  } else if (daysLeft <= 30) {
    return { status: 'expiring', daysLeft };
  } else {
    return { status: 'active', daysLeft };
  }
}

export function WarrantyEditModal({
  isOpen,
  onClose,
  item,
  onUpdate,
}: WarrantyEditModalProps) {
  const [loading, setLoading] = useState(false);
  const [warrantyMonths, setWarrantyMonths] = useState(0);
  const [warrantyEndDate, setWarrantyEndDate] = useState('');
  const [useCustomDate, setUseCustomDate] = useState(false);
  const [maintenanceInterval, setMaintenanceInterval] = useState<string>('');

  // Reset form when item changes
  useEffect(() => {
    if (item) {
      setWarrantyMonths(item.warranty_months || 0);
      setMaintenanceInterval(item.maintenance_interval_months?.toString() || '');

      // If there's a custom warranty_end_date, use it
      if (item.warranty_end_date) {
        setWarrantyEndDate(item.warranty_end_date);
        setUseCustomDate(true);
      } else if (item.warranty_months && item.warranty_months > 0) {
        // Calculate the end date from purchase date + months
        setWarrantyEndDate(calculateWarrantyEndDate(item.purchaseDate, item.warranty_months));
        setUseCustomDate(false);
      } else {
        setWarrantyEndDate('');
        setUseCustomDate(false);
      }
    }
  }, [item]);

  if (!item) return null;

  const calculatedEndDate = warrantyMonths > 0
    ? calculateWarrantyEndDate(item.purchaseDate, warrantyMonths)
    : '';

  const effectiveEndDate = useCustomDate ? warrantyEndDate : calculatedEndDate;
  const warrantyStatus = effectiveEndDate ? getWarrantyStatus(effectiveEndDate) : null;

  const handleSave = async () => {
    setLoading(true);
    try {
      await onUpdate(item.id, {
        warrantyMonths,
        warrantyEndDate: useCustomDate ? warrantyEndDate : null,
        maintenanceIntervalMonths: maintenanceInterval ? parseInt(maintenanceInterval, 10) : null,
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Edit Warranty">
      <div className="space-y-5">
        {/* Item Name */}
        <div>
          <p className="text-sm text-gray-500">Item</p>
          <p className="text-lg font-medium text-gray-900">{item.item_name}</p>
          <p className="text-sm text-gray-500">
            Purchased {formatDateShort(item.purchaseDate)}
          </p>
        </div>

        {/* Warranty Period */}
        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-gray-600 mb-2">
            <Shield className="w-4 h-4" />
            Warranty Period
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="0"
              value={warrantyMonths || ''}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10) || 0;
                setWarrantyMonths(val);
                if (!useCustomDate && val > 0) {
                  setWarrantyEndDate(calculateWarrantyEndDate(item.purchaseDate, val));
                }
              }}
              className="flex-1 h-11 px-4 text-base bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <select
              value="months"
              disabled
              className="h-11 px-4 text-base bg-gray-50 border border-gray-200 rounded-xl"
            >
              <option value="months">Months</option>
            </select>
          </div>
          {warrantyMonths > 0 && !useCustomDate && (
            <p className="mt-2 text-sm text-gray-500">
              Expires: {formatDateShort(calculatedEndDate)}
            </p>
          )}
        </div>

        {/* Custom End Date Toggle */}
        {warrantyMonths > 0 && (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="useCustomDate"
              checked={useCustomDate}
              onChange={(e) => {
                setUseCustomDate(e.target.checked);
                if (!e.target.checked) {
                  setWarrantyEndDate(calculatedEndDate);
                }
              }}
              className="h-4 w-4 text-brand-600 border-gray-300 rounded focus:ring-brand-500"
            />
            <label htmlFor="useCustomDate" className="text-sm text-gray-600">
              Use custom expiry date
            </label>
          </div>
        )}

        {/* Custom Expiry Date */}
        {warrantyMonths > 0 && useCustomDate && (
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-600 mb-2">
              <Calendar className="w-4 h-4" />
              Warranty Expiry Date
            </label>
            <Input
              type="date"
              value={warrantyEndDate}
              onChange={(e) => setWarrantyEndDate(e.target.value)}
            />
          </div>
        )}

        {/* Warranty Status */}
        {warrantyStatus && effectiveEndDate && (
          <div className={`p-3 rounded-xl ${
            warrantyStatus.status === 'active'
              ? 'bg-green-50'
              : warrantyStatus.status === 'expiring'
              ? 'bg-amber-50'
              : 'bg-red-50'
          }`}>
            <div className="flex items-center gap-2">
              <Shield className={`w-4 h-4 ${
                warrantyStatus.status === 'active'
                  ? 'text-green-600'
                  : warrantyStatus.status === 'expiring'
                  ? 'text-amber-600'
                  : 'text-red-600'
              }`} />
              <span className={`text-sm font-medium ${
                warrantyStatus.status === 'active'
                  ? 'text-green-700'
                  : warrantyStatus.status === 'expiring'
                  ? 'text-amber-700'
                  : 'text-red-700'
              }`}>
                {warrantyStatus.status === 'expired'
                  ? `Expired ${Math.abs(warrantyStatus.daysLeft)} days ago`
                  : warrantyStatus.daysLeft <= 30
                  ? `${warrantyStatus.daysLeft} days remaining`
                  : `${Math.floor(warrantyStatus.daysLeft / 30)} months remaining`}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Expires on {formatDateShort(effectiveEndDate)}
            </p>
          </div>
        )}

        {/* Maintenance Interval */}
        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-gray-600 mb-2">
            <Wrench className="w-4 h-4" />
            Service Reminder Interval
          </label>
          <select
            value={maintenanceInterval}
            onChange={(e) => setMaintenanceInterval(e.target.value)}
            className="w-full h-11 px-4 text-base bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">No reminder</option>
            <option value="1">Every 1 month</option>
            <option value="2">Every 2 months</option>
            <option value="3">Every 3 months</option>
            <option value="6">Every 6 months</option>
            <option value="12">Every 12 months</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <Button variant="secondary" fullWidth onClick={handleClose}>
            Cancel
          </Button>
          <Button fullWidth loading={loading} onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </div>
    </Modal>
  );
}
