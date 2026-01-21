'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout';
import {
  Button,
  Card,
  Input,
  Select,
  Modal,
  Badge,
  useToast,
} from '@/components/ui';
import { formatCurrency, formatQuantity, getISTDateString } from '@/lib/utils/format';
import {
  Search,
  Plus,
  Minus,
  X,
  ShoppingCart,
  User,
  Check,
  ChevronDown,
  ChevronUp,
  Shield,
  Wrench,
  Calendar,
  Package,
  StickyNote,
  MapPin,
  Info,
  Bell,
} from 'lucide-react';
import type { InventoryItem, Account, Customer, CartItem, InventoryCategory, CartServiceReminder } from '@/types';
import { InventoryForm } from '@/app/(vendor)/inventory/inventory-form';

export default function NewSalePage() {
  const router = useRouter();
  const { success, error } = useToast();

  // Data states
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  // UI states
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [categories, setCategories] = useState<InventoryCategory[]>([]);

  // Sale type state (regular or record-only for existing customers)
  const [isRecordOnly, setIsRecordOnly] = useState(false);

  // Cart states
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerAddress, setNewCustomerAddress] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [discountDescription, setDiscountDescription] = useState('');
  const [saleDate, setSaleDate] = useState(getISTDateString());
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState('');

  // Small items state
  const [smallItemDescription, setSmallItemDescription] = useState('');
  const [smallItemAmount, setSmallItemAmount] = useState<number | ''>('');

  // Load initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [invRes, accRes, catRes] = await Promise.all([
          fetch('/api/inventory'),
          fetch('/api/accounts'),
          fetch('/api/inventory/categories'),
        ]);

        const invData = await invRes.json();
        const accData = await accRes.json();
        const catData = await catRes.json();

        if (invData.success) setInventory(invData.items);
        if (accData.success) {
          setAccounts(accData.accounts);
          // Set default account
          const defaultAcc = accData.accounts.find((a: Account) => a.is_default);
          if (defaultAcc) setSelectedAccountId(defaultAcc.id);
        }
        if (catData.success) setCategories(catData.categories);
      } catch {
        error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [error]);

  // Refresh inventory after adding new item
  const refreshInventory = async () => {
    try {
      const [invRes, catRes] = await Promise.all([
        fetch('/api/inventory'),
        fetch('/api/inventory/categories'),
      ]);
      const invData = await invRes.json();
      const catData = await catRes.json();
      if (invData.success) setInventory(invData.items);
      if (catData.success) setCategories(catData.categories);
    } catch {
      // Silently fail, the data will be stale but still usable
    }
  };

  // Search customers
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

  // Filter inventory by search
  const filteredInventory = inventory.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  // Cart calculations
  const subtotal = cart.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const discountValue = discountPercent > 0 ? subtotal * (discountPercent / 100) : discountAmount;
  const total = subtotal - discountValue;

  // Add item to cart
  const addToCart = (item: InventoryItem) => {
    const existing = cart.find((c) => c.inventoryItemId === item.id);
    if (existing) {
      updateQuantity(item.id, existing.quantity + 1);
    } else {
      setCart((prev) => [
        ...prev,
        {
          inventoryItemId: item.id,
          name: item.name,
          quantity: 1,
          unitPrice: item.unit_price,
          unit: item.unit,
          availableStock: item.current_stock,
        },
      ]);
    }
  };

  // Update item quantity
  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    setCart((prev) =>
      prev.map((item) =>
        item.inventoryItemId === itemId ? { ...item, quantity } : item
      )
    );
  };

  // Remove item from cart
  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((item) => item.inventoryItemId !== itemId));
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      newSet.delete(itemId);
      return newSet;
    });
  };

  // Toggle expanded state for cart item
  const toggleExpanded = (itemId: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  // Update warranty for a cart item
  const updateWarranty = (itemId: string, value: number, unit: 'months' | 'years') => {
    setCart((prev) =>
      prev.map((item) =>
        item.inventoryItemId === itemId
          ? { ...item, warrantyValue: value, warrantyUnit: unit }
          : item
      )
    );
  };

  // Update maintenance for a cart item (legacy single reminder)
  const updateMaintenance = (itemId: string, value: number, unit: 'months' | 'years') => {
    setCart((prev) =>
      prev.map((item) =>
        item.inventoryItemId === itemId
          ? { ...item, maintenanceValue: value, maintenanceUnit: unit }
          : item
      )
    );
  };

  // Add a service reminder to a cart item
  const addServiceReminder = (itemId: string) => {
    setCart((prev) =>
      prev.map((item) =>
        item.inventoryItemId === itemId
          ? {
              ...item,
              serviceReminders: [
                ...(item.serviceReminders || []),
                { label: '', intervalValue: 0, intervalUnit: 'months' as const },
              ],
            }
          : item
      )
    );
  };

  // Update a service reminder for a cart item
  const updateServiceReminder = (
    itemId: string,
    reminderIndex: number,
    field: 'label' | 'intervalValue' | 'intervalUnit',
    value: string | number
  ) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.inventoryItemId !== itemId) return item;
        const reminders = [...(item.serviceReminders || [])];
        if (reminders[reminderIndex]) {
          reminders[reminderIndex] = { ...reminders[reminderIndex], [field]: value };
        }
        return { ...item, serviceReminders: reminders };
      })
    );
  };

  // Remove a service reminder from a cart item
  const removeServiceReminder = (itemId: string, reminderIndex: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.inventoryItemId !== itemId) return item;
        const reminders = [...(item.serviceReminders || [])];
        reminders.splice(reminderIndex, 1);
        return { ...item, serviceReminders: reminders };
      })
    );
  };

  // Helper to convert service reminders to API format (array of { label, intervalMonths })
  const getServiceRemindersForAPI = (item: CartItem) => {
    if (!item.serviceReminders || item.serviceReminders.length === 0) return [];
    return item.serviceReminders
      .filter((r) => r.label && r.intervalValue > 0)
      .map((r) => ({
        label: r.label,
        intervalMonths: r.intervalUnit === 'years' ? r.intervalValue * 12 : r.intervalValue,
      }));
  };

  // Helper to convert maintenance to months
  const getMaintenanceMonths = (item: CartItem): number => {
    if (!item.maintenanceValue) return 0;
    return item.maintenanceUnit === 'years' ? item.maintenanceValue * 12 : item.maintenanceValue;
  };

  // Helper to convert warranty to months
  const getWarrantyMonths = (item: CartItem): number => {
    if (!item.warrantyValue) return 0;
    return item.warrantyUnit === 'years' ? item.warrantyValue * 12 : item.warrantyValue;
  };

  // Select customer
  const selectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowCustomerModal(false);
    setCustomerSearch('');
    setNewCustomerName('');
    setNewCustomerPhone('');
    setNewCustomerAddress('');
  };

  // Add small item to cart
  const addSmallItem = () => {
    if (!smallItemAmount || smallItemAmount <= 0) return;

    // Check if small item already exists in cart and update it
    const existingSmallItem = cart.find((item) => item.isSmallItem);
    if (existingSmallItem) {
      // Replace the existing small item
      setCart((prev) =>
        prev.map((item) =>
          item.isSmallItem
            ? {
                ...item,
                name: smallItemDescription.trim() || 'Small Items',
                unitPrice: smallItemAmount,
              }
            : item
        )
      );
    } else {
      // Add new small item
      setCart((prev) => [
        ...prev,
        {
          inventoryItemId: null,
          name: smallItemDescription.trim() || 'Small Items',
          quantity: 1,
          unitPrice: smallItemAmount,
          unit: 'lot',
          availableStock: 999,
          isSmallItem: true,
        },
      ]);
    }

    // Clear the inputs
    setSmallItemDescription('');
    setSmallItemAmount('');
  };

  // Remove small item from cart
  const removeSmallItem = () => {
    setCart((prev) => prev.filter((item) => !item.isSmallItem));
  };

  // Create sale
  const handleSubmit = async () => {
    if (cart.length === 0) {
      error('Add at least one item');
      return;
    }

    if (!selectedAccountId) {
      error('Select a payment account');
      return;
    }

    setSubmitting(true);
    try {
      // Get small item from cart if exists
      const smallItem = cart.find((item) => item.isSmallItem);

      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedCustomer?.id,
          customerName: !selectedCustomer && newCustomerName ? newCustomerName : undefined,
          customerPhone: !selectedCustomer && newCustomerPhone ? newCustomerPhone : undefined,
          customerAddress: !selectedCustomer && newCustomerAddress ? newCustomerAddress : undefined,
          accountId: selectedAccountId,
          saleType: isRecordOnly ? 'service_record' : 'regular',
          items: cart.filter(item => !item.isSmallItem).map((item) => ({
            inventoryItemId: item.inventoryItemId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            warrantyMonths: getWarrantyMonths(item),
            maintenanceIntervalMonths: getMaintenanceMonths(item),
            serviceReminders: getServiceRemindersForAPI(item),
          })),
          // Small item data
          smallItemName: smallItem?.name,
          smallItemAmount: smallItem?.unitPrice,
          discountAmount: discountPercent > 0 ? 0 : discountAmount,
          discountPercent: discountPercent > 0 ? discountPercent : 0,
          discountDescription: discountDescription || undefined,
          notes: notes.trim() || undefined,
          saleDate,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        success('Sale completed!');
        router.push(`/bill/${data.sale.bill_id}`);
      } else {
        error(data.error || 'Failed to create sale');
      }
    } catch {
      error('Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="New Sale" showBack />
        <div className="p-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="pb-32">
      <PageHeader title="New Sale" showBack backHref="/dashboard" />

      <div className="p-4 space-y-6">
        {/* Record Only Toggle */}
        <section>
          <button
            onClick={() => setIsRecordOnly(!isRecordOnly)}
            className={`w-full p-4 rounded-xl border-2 transition-all ${
              isRecordOnly
                ? 'bg-amber-50 border-amber-400'
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  isRecordOnly ? 'bg-amber-100' : 'bg-gray-200'
                }`}>
                  <Info className={`w-5 h-5 ${isRecordOnly ? 'text-amber-600' : 'text-gray-500'}`} />
                </div>
                <div className="text-left">
                  <p className={`font-medium ${isRecordOnly ? 'text-amber-900' : 'text-gray-700'}`}>
                    Record Only Mode
                  </p>
                  <p className="text-xs text-gray-500">
                    For existing customers (no inventory/income changes)
                  </p>
                </div>
              </div>
              <div className={`w-12 h-6 rounded-full transition-colors ${
                isRecordOnly ? 'bg-amber-500' : 'bg-gray-300'
              }`}>
                <div className={`w-5 h-5 mt-0.5 rounded-full bg-white shadow transition-transform ${
                  isRecordOnly ? 'translate-x-6' : 'translate-x-0.5'
                }`} />
              </div>
            </div>
          </button>
          {isRecordOnly && (
            <p className="mt-2 px-2 text-xs text-amber-700">
              This will NOT deduct inventory stock or add to income/sales amount. Use this for recording items purchased elsewhere.
            </p>
          )}
        </section>

        {/* Customer Section */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-medium text-gray-500">Customer</h2>
            {(selectedCustomer || newCustomerName) && (
              <button
                onClick={() => {
                  setSelectedCustomer(null);
                  setNewCustomerName('');
                  setNewCustomerPhone('');
                  setNewCustomerAddress('');
                }}
                className="text-sm text-brand-500"
              >
                Change
              </button>
            )}
          </div>
          {selectedCustomer ? (
            <Card>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-brand-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{selectedCustomer.name}</p>
                  <p className="text-sm text-gray-500">
                    {selectedCustomer.total_purchases} purchases
                  </p>
                </div>
              </div>
            </Card>
          ) : newCustomerName ? (
            <Card>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Plus className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{newCustomerName}</p>
                    <p className="text-sm text-gray-500">
                      {newCustomerPhone ? newCustomerPhone : 'New customer'}
                    </p>
                    {newCustomerAddress && (
                      <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {newCustomerAddress.length > 30 ? newCustomerAddress.substring(0, 30) + '...' : newCustomerAddress}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setNewCustomerName('');
                    setNewCustomerPhone('');
                    setNewCustomerAddress('');
                  }}
                  className="p-2 text-gray-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </Card>
          ) : (
            <Button
              variant="secondary"
              fullWidth
              icon={<User className="w-5 h-5" />}
              onClick={() => setShowCustomerModal(true)}
            >
              Add Customer (Optional)
            </Button>
          )}
        </section>

        {/* Item Search */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-medium text-gray-500">Add Items</h2>
            <button
              onClick={() => setShowAddItemModal(true)}
              className="flex items-center gap-1 text-sm text-brand-500 hover:text-brand-600"
            >
              <Plus className="w-4 h-4" />
              New Item
            </button>
          </div>
          <Input
            type="search"
            placeholder="Search inventory..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            startIcon={<Search className="w-5 h-5" />}
          />

          {/* Inventory Grid */}
          <div className="mt-3 grid grid-cols-2 gap-2">
            {filteredInventory.slice(0, 20).map((item) => {
              const inCart = cart.find((c) => c.inventoryItemId === item.id);
              // In record-only mode, allow all items regardless of stock
              const isOutOfStock = !isRecordOnly && item.current_stock <= 0;

              return (
                <button
                  key={item.id}
                  onClick={() => !isOutOfStock && addToCart(item)}
                  disabled={isOutOfStock}
                  className={`p-3 rounded-xl text-left transition-all ${
                    inCart
                      ? 'bg-brand-50 border-2 border-brand-500'
                      : 'bg-white border border-gray-200'
                  } ${isOutOfStock ? 'opacity-50' : ''}`}
                >
                  <p className="font-medium text-gray-900 truncate">{item.name}</p>
                  <p className="text-sm text-gray-500 tabular-nums">
                    {formatCurrency(item.unit_price)}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-400">
                      {isRecordOnly ? 'Record only' : formatQuantity(item.current_stock, item.unit)}
                    </span>
                    {inCart && (
                      <Badge variant="success" size="sm">
                        {inCart.quantity}
                      </Badge>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Small Items Section */}
        <section>
          <h2 className="text-sm font-medium text-gray-500 mb-2">Small Items</h2>
          <Card>
            {/* Show existing small item if in cart */}
            {cart.find((item) => item.isSmallItem) && (
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100">
                <div>
                  <p className="font-medium text-gray-900">
                    {cart.find((item) => item.isSmallItem)?.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatCurrency(cart.find((item) => item.isSmallItem)?.unitPrice || 0)}
                  </p>
                </div>
                <button
                  onClick={removeSmallItem}
                  className="p-2 rounded-full text-red-500 hover:bg-red-50"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            <p className="text-xs text-gray-500 mb-2">
              {cart.find((item) => item.isSmallItem)
                ? 'Update small items (will replace existing)'
                : 'Add nuts, bolts, small parts, etc.'}
            </p>
            <div className="space-y-2">
              <Input
                placeholder="Description (optional)"
                value={smallItemDescription}
                onChange={(e) => setSmallItemDescription(e.target.value)}
              />
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    type="number"
                    placeholder="Amount"
                    value={smallItemAmount}
                    onChange={(e) => setSmallItemAmount(Number(e.target.value) || '')}
                    startIcon="₹"
                  />
                </div>
                <Button
                  onClick={addSmallItem}
                  disabled={!smallItemAmount || smallItemAmount <= 0}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              </div>
            </div>
          </Card>
        </section>

        {/* Cart */}
        {cart.length > 0 && (
          <section>
            <h2 className="text-sm font-medium text-gray-500 mb-2">
              Cart ({cart.length} items)
            </h2>
            <Card>
              <div className="space-y-3">
                {cart.filter(item => !item.isSmallItem).map((item) => {
                  const itemId = item.inventoryItemId!;
                  const isExpanded = expandedItems.has(itemId);
                  const hasWarrantyOrReminders = item.warrantyValue || (item.serviceReminders && item.serviceReminders.length > 0);

                  return (
                    <div
                      key={itemId}
                      className="py-2 border-b border-gray-100 last:border-0"
                    >
                      {/* Main item row */}
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{item.name}</p>
                          <p className="text-sm text-gray-500">
                            {formatCurrency(item.unitPrice)} × {item.quantity}
                          </p>
                          {/* Show warranty/service badges if set */}
                          {hasWarrantyOrReminders && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {item.warrantyValue && (
                                <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                                  <Shield className="w-3 h-3" />
                                  {item.warrantyValue} {item.warrantyUnit}
                                </span>
                              )}
                              {item.serviceReminders?.filter(r => r.label && r.intervalValue > 0).map((reminder, idx) => (
                                <span key={idx} className="inline-flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                                  <Bell className="w-3 h-3" />
                                  {reminder.label}: {reminder.intervalValue} {reminder.intervalUnit}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(itemId, item.quantity - 1)}
                            className="p-2 rounded-full bg-gray-100"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <input
                            type="number"
                            inputMode="numeric"
                            min={1}
                            max={item.availableStock}
                            value={item.quantity}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              if (!isNaN(val) && val >= 1) {
                                updateQuantity(itemId, Math.min(val, item.availableStock));
                              }
                            }}
                            className="w-14 h-8 text-center font-medium bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                          />
                          <button
                            onClick={() => updateQuantity(itemId, item.quantity + 1)}
                            className="p-2 rounded-full bg-gray-100"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => removeFromCart(itemId)}
                            className="p-2 rounded-full text-red-500"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Expand/Collapse button */}
                      <button
                        onClick={() => toggleExpanded(itemId)}
                        className="mt-2 w-full flex items-center justify-center gap-1 text-xs text-gray-500 hover:text-gray-700 py-1"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="w-3 h-3" />
                            Hide warranty & service
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-3 h-3" />
                            Add warranty & service
                          </>
                        )}
                      </button>

                      {/* Expanded warranty/maintenance section */}
                      {isExpanded && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-xl space-y-3">
                          {/* Warranty */}
                          <div>
                            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1.5">
                              <Shield className="w-3.5 h-3.5" />
                              Warranty
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="number"
                                inputMode="numeric"
                                min={0}
                                placeholder="0"
                                value={item.warrantyValue || ''}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value, 10) || 0;
                                  updateWarranty(itemId, val, item.warrantyUnit || 'months');
                                }}
                                className="flex-1 h-9 px-3 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                              />
                              <select
                                value={item.warrantyUnit || 'months'}
                                onChange={(e) => {
                                  updateWarranty(
                                    itemId,
                                    item.warrantyValue || 0,
                                    e.target.value as 'months' | 'years'
                                  );
                                }}
                                className="h-9 px-3 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                              >
                                <option value="months">Months</option>
                                <option value="years">Years</option>
                              </select>
                            </div>
                          </div>

                          {/* Service Reminders (Multiple) */}
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
                                <Bell className="w-3.5 h-3.5" />
                                Service Reminders
                              </label>
                              <button
                                type="button"
                                onClick={() => addServiceReminder(itemId)}
                                className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700"
                              >
                                <Plus className="w-3 h-3" />
                                Add Reminder
                              </button>
                            </div>

                            {/* List of service reminders */}
                            {item.serviceReminders && item.serviceReminders.length > 0 ? (
                              <div className="space-y-2">
                                {item.serviceReminders.map((reminder, idx) => (
                                  <div key={idx} className="flex gap-2 items-center">
                                    <input
                                      type="text"
                                      placeholder="Label (e.g., Membrane)"
                                      value={reminder.label}
                                      onChange={(e) => updateServiceReminder(itemId, idx, 'label', e.target.value)}
                                      className="flex-1 h-9 px-3 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                                    />
                                    <input
                                      type="number"
                                      inputMode="numeric"
                                      min={1}
                                      placeholder="0"
                                      value={reminder.intervalValue || ''}
                                      onChange={(e) => updateServiceReminder(itemId, idx, 'intervalValue', parseInt(e.target.value, 10) || 0)}
                                      className="w-16 h-9 px-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                                    />
                                    <select
                                      value={reminder.intervalUnit}
                                      onChange={(e) => updateServiceReminder(itemId, idx, 'intervalUnit', e.target.value)}
                                      className="h-9 px-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                                    >
                                      <option value="months">Mo</option>
                                      <option value="years">Yr</option>
                                    </select>
                                    <button
                                      type="button"
                                      onClick={() => removeServiceReminder(itemId, idx)}
                                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-gray-400 italic">
                                No service reminders added. Click "Add Reminder" to add one.
                              </p>
                            )}

                            {item.serviceReminders && item.serviceReminders.some(r => r.label && r.intervalValue > 0) && (selectedCustomer || newCustomerName) && (
                              <p className="mt-2 text-xs text-green-600">
                                ✓ Reminders will be auto-scheduled
                              </p>
                            )}
                            {item.serviceReminders && item.serviceReminders.some(r => r.label && r.intervalValue > 0) && !selectedCustomer && !newCustomerName && (
                              <p className="mt-2 text-xs text-amber-600">
                                ⚠ Add customer to enable reminders
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Discount */}
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      type="number"
                      placeholder="Discount ₹"
                      value={discountAmount || ''}
                      onChange={(e) => {
                        setDiscountAmount(Number(e.target.value));
                        setDiscountPercent(0);
                      }}
                      startIcon="₹"
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      type="number"
                      placeholder="Discount %"
                      value={discountPercent || ''}
                      onChange={(e) => {
                        setDiscountPercent(Number(e.target.value));
                        setDiscountAmount(0);
                      }}
                      endIcon="%"
                    />
                  </div>
                </div>
                {(discountAmount > 0 || discountPercent > 0) && (
                  <Input
                    placeholder="Discount reason (e.g., Festival offer, Loyal customer)"
                    value={discountDescription}
                    onChange={(e) => setDiscountDescription(e.target.value)}
                  />
                )}
              </div>

              {/* Notes */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <label className="flex items-center gap-1.5 text-sm font-medium text-gray-600 mb-2">
                  <StickyNote className="w-4 h-4" />
                  Notes
                </label>
                <textarea
                  placeholder="Add notes about this sale (optional)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                />
              </div>

              {/* Sale Date */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <label className="flex items-center gap-1.5 text-sm font-medium text-gray-600 mb-2">
                  <Calendar className="w-4 h-4" />
                  Sale Date
                </label>
                <Input
                  type="date"
                  value={saleDate}
                  onChange={(e) => setSaleDate(e.target.value)}
                />
              </div>

              {/* Totals */}
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="tabular-nums">{formatCurrency(subtotal)}</span>
                </div>
                {discountValue > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span className="tabular-nums">-{formatCurrency(discountValue)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span className="tabular-nums">{formatCurrency(total)}</span>
                </div>
              </div>
            </Card>
          </section>
        )}

        {/* Payment Account */}
        {cart.length > 0 && (
          <section>
            <h2 className="text-sm font-medium text-gray-500 mb-2">Payment Account</h2>
            <Select
              options={accounts.map((a) => ({
                value: a.id,
                label: a.name,
              }))}
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
            />
          </section>
        )}
      </div>

      {/* Fixed Bottom Button */}
      {cart.length > 0 && (
        <div className="fixed bottom-20 left-0 right-0 p-4 bg-white border-t border-gray-200 safe-area-bottom">
          <Button
            fullWidth
            loading={submitting}
            onClick={handleSubmit}
            icon={<Check className="w-5 h-5" />}
          >
            Complete Sale • {formatCurrency(total)}
          </Button>
        </div>
      )}

      {/* Customer Modal - Unified Search */}
      <Modal
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        title="Add Customer"
      >
        <div className="space-y-4">
          <Input
            type="search"
            placeholder="Search or enter customer name..."
            value={customerSearch}
            onChange={(e) => {
              setCustomerSearch(e.target.value);
              // Also set as new customer name for seamless creation
              setNewCustomerName(e.target.value);
            }}
            startIcon={<Search className="w-5 h-5" />}
          />

          {/* Existing customers matching search */}
          {customers.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-gray-500">Existing customers</p>
              {customers.map((customer) => (
                <button
                  key={customer.id}
                  onClick={() => selectCustomer(customer)}
                  className="w-full p-3 rounded-xl bg-gray-50 text-left hover:bg-gray-100"
                >
                  <p className="font-medium text-gray-900">{customer.name}</p>
                  <p className="text-sm text-gray-500">
                    {customer.total_purchases} purchases • {formatCurrency(customer.total_spent)} spent
                  </p>
                </button>
              ))}
            </div>
          )}

          {/* Create new customer option */}
          {customerSearch.trim().length >= 2 && (
            <div className="pt-3 border-t border-gray-100">
              <button
                onClick={() => {
                  setNewCustomerName(customerSearch.trim());
                  setSelectedCustomer(null);
                  setShowCustomerModal(false);
                  setCustomerSearch('');
                }}
                className="w-full p-3 rounded-xl bg-green-50 text-left hover:bg-green-100 border border-green-200"
              >
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4 text-green-600" />
                  <p className="font-medium text-green-700">
                    Create new: "{customerSearch.trim()}"
                  </p>
                </div>
              </button>
              {/* Phone and Address input for new customer */}
              <div className="mt-3 space-y-2">
                <Input
                  placeholder="Phone number (optional)"
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                  type="tel"
                />
                <div>
                  <textarea
                    placeholder="Address (optional)"
                    value={newCustomerAddress}
                    onChange={(e) => setNewCustomerAddress(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Empty state */}
          {customerSearch.trim().length < 2 && customers.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">
              Type at least 2 characters to search
            </p>
          )}

          <Button
            variant="ghost"
            fullWidth
            onClick={() => {
              setShowCustomerModal(false);
              setCustomerSearch('');
              setNewCustomerName('');
              setNewCustomerPhone('');
              setNewCustomerAddress('');
            }}
          >
            Skip (Walk-in Customer)
          </Button>
        </div>
      </Modal>

      {/* Add Item Modal */}
      <Modal
        isOpen={showAddItemModal}
        onClose={() => setShowAddItemModal(false)}
        title="Add New Item"
      >
        <InventoryForm
          categories={categories}
          onSuccess={() => {
            setShowAddItemModal(false);
            refreshInventory();
          }}
          isModal
        />
      </Modal>
    </div>
  );
}
