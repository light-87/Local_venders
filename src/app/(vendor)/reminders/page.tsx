'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout';
import { Card, Button, Badge, EmptyState, useToast, Modal, Input } from '@/components/ui';
import {
  Bell,
  MessageCircle,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Send,
  Calendar,
  User,
  Wrench,
  Trash2,
  RotateCcw,
  Plus,
  Search,
} from 'lucide-react';
import { formatDistanceToNow, format, isToday, isPast, isFuture } from 'date-fns';
import {
  createWhatsAppLink,
  generateMaintenanceReminderMessage,
  generateFollowUpReminderMessage,
} from '@/lib/utils/whatsapp';

interface Reminder {
  id: string;
  customer_id: string;
  message_type: string;
  message_text: string;
  scheduled_date: string;
  status: 'pending' | 'sent' | 'completed' | 'overdue' | 'deleted';
  sent_count: number;
  item_name: string | null;
  time_slot: string | null;
  last_sent_at: string | null;
  completed_at: string | null;
  customer: {
    id: string;
    name: string;
    phone: string | null;
  };
}

interface Customer {
  id: string;
  name: string;
  phone: string | null;
}

type TabType = 'overdue' | 'today' | 'upcoming' | 'completed';

export default function RemindersPage() {
  const { success, error: showError } = useToast();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('today');
  const [businessName, setBusinessName] = useState('');
  const [messageTemplate, setMessageTemplate] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; reminder: Reminder | null }>({
    open: false,
    reminder: null,
  });

  // Add Reminder Modal State
  const [addModal, setAddModal] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [itemName, setItemName] = useState('');
  const [warrantyValue, setWarrantyValue] = useState('');
  const [warrantyUnit, setWarrantyUnit] = useState<'months' | 'years'>('months');
  const [serviceInterval, setServiceInterval] = useState('');
  const [reminderDate, setReminderDate] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchReminders();
    fetchBusinessName();
    fetchMessageTemplate();
  }, []);

  // Search customers when typing
  useEffect(() => {
    if (customerSearch.length < 2) {
      setCustomers([]);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/customers/search?q=${encodeURIComponent(customerSearch)}`);
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setCustomers(json.data);
        } else {
          setCustomers([]);
        }
      } catch {
        setCustomers([]);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [customerSearch]);

  const fetchReminders = async () => {
    try {
      const res = await fetch('/api/reminders');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setReminders(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch reminders:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBusinessName = async () => {
    try {
      const res = await fetch('/api/settings');
      const json = await res.json();
      if (json.success && json.data?.vendor) {
        setBusinessName(json.data.vendor.business_name || json.data.vendor.name || 'Your Business');
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    }
  };

  const fetchMessageTemplate = async () => {
    try {
      const res = await fetch('/api/settings/message-template');
      const json = await res.json();
      if (json.success) {
        // Use custom template if available, otherwise use the default for the preferred language
        setMessageTemplate(json.data.customTemplate || json.data.defaultTemplate);
      }
    } catch (err) {
      console.error('Failed to fetch message template:', err);
    }
  };

  // Categorize reminders
  const categorizedReminders = {
    overdue: reminders.filter(
      (r) => r.status !== 'completed' && r.status !== 'deleted' && isPast(new Date(r.scheduled_date)) && !isToday(new Date(r.scheduled_date))
    ),
    today: reminders.filter(
      (r) => r.status !== 'completed' && r.status !== 'deleted' && isToday(new Date(r.scheduled_date))
    ),
    upcoming: reminders.filter(
      (r) => r.status !== 'completed' && r.status !== 'deleted' && isFuture(new Date(r.scheduled_date)) && !isToday(new Date(r.scheduled_date))
    ),
    completed: reminders.filter((r) => r.status === 'completed'),
  };

  const tabs: { id: TabType; label: string; count: number; icon: React.ReactNode }[] = [
    { id: 'overdue', label: 'Overdue', count: categorizedReminders.overdue.length, icon: <AlertTriangle className="w-4 h-4" /> },
    { id: 'today', label: 'Today', count: categorizedReminders.today.length, icon: <Bell className="w-4 h-4" /> },
    { id: 'upcoming', label: 'Upcoming', count: categorizedReminders.upcoming.length, icon: <Calendar className="w-4 h-4" /> },
    { id: 'completed', label: 'Done', count: categorizedReminders.completed.length, icon: <CheckCircle2 className="w-4 h-4" /> },
  ];

  const handleSendWhatsApp = (reminder: Reminder) => {
    if (!reminder.customer.phone) {
      showError('Customer has no phone number');
      return;
    }

    const isOverdue = isPast(new Date(reminder.scheduled_date)) && !isToday(new Date(reminder.scheduled_date));

    let message: string;
    if (isOverdue && reminder.sent_count > 0) {
      message = generateFollowUpReminderMessage({
        customerName: reminder.customer.name,
        itemName: reminder.item_name || 'equipment',
        businessName,
      });
    } else {
      message = generateMaintenanceReminderMessage({
        customerName: reminder.customer.name,
        itemName: reminder.item_name || 'equipment',
        scheduledDate: format(new Date(reminder.scheduled_date), 'MMMM d, yyyy'),
        timeSlot: reminder.time_slot || undefined,
        businessName,
        customTemplate: messageTemplate,
      });
    }

    const link = createWhatsAppLink(reminder.customer.phone, message);
    window.open(link, '_blank');
    handleMarkSent(reminder.id);
  };

  const handleMarkSent = async (reminderId: string) => {
    try {
      const res = await fetch(`/api/reminders/${reminderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_sent' }),
      });

      if (res.ok) {
        setReminders((prev) =>
          prev.map((r) =>
            r.id === reminderId
              ? { ...r, status: 'sent' as const, sent_count: r.sent_count + 1, last_sent_at: new Date().toISOString() }
              : r
          )
        );
      }
    } catch (err) {
      console.error('Failed to mark as sent:', err);
    }
  };

  const handleMarkCompleted = async (reminderId: string) => {
    try {
      const res = await fetch(`/api/reminders/${reminderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_completed' }),
      });

      if (res.ok) {
        success('Marked as completed!');
        setReminders((prev) =>
          prev.map((r) =>
            r.id === reminderId
              ? { ...r, status: 'completed' as const, completed_at: new Date().toISOString() }
              : r
          )
        );
      }
    } catch (err) {
      showError('Failed to mark as completed');
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.reminder) return;

    try {
      const res = await fetch(`/api/reminders/${deleteModal.reminder.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        success('Reminder deleted');
        setReminders((prev) => prev.filter((r) => r.id !== deleteModal.reminder!.id));
      } else {
        showError('Failed to delete reminder');
      }
    } catch (err) {
      showError('Failed to delete reminder');
    } finally {
      setDeleteModal({ open: false, reminder: null });
    }
  };

  const handleReschedule = async (reminderId: string, newDate: string) => {
    try {
      const res = await fetch(`/api/reminders/${reminderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reschedule', scheduled_date: newDate }),
      });

      if (res.ok) {
        success('Rescheduled successfully');
        fetchReminders();
      } else {
        showError('Failed to reschedule');
      }
    } catch (err) {
      showError('Failed to reschedule');
    }
  };

  const resetAddModal = () => {
    setSelectedCustomer(null);
    setNewCustomerName('');
    setNewCustomerPhone('');
    setCustomerSearch('');
    setCustomers([]);
    setItemName('');
    setWarrantyValue('');
    setWarrantyUnit('months');
    setServiceInterval('');
    setReminderDate('');
    setNotes('');
  };

  const handleAddReminder = async () => {
    if (!itemName.trim()) {
      showError('Item name is required');
      return;
    }
    if (!reminderDate) {
      showError('Reminder date is required');
      return;
    }
    if (!selectedCustomer && !newCustomerName.trim()) {
      showError('Please select or enter a customer');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedCustomer?.id,
          customerName: !selectedCustomer ? newCustomerName : undefined,
          customerPhone: !selectedCustomer ? newCustomerPhone : undefined,
          itemName,
          scheduledDate: reminderDate,
          warrantyMonths: warrantyValue ? (warrantyUnit === 'years' ? parseInt(warrantyValue) * 12 : parseInt(warrantyValue)) : null,
          maintenanceIntervalMonths: serviceInterval ? parseInt(serviceInterval) : null,
          notes,
        }),
      });

      const json = await res.json();

      if (json.success) {
        success('Reminder added!');
        setAddModal(false);
        resetAddModal();
        fetchReminders();
      } else {
        showError(json.error || 'Failed to add reminder');
      }
    } catch (err) {
      showError('Failed to add reminder');
    } finally {
      setSubmitting(false);
    }
  };

  const currentReminders = categorizedReminders[activeTab];

  if (loading) {
    return (
      <div>
        <PageHeader title="Reminders" />
        <div className="p-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Reminders"
        action={
          <Button
            size="sm"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setAddModal(true)}
          >
            Add
          </Button>
        }
      />

      <div className="p-4 space-y-4">
        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? tab.id === 'overdue'
                    ? 'bg-red-500 text-white'
                    : tab.id === 'completed'
                    ? 'bg-green-500 text-white'
                    : 'bg-brand-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.count > 0 && (
                <span
                  className={`ml-1 px-1.5 py-0.5 text-xs rounded-full ${
                    activeTab === tab.id ? 'bg-white/20' : 'bg-gray-200'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Reminder Cards */}
        {currentReminders.length === 0 ? (
          <EmptyState
            icon={<Bell className="w-8 h-8" />}
            title={
              activeTab === 'overdue'
                ? 'No Overdue Reminders'
                : activeTab === 'today'
                ? 'No Reminders for Today'
                : activeTab === 'upcoming'
                ? 'No Upcoming Reminders'
                : 'No Completed Reminders'
            }
            description={
              activeTab === 'overdue'
                ? 'Great! All your reminders are on track'
                : activeTab === 'today'
                ? 'You have no maintenance reminders scheduled for today'
                : activeTab === 'upcoming'
                ? 'Add reminders for existing customers using the + button'
                : 'Completed maintenance will appear here'
            }
          />
        ) : (
          <div className="space-y-3">
            {currentReminders.map((reminder) => (
              <ReminderCard
                key={reminder.id}
                reminder={reminder}
                isOverdue={activeTab === 'overdue'}
                isCompleted={activeTab === 'completed'}
                onSendWhatsApp={() => handleSendWhatsApp(reminder)}
                onMarkCompleted={() => handleMarkCompleted(reminder.id)}
                onDelete={() => setDeleteModal({ open: true, reminder })}
                onReschedule={(date) => handleReschedule(reminder.id, date)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, reminder: null })}
        title="Delete Reminder"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete this reminder for{' '}
            <span className="font-medium">{deleteModal.reminder?.customer.name}</span>?
          </p>
          <p className="text-sm text-gray-500">
            This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => setDeleteModal({ open: false, reminder: null })}
            >
              Cancel
            </Button>
            <Button
              fullWidth
              className="bg-red-500 hover:bg-red-600"
              onClick={handleDelete}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Reminder Modal */}
      <Modal
        isOpen={addModal}
        onClose={() => {
          setAddModal(false);
          resetAddModal();
        }}
        title="Add Reminder"
      >
        <div className="space-y-4">
          {/* Customer Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Customer
            </label>
            {selectedCustomer ? (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">{selectedCustomer.name}</span>
                  {selectedCustomer.phone && (
                    <span className="text-sm text-gray-500">({selectedCustomer.phone})</span>
                  )}
                </div>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="text-sm text-brand-500"
                >
                  Change
                </button>
              </div>
            ) : (
              <>
                <Input
                  placeholder="Search existing customers..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  startIcon={<Search className="w-4 h-4" />}
                />
                {customers.length > 0 && (
                  <div className="mt-2 max-h-32 overflow-y-auto space-y-1">
                    {customers.map((customer) => (
                      <button
                        key={customer.id}
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setCustomerSearch('');
                          setCustomers([]);
                        }}
                        className="w-full p-2 text-left rounded-lg hover:bg-gray-50 text-sm"
                      >
                        <span className="font-medium">{customer.name}</span>
                        {customer.phone && (
                          <span className="text-gray-500 ml-2">{customer.phone}</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-2">Or add new customer:</p>
                  <div className="space-y-2">
                    <Input
                      placeholder="Customer name"
                      value={newCustomerName}
                      onChange={(e) => setNewCustomerName(e.target.value)}
                    />
                    <Input
                      placeholder="Phone number"
                      value={newCustomerPhone}
                      onChange={(e) => setNewCustomerPhone(e.target.value)}
                      type="tel"
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Item Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Item / Equipment *
            </label>
            <Input
              placeholder="e.g., RO Water Purifier, AC Unit"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
            />
          </div>

          {/* Warranty (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Warranty (Optional)
            </label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="0"
                value={warrantyValue}
                onChange={(e) => setWarrantyValue(e.target.value)}
                className="flex-1"
              />
              <select
                value={warrantyUnit}
                onChange={(e) => setWarrantyUnit(e.target.value as 'months' | 'years')}
                className="h-10 px-3 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="months">Months</option>
                <option value="years">Years</option>
              </select>
            </div>
          </div>

          {/* Service Interval */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Service Interval
            </label>
            <select
              value={serviceInterval}
              onChange={(e) => setServiceInterval(e.target.value)}
              className="w-full h-10 px-3 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">No recurring reminder</option>
              <option value="1">Every 1 month</option>
              <option value="2">Every 2 months</option>
              <option value="3">Every 3 months</option>
              <option value="6">Every 6 months</option>
              <option value="12">Every 12 months</option>
            </select>
          </div>

          {/* First Reminder Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Reminder Date *
            </label>
            <input
              type="date"
              value={reminderDate}
              onChange={(e) => setReminderDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full h-10 px-3 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Notes (Optional)
            </label>
            <textarea
              placeholder="Any additional details..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => {
                setAddModal(false);
                resetAddModal();
              }}
            >
              Cancel
            </Button>
            <Button
              fullWidth
              onClick={handleAddReminder}
              loading={submitting}
            >
              Add Reminder
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

interface ReminderCardProps {
  reminder: Reminder;
  isOverdue: boolean;
  isCompleted: boolean;
  onSendWhatsApp: () => void;
  onMarkCompleted: () => void;
  onDelete: () => void;
  onReschedule: (date: string) => void;
}

function ReminderCard({
  reminder,
  isOverdue,
  isCompleted,
  onSendWhatsApp,
  onMarkCompleted,
  onDelete,
  onReschedule,
}: ReminderCardProps) {
  const [showReschedule, setShowReschedule] = useState(false);
  const [newDate, setNewDate] = useState('');

  const handleReschedule = () => {
    if (newDate) {
      onReschedule(newDate);
      setShowReschedule(false);
      setNewDate('');
    }
  };

  return (
    <Card className={`p-4 ${isOverdue ? 'border-l-4 border-l-red-500' : ''}`}>
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isOverdue
                  ? 'bg-red-100 text-red-600'
                  : isCompleted
                  ? 'bg-green-100 text-green-600'
                  : 'bg-brand-100 text-brand-600'
              }`}
            >
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">
                {reminder.item_name || 'Maintenance'}
              </h3>
              <div className="flex items-center gap-1.5 text-sm text-gray-500">
                <User className="w-3.5 h-3.5" />
                {reminder.customer.name}
              </div>
            </div>
          </div>

          {/* Status Badge */}
          {reminder.sent_count > 0 && !isCompleted && (
            <Badge variant={isOverdue ? 'error' : 'warning'}>
              Sent {reminder.sent_count}x
            </Badge>
          )}
          {isCompleted && <Badge variant="success">Completed</Badge>}
        </div>

        {/* Details */}
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            {isCompleted && reminder.completed_at ? (
              <span>Completed {formatDistanceToNow(new Date(reminder.completed_at), { addSuffix: true })}</span>
            ) : isOverdue ? (
              <span className="text-red-600">
                {formatDistanceToNow(new Date(reminder.scheduled_date), { addSuffix: true })}
              </span>
            ) : (
              <span>{format(new Date(reminder.scheduled_date), 'MMM d, yyyy')}</span>
            )}
          </div>
          {reminder.time_slot && (
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {reminder.time_slot}
            </div>
          )}
          {reminder.customer.phone && (
            <div className="flex items-center gap-1.5">
              <MessageCircle className="w-4 h-4" />
              {reminder.customer.phone}
            </div>
          )}
        </div>

        {/* Reschedule Form */}
        {showReschedule && (
          <div className="flex gap-2 p-3 bg-gray-50 rounded-xl">
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="flex-1 h-9 px-3 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <Button size="sm" onClick={handleReschedule} disabled={!newDate}>
              Save
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowReschedule(false)}>
              Cancel
            </Button>
          </div>
        )}

        {/* Actions */}
        {!isCompleted && (
          <div className="flex gap-2 pt-2">
            {reminder.customer.phone ? (
              <Button
                size="sm"
                icon={<Send className="w-4 h-4" />}
                onClick={onSendWhatsApp}
                className={isOverdue ? 'bg-red-500 hover:bg-red-600' : ''}
              >
                {isOverdue ? 'Send Follow-up' : 'Send Reminder'}
              </Button>
            ) : (
              <Button size="sm" disabled icon={<Send className="w-4 h-4" />}>
                No Phone
              </Button>
            )}
            <Button
              size="sm"
              variant="secondary"
              icon={<CheckCircle2 className="w-4 h-4" />}
              onClick={onMarkCompleted}
            >
              Done
            </Button>
            <Button
              size="sm"
              variant="ghost"
              icon={<RotateCcw className="w-4 h-4" />}
              onClick={() => setShowReschedule(!showReschedule)}
            >
              Reschedule
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-red-500 hover:text-red-600 hover:bg-red-50"
              icon={<Trash2 className="w-4 h-4" />}
              onClick={onDelete}
            />
          </div>
        )}
      </div>
    </Card>
  );
}
