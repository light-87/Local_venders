'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout';
import { Card, Button, Input, useToast } from '@/components/ui';
import {
  User,
  Search,
  Calendar,
  Clock,
  MessageCircle,
  Send,
  ChevronRight,
  Phone,
  X,
} from 'lucide-react';
import type { Customer } from '@/types';

export default function ScheduleMessagePage() {
  const router = useRouter();
  const { success, error } = useToast();

  // Customer selection
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerList, setShowCustomerList] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  // Form state
  const [messageText, setMessageText] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('09:00');
  const [messageType, setMessageType] = useState<'maintenance' | 'reminder' | 'promotional' | 'custom'>('reminder');
  const [submitting, setSubmitting] = useState(false);

  // Set default date to tomorrow
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0] ?? '';
    setScheduledDate(dateStr);
  }, []);

  // Search customers
  useEffect(() => {
    const searchCustomers = async () => {
      if (customerSearch.length < 2) {
        setCustomers([]);
        return;
      }

      setSearchLoading(true);
      try {
        const res = await fetch(`/api/customers/search?q=${encodeURIComponent(customerSearch)}&hasPhone=true`);
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setCustomers(json.data);
        } else {
          setCustomers([]);
        }
      } catch (err) {
        console.error('Search error:', err);
        setCustomers([]);
      } finally {
        setSearchLoading(false);
      }
    };

    const debounce = setTimeout(searchCustomers, 300);
    return () => clearTimeout(debounce);
  }, [customerSearch]);

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerSearch('');
    setShowCustomerList(false);
  };

  const handleSubmit = async () => {
    if (!selectedCustomer) {
      error('Please select a customer');
      return;
    }
    if (!messageText.trim()) {
      error('Please enter a message');
      return;
    }
    if (!scheduledDate) {
      error('Please select a date');
      return;
    }

    // Combine date and time
    const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
    if (scheduledDateTime <= new Date()) {
      error('Scheduled time must be in the future');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedCustomer.id,
          messageType,
          messageText: messageText.trim(),
          scheduledDate: scheduledDateTime.toISOString(),
        }),
      });

      const json = await res.json();

      if (res.ok) {
        success('Message scheduled successfully');
        router.push('/messages');
      } else {
        error(json.error || 'Failed to schedule message');
      }
    } catch {
      error('Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const messageTypes = [
    { value: 'maintenance', label: 'Maintenance', description: 'Service/maintenance reminder' },
    { value: 'reminder', label: 'Reminder', description: 'General reminder' },
    { value: 'promotional', label: 'Promotional', description: 'Offers & promotions' },
    { value: 'custom', label: 'Custom', description: 'Custom message' },
  ] as const;

  return (
    <div>
      <PageHeader title="Schedule Message" showBack />

      <div className="p-4 space-y-6">
        {/* Customer Selection */}
        <section>
          <h2 className="text-sm font-medium text-gray-500 mb-3">Select Customer</h2>

          {selectedCustomer ? (
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-brand-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{selectedCustomer.name}</p>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Phone className="w-3.5 h-3.5" />
                      {selectedCustomer.phone}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </Card>
          ) : (
            <div className="relative">
              <Input
                placeholder="Search customers with phone..."
                value={customerSearch}
                onChange={(e) => {
                  setCustomerSearch(e.target.value);
                  setShowCustomerList(true);
                }}
                onFocus={() => setShowCustomerList(true)}
                startIcon={<Search className="w-5 h-5" />}
              />

              {showCustomerList && customerSearch.length >= 2 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-100 z-10 max-h-64 overflow-y-auto">
                  {searchLoading ? (
                    <div className="p-4 text-center text-gray-500">Searching...</div>
                  ) : customers.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      No customers with phone number found
                    </div>
                  ) : (
                    customers.map((customer) => (
                      <button
                        key={customer.id}
                        onClick={() => handleSelectCustomer(customer)}
                        className="w-full p-3 flex items-center gap-3 hover:bg-gray-50 transition-colors"
                      >
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-gray-500" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-medium text-gray-900">{customer.name}</p>
                          <p className="text-sm text-gray-500">{customer.phone}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Message Type */}
        <section>
          <h2 className="text-sm font-medium text-gray-500 mb-3">Message Type</h2>
          <div className="grid grid-cols-2 gap-2">
            {messageTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => setMessageType(type.value)}
                className={`p-3 rounded-xl border-2 text-left transition-colors ${
                  messageType === type.value
                    ? 'border-brand-500 bg-brand-50'
                    : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <p className={`font-medium ${messageType === type.value ? 'text-brand-700' : 'text-gray-900'}`}>
                  {type.label}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{type.description}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Message Text */}
        <section>
          <h2 className="text-sm font-medium text-gray-500 mb-3">Message</h2>
          <textarea
            className="w-full p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
            rows={4}
            placeholder="Enter your message..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
          />
          <p className="text-xs text-gray-400 mt-1">
            {messageText.length} characters
          </p>
        </section>

        {/* Schedule Date & Time */}
        <section>
          <h2 className="text-sm font-medium text-gray-500 mb-3">Schedule</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Date</label>
              <div className="relative">
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full p-3 pl-10 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Time</label>
              <div className="relative">
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full p-3 pl-10 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>
        </section>

        {/* Submit Button */}
        <Button
          fullWidth
          size="lg"
          icon={<Send className="w-5 h-5" />}
          onClick={handleSubmit}
          loading={submitting}
          disabled={!selectedCustomer || !messageText.trim()}
        >
          Schedule Message
        </Button>
      </div>
    </div>
  );
}
