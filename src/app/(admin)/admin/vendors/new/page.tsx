'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout';
import { Card, CardContent, Input, Button, useToast } from '@/components/ui';
import { createVendorSchema } from '@/lib/utils/validators';
import { Store, User, Phone, Key, Building2 } from 'lucide-react';

export default function NewVendorPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    pin: '',
    name: '',
    businessName: '',
    phone: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate form
    const validation = createVendorSchema.safeParse(formData);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        toast('error', data.error || 'Failed to create vendor');
        return;
      }

      toast('success', 'Vendor created successfully');
      router.push('/admin/vendors');
    } catch (error) {
      console.error('Error creating vendor:', error);
      toast('error', 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <PageHeader title="Add New Vendor" backHref="/admin/vendors" />

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardContent className="pt-4 space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-brand-100 rounded-lg">
                <Store className="h-5 w-5 text-brand-600" />
              </div>
              <div>
                <h2 className="font-medium text-gray-900">Vendor Details</h2>
                <p className="text-sm text-gray-500">Create a new vendor account</p>
              </div>
            </div>

            <Input
              label="Username"
              placeholder="e.g., john_store"
              value={formData.username}
              onChange={(e) => handleChange('username', e.target.value.toLowerCase())}
              error={errors.username}
              helperText="Lowercase letters, numbers, and underscores only"
              startIcon={<User className="h-5 w-5" />}
            />

            <Input
              label="5-Digit PIN"
              placeholder="e.g., 12345"
              type="password"
              maxLength={5}
              value={formData.pin}
              onChange={(e) => handleChange('pin', e.target.value.replace(/\D/g, ''))}
              error={errors.pin}
              helperText="This will be used for login"
              startIcon={<Key className="h-5 w-5" />}
            />

            <Input
              label="Vendor Name"
              placeholder="e.g., John Doe"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              error={errors.name}
              startIcon={<User className="h-5 w-5" />}
            />

            <Input
              label="Business Name"
              placeholder="e.g., John's Electronics"
              value={formData.businessName}
              onChange={(e) => handleChange('businessName', e.target.value)}
              error={errors.businessName}
              startIcon={<Building2 className="h-5 w-5" />}
            />

            <Input
              label="Phone Number (Optional)"
              placeholder="e.g., 9876543210"
              type="tel"
              maxLength={10}
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value.replace(/\D/g, ''))}
              error={errors.phone}
              startIcon={<Phone className="h-5 w-5" />}
            />
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-100">
          <CardContent className="pt-4">
            <h3 className="text-sm font-medium text-blue-900 mb-2">
              What happens when you create a vendor?
            </h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Default accounts (Cash, UPI, Bank) are created</li>
              <li>• Default expense categories are set up</li>
              <li>• Bill sequence is initialized</li>
              <li>• Vendor can log in immediately</li>
              <li>• Business logo can be added after creation</li>
            </ul>
          </CardContent>
        </Card>

        <Button type="submit" fullWidth loading={loading}>
          Create Vendor
        </Button>
      </form>
    </div>
  );
}
