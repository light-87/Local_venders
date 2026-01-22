'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, useToast } from '@/components/ui';
import { formatDateShort } from '@/lib/utils/format';
import { Bell, Clock, Check, AlertCircle, ChevronDown, ChevronUp, Send } from 'lucide-react';

interface Reminder {
  id: string;
  customer_id: string;
  message_type: string;
  message_text: string;
  scheduled_date: string;
  status: 'pending' | 'sent' | 'completed' | 'failed' | 'cancelled' | 'deleted';
  sent_count?: number;
  item_name?: string;
  time_slot?: string;
  last_sent_at?: string;
  completed_at?: string;
  reminder_type?: string;
  related_sale_id?: string;
  related_sale_item_id?: string;
}

interface CustomerRemindersSectionProps {
  customerId: string;
}

export function CustomerRemindersSection({ customerId }: CustomerRemindersSectionProps) {
  const router = useRouter();
  const { success, error } = useToast();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchReminders();
  }, [customerId]);

  const fetchReminders = async () => {
    try {
      const res = await fetch('/api/reminders');
      const json = await res.json();
      if (json.success) {
        // Filter reminders for this customer
        const customerReminders = (json.data as Reminder[]).filter(
          (r) => r.customer_id === customerId && r.status !== 'deleted'
        );
        setReminders(customerReminders);
      }
    } catch {
      console.error('Failed to fetch reminders');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkSent = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/reminders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_sent' }),
      });
      const json = await res.json();
      if (json.success) {
        success('Marked as sent');
        fetchReminders();
        router.refresh();
      } else {
        error(json.error || 'Failed to update');
      }
    } catch {
      error('Something went wrong');
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkCompleted = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/reminders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_completed' }),
      });
      const json = await res.json();
      if (json.success) {
        success('Marked as completed');
        fetchReminders();
        router.refresh();
      } else {
        error(json.error || 'Failed to update');
      }
    } catch {
      error('Something went wrong');
    } finally {
      setActionLoading(null);
    }
  };

  // Separate reminders into pending and history
  const pendingReminders = reminders.filter((r) => r.status === 'pending');
  const historyReminders = reminders.filter((r) => ['sent', 'completed'].includes(r.status));

  // Sort pending by date ascending, history by date descending
  pendingReminders.sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime());
  historyReminders.sort((a, b) => new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime());

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      case 'sent':
        return (
          <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
            <Send className="w-3 h-3" />
            Sent
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
            <Check className="w-3 h-3" />
            Completed
          </span>
        );
      default:
        return null;
    }
  };

  const isOverdue = (date: string) => {
    return new Date(date) < new Date();
  };

  if (loading) {
    return (
      <section>
        <h3 className="text-sm font-medium text-gray-500 mb-3">Service Reminders</h3>
        <Card>
          <div className="text-center py-4 text-gray-400">Loading...</div>
        </Card>
      </section>
    );
  }

  if (reminders.length === 0) {
    return (
      <section>
        <h3 className="text-sm font-medium text-gray-500 mb-3">Service Reminders</h3>
        <Card>
          <div className="text-center py-4">
            <p className="text-gray-500">No reminders scheduled</p>
            <p className="text-xs text-gray-400 mt-1">
              Add reminders when creating a sale or editing an item above
            </p>
          </div>
        </Card>
      </section>
    );
  }

  return (
    <section>
      <h3 className="text-sm font-medium text-gray-500 mb-3">
        Service Reminders ({pendingReminders.length} pending)
      </h3>

      {/* Pending Reminders */}
      {pendingReminders.length > 0 && (
        <div className="space-y-2 mb-4">
          {pendingReminders.map((reminder) => (
            <Card key={reminder.id} className="p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Bell className={`w-4 h-4 flex-shrink-0 ${isOverdue(reminder.scheduled_date) ? 'text-red-500' : 'text-amber-500'}`} />
                    <p className="font-medium text-gray-900 truncate">
                      {reminder.item_name || 'Service Reminder'}
                    </p>
                  </div>
                  <p className={`text-sm ${isOverdue(reminder.scheduled_date) ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                    {isOverdue(reminder.scheduled_date) ? 'Overdue: ' : 'Due: '}
                    {formatDateShort(reminder.scheduled_date)}
                  </p>
                  {isOverdue(reminder.scheduled_date) && (
                    <div className="flex items-center gap-1 mt-1 text-red-500 text-xs">
                      <AlertCircle className="w-3 h-3" />
                      Needs attention
                    </div>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleMarkSent(reminder.id)}
                    loading={actionLoading === reminder.id}
                    disabled={actionLoading !== null}
                  >
                    Sent
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleMarkCompleted(reminder.id)}
                    loading={actionLoading === reminder.id}
                    disabled={actionLoading !== null}
                  >
                    Done
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* History Toggle */}
      {historyReminders.length > 0 && (
        <>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-2"
          >
            {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {showHistory ? 'Hide' : 'Show'} history ({historyReminders.length})
          </button>

          {showHistory && (
            <div className="space-y-2">
              {historyReminders.map((reminder) => (
                <Card key={reminder.id} className="p-3 bg-gray-50">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-gray-700 truncate">
                          {reminder.item_name || 'Service Reminder'}
                        </p>
                        {getStatusBadge(reminder.status)}
                      </div>
                      <p className="text-xs text-gray-500">
                        Scheduled: {formatDateShort(reminder.scheduled_date)}
                        {reminder.completed_at && ` • Completed: ${formatDateShort(reminder.completed_at)}`}
                        {reminder.last_sent_at && ` • Sent: ${formatDateShort(reminder.last_sent_at)}`}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Helper note */}
      <p className="text-xs text-gray-400 mt-3 text-center">
        Tap an item above to add or edit reminders
      </p>
    </section>
  );
}
