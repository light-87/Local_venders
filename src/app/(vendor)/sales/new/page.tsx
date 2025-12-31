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
import { formatCurrency, formatQuantity } from '@/lib/utils/format';
import {
  Search,
  Plus,
  Minus,
  X,
  ShoppingCart,
  User,
  Check,
} from 'lucide-react';
import type { InventoryItem, Account, Customer, CartItem } from '@/types';

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

  // Cart states
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountPercent, setDiscountPercent] = useState(0);

  // Load initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [invRes, accRes] = await Promise.all([
          fetch('/api/inventory'),
          fetch('/api/accounts'),
        ]);

        const invData = await invRes.json();
        const accData = await accRes.json();

        if (invData.success) setInventory(invData.items);
        if (accData.success) {
          setAccounts(accData.accounts);
          // Set default account
          const defaultAcc = accData.accounts.find((a: Account) => a.is_default);
          if (defaultAcc) setSelectedAccountId(defaultAcc.id);
        }
      } catch {
        error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [error]);

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
  };

  // Select customer
  const selectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowCustomerModal(false);
    setCustomerSearch('');
    setNewCustomerName('');
    setNewCustomerPhone('');
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
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedCustomer?.id,
          customerName: !selectedCustomer && newCustomerName ? newCustomerName : undefined,
          customerPhone: !selectedCustomer && newCustomerPhone ? newCustomerPhone : undefined,
          accountId: selectedAccountId,
          items: cart.map((item) => ({
            inventoryItemId: item.inventoryItemId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
          discountAmount: discountPercent > 0 ? 0 : discountAmount,
          discountPercent: discountPercent > 0 ? discountPercent : 0,
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
                  </div>
                </div>
                <button
                  onClick={() => {
                    setNewCustomerName('');
                    setNewCustomerPhone('');
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
          <h2 className="text-sm font-medium text-gray-500 mb-2">Add Items</h2>
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
              const isOutOfStock = item.current_stock <= 0;

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
                      {formatQuantity(item.current_stock, item.unit)}
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

        {/* Cart */}
        {cart.length > 0 && (
          <section>
            <h2 className="text-sm font-medium text-gray-500 mb-2">
              Cart ({cart.length} items)
            </h2>
            <Card>
              <div className="space-y-3">
                {cart.map((item) => (
                  <div
                    key={item.inventoryItemId}
                    className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{item.name}</p>
                      <p className="text-sm text-gray-500">
                        {formatCurrency(item.unitPrice)} × {item.quantity}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.inventoryItemId, item.quantity - 1)}
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
                            updateQuantity(item.inventoryItemId, Math.min(val, item.availableStock));
                          }
                        }}
                        className="w-14 h-8 text-center font-medium bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                      />
                      <button
                        onClick={() => updateQuantity(item.inventoryItemId, item.quantity + 1)}
                        className="p-2 rounded-full bg-gray-100"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => removeFromCart(item.inventoryItemId)}
                        className="p-2 rounded-full text-red-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Discount */}
              <div className="mt-4 pt-4 border-t border-gray-100">
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

      {/* Customer Modal */}
      <Modal
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        title="Select Customer"
      >
        <div className="space-y-4">
          <Input
            type="search"
            placeholder="Search by name..."
            value={customerSearch}
            onChange={(e) => setCustomerSearch(e.target.value)}
            startIcon={<Search className="w-5 h-5" />}
          />

          {customers.length > 0 && (
            <div className="space-y-2">
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

          <div className="pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500 mb-2">Or create a new customer</p>
            <div className="space-y-3">
              <Input
                placeholder="Enter customer name"
                value={newCustomerName}
                onChange={(e) => setNewCustomerName(e.target.value)}
              />
              <Input
                placeholder="Phone number (optional)"
                value={newCustomerPhone}
                onChange={(e) => setNewCustomerPhone(e.target.value)}
                type="tel"
              />
            </div>
            <Button
              fullWidth
              className="mt-3"
              disabled={!newCustomerName.trim()}
              onClick={() => {
                setSelectedCustomer(null);
                setShowCustomerModal(false);
                setCustomerSearch('');
              }}
            >
              Use "{newCustomerName || 'New Customer'}"
            </Button>
          </div>

          <Button
            variant="ghost"
            fullWidth
            onClick={() => {
              setShowCustomerModal(false);
              setCustomerSearch('');
              setNewCustomerName('');
              setNewCustomerPhone('');
            }}
          >
            Skip (Walk-in Customer)
          </Button>
        </div>
      </Modal>
    </div>
  );
}
