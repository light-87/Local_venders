'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout';
import { Card, Button, Badge, EmptyState, useToast } from '@/components/ui';
import {
  MessageCircle,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  User,
  Calendar,
  Send,
  Loader2,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import type { ScheduledMessage, Customer } from '@/types';

interface MessageWithCustomer extends ScheduledMessage {
  customer: Customer;
}

type FilterStatus = 'all' | 'pending' | 'sent' | 'failed';

export default function MessagesPage() {
  const router = useRouter();
  const { success, error: showError } = useToast();
  const [messages, setMessages] = useState<MessageWithCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [hasWhatsApp, setHasWhatsApp] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchMessages();
    checkWhatsAppSetup();
  }, []);

  const fetchMessages = async () => {
    try {
      const res = await fetch('/api/messages');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setMessages(json.data);
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const checkWhatsAppSetup = async () => {
    try {
      const res = await fetch('/api/settings');
      const json = await res.json();
      if (json.success && json.data?.vendor?.whatsapp_phone_number_id) {
        setHasWhatsApp(true);
      }
    } catch (error) {
      console.error('Failed to check WhatsApp setup:', error);
    }
  };

  const handleSendNow = async () => {
    setSending(true);
    try {
      const res = await fetch('/api/messages/send-now', { method: 'POST' });
      const json = await res.json();

      if (json.success) {
        if (json.sent > 0) {
          success(`Sent ${json.sent} message${json.sent > 1 ? 's' : ''} successfully!`);
        } else if (json.processed === 0) {
          showError('No pending messages for today');
        } else {
          showError(`Failed to send ${json.failed} message${json.failed > 1 ? 's' : ''}`);
        }
        // Refresh messages list
        fetchMessages();
      } else {
        showError(json.error || 'Failed to send messages');
      }
    } catch (err) {
      showError('Failed to send messages');
    } finally {
      setSending(false);
    }
  };

  const pendingCount = messages.filter((m) => m.status === 'pending').length;

  const filteredMessages = messages.filter((msg) => {
    if (filter === 'all') return true;
    return msg.status === filter;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-amber-500" />;
      case 'sent':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'cancelled':
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning">Pending</Badge>;
      case 'sent':
        return <Badge variant="success">Sent</Badge>;
      case 'failed':
        return <Badge variant="error">Failed</Badge>;
      case 'cancelled':
        return <Badge variant="default">Cancelled</Badge>;
      default:
        return null;
    }
  };

  const filterTabs: { label: string; value: FilterStatus; count: number }[] = [
    { label: 'All', value: 'all', count: messages.length },
    { label: 'Pending', value: 'pending', count: messages.filter((m) => m.status === 'pending').length },
    { label: 'Sent', value: 'sent', count: messages.filter((m) => m.status === 'sent').length },
    { label: 'Failed', value: 'failed', count: messages.filter((m) => m.status === 'failed').length },
  ];

  if (loading) {
    return (
      <div>
        <PageHeader title="Messages" />
        <div className="p-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!hasWhatsApp) {
    return (
      <div>
        <PageHeader title="Messages" />
        <div className="p-4">
          <EmptyState
            icon={<MessageCircle className="w-8 h-8" />}
            title="WhatsApp Not Configured"
            description="Set up WhatsApp Cloud API to send messages to your customers"
            actionLabel="Go to Settings"
            actionHref="/settings"
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Messages"
        action={
          <div className="flex gap-2">
            {pendingCount > 0 && (
              <Button
                size="sm"
                variant="secondary"
                icon={sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                onClick={handleSendNow}
                disabled={sending}
              >
                {sending ? 'Sending...' : `Send Now (${pendingCount})`}
              </Button>
            )}
            <Button
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => router.push('/messages/schedule')}
            >
              Schedule
            </Button>
          </div>
        }
      />

      <div className="p-4 space-y-4">
        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {filterTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filter === tab.value
                  ? 'bg-brand-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-1.5 ${filter === tab.value ? 'text-brand-100' : 'text-gray-400'}`}>
                  ({tab.count})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Messages List */}
        {filteredMessages.length === 0 ? (
          <EmptyState
            icon={<MessageCircle className="w-8 h-8" />}
            title={filter === 'all' ? 'No Messages Yet' : `No ${filter} messages`}
            description={
              filter === 'all'
                ? 'Schedule your first message to a customer'
                : `You don't have any ${filter} messages`
            }
            actionLabel={filter === 'all' ? 'Schedule Message' : undefined}
            actionHref={filter === 'all' ? '/messages/schedule' : undefined}
          />
        ) : (
          <div className="space-y-3">
            {filteredMessages.map((message) => (
              <Card key={message.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Customer & Status */}
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center gap-1.5 text-gray-900 font-medium">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="truncate">{message.customer?.name || 'Unknown'}</span>
                      </div>
                      {getStatusBadge(message.status)}
                    </div>

                    {/* Message Preview */}
                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                      {message.message_text}
                    </p>

                    {/* Scheduled Date */}
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <Calendar className="w-3.5 h-3.5" />
                      {message.status === 'sent' && message.sent_at ? (
                        <span>Sent {formatDistanceToNow(new Date(message.sent_at), { addSuffix: true })}</span>
                      ) : message.status === 'pending' ? (
                        <span>Scheduled for {format(new Date(message.scheduled_date), 'MMM d, yyyy h:mm a')}</span>
                      ) : (
                        <span>{format(new Date(message.scheduled_date), 'MMM d, yyyy h:mm a')}</span>
                      )}
                    </div>

                    {/* Error Message */}
                    {message.status === 'failed' && message.error_message && (
                      <p className="text-xs text-red-500 mt-2">
                        Error: {message.error_message}
                      </p>
                    )}
                  </div>

                  {/* Status Icon */}
                  <div className="flex-shrink-0">
                    {getStatusIcon(message.status)}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
