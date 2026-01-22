'use client';

import { useState, useEffect } from 'react';
import { Modal } from './modal';
import { Button } from './button';
import { Input } from './input';
import { formatDateShort } from '@/lib/utils/format';
import { Shield, Calendar, Wrench, Plus, X } from 'lucide-react';

interface ServiceReminder {
  label: string;
  interval_months: number;
}

interface WarrantyItem {
  id: string;
  item_name: string;
  warranty_months: number | null;
  warranty_end_date: string | null;
  maintenance_interval_months: number | null;
  service_reminders: ServiceReminder[];
  installation_date: string | null;
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
    installationDate?: string | null;
    serviceReminders?: Array<{ label: string; interval_months: number }>;
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
  const [installationDate, setInstallationDate] = useState('');
  const [serviceReminders, setServiceReminders] = useState<Array<{ label: string; intervalMonths: string }>>([]);

  // Reset form when item changes
  useEffect(() => {
    if (item) {
      setWarrantyMonths(item.warranty_months || 0);

      // Set installation date
      setInstallationDate(item.installation_date || item.purchaseDate);

      // If there's a custom warranty_end_date, use it
      if (item.warranty_end_date) {
        setWarrantyEndDate(item.warranty_end_date);
        setUseCustomDate(true);
      } else if (item.warranty_months && item.warranty_months > 0) {
        const baseDate = item.installation_date || item.purchaseDate;
        setWarrantyEndDate(calculateWarrantyEndDate(baseDate, item.warranty_months));
        setUseCustomDate(false);
      } else {
        setWarrantyEndDate('');
        setUseCustomDate(false);
      }

      // Load service reminders
      if (item.service_reminders && item.service_reminders.length > 0) {
        setServiceReminders(
          item.service_reminders.map((r) => ({
            label: r.label,
            intervalMonths: r.interval_months.toString(),
          }))
        );
      } else if (item.maintenance_interval_months && item.maintenance_interval_months > 0) {
        // Convert legacy single interval to new format
        setServiceReminders([
          { label: 'Service', intervalMonths: item.maintenance_interval_months.toString() },
        ]);
      } else {
        setServiceReminders([]);
      }
    }
  }, [item]);

  if (!item) return null;

  const baseDate = installationDate || item.purchaseDate;
  const calculatedEndDate = warrantyMonths > 0
    ? calculateWarrantyEndDate(baseDate, warrantyMonths)
    : '';

  const effectiveEndDate = useCustomDate ? warrantyEndDate : calculatedEndDate;
  const warrantyStatus = effectiveEndDate ? getWarrantyStatus(effectiveEndDate) : null;

  const addServiceReminder = () => {
    setServiceReminders([...serviceReminders, { label: '', intervalMonths: '' }]);
  };

  const removeServiceReminder = (index: number) => {
    setServiceReminders(serviceReminders.filter((_, i) => i !== index));
  };

  const updateServiceReminder = (index: number, field: 'label' | 'intervalMonths', value: string) => {
    const updated = [...serviceReminders];
    const current = updated[index];
    if (!current) return;
    updated[index] = { ...current, [field]: value };
    setServiceReminders(updated);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Convert service reminders to API format
      const validReminders = serviceReminders
        .filter((r) => r.label.trim() && r.intervalMonths && parseInt(r.intervalMonths, 10) > 0)
        .map((r) => ({
          label: r.label.trim(),
          interval_months: parseInt(r.intervalMonths, 10),
        }));

      await onUpdate(item.id, {
        warrantyMonths,
        warrantyEndDate: useCustomDate ? warrantyEndDate : null,
        installationDate: installationDate || null,
        serviceReminders: validReminders,
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
    <Modal isOpen={isOpen} onClose={handleClose} title="Edit Item Details">
      <div className="space-y-5">
        {/* Item Name */}
        <div>
          <p className="text-sm text-gray-500">Item</p>
          <p className="text-lg font-medium text-gray-900">{item.item_name}</p>
        </div>

        {/* Installation/Purchase Date */}
        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-gray-600 mb-2">
            <Calendar className="w-4 h-4" />
            Installation / Purchase Date
          </label>
          <Input
            type="date"
            value={installationDate}
            onChange={(e) => {
              setInstallationDate(e.target.value);
              // Recalculate warranty end date if not using custom
              if (!useCustomDate && warrantyMonths > 0) {
                setWarrantyEndDate(calculateWarrantyEndDate(e.target.value, warrantyMonths));
              }
            }}
          />
          <p className="text-xs text-gray-400 mt-1">
            Service reminder dates are calculated from this date
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
                  setWarrantyEndDate(calculateWarrantyEndDate(baseDate, val));
                }
              }}
              className="flex-1 h-11 px-4 text-base bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <span className="flex items-center h-11 px-4 text-base bg-gray-50 border border-gray-200 rounded-xl text-gray-600">
              Months
            </span>
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

        {/* Service Reminders */}
        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-gray-600 mb-2">
            <Wrench className="w-4 h-4" />
            Service Reminders
          </label>
          <p className="text-xs text-gray-400 mb-3">
            Set up reminders for maintenance services (e.g., filter replacement)
          </p>

          {serviceReminders.length > 0 && (
            <div className="space-y-2 mb-3">
              {serviceReminders.map((reminder, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Service name (e.g., Membrane)"
                    value={reminder.label}
                    onChange={(e) => updateServiceReminder(index, 'label', e.target.value)}
                    className="flex-1 h-10 px-3 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    placeholder="Months"
                    value={reminder.intervalMonths}
                    onChange={(e) => updateServiceReminder(index, 'intervalMonths', e.target.value)}
                    className="w-20 h-10 px-3 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-center"
                  />
                  <span className="text-sm text-gray-500">mo</span>
                  <button
                    type="button"
                    onClick={() => removeServiceReminder(index)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <Button
            type="button"
            variant="secondary"
            size="sm"
            icon={<Plus className="w-4 h-4" />}
            onClick={addServiceReminder}
          >
            Add Reminder
          </Button>
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
