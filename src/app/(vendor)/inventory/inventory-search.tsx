'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input, Select } from '@/components/ui';
import { Search } from 'lucide-react';
import type { InventoryCategory } from '@/types';

interface InventorySearchProps {
  categories: InventoryCategory[];
}

export function InventorySearch({ categories }: InventorySearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const [category, setCategory] = useState(searchParams.get('category') ?? '');

  // Debounce search
  useEffect(() => {
    const timeout = setTimeout(() => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (category) params.set('category', category);
      router.push(`/inventory?${params.toString()}`);
    }, 300);

    return () => clearTimeout(timeout);
  }, [search, category, router]);

  const categoryOptions = [
    { value: '', label: 'All Categories' },
    ...categories.map((c) => ({ value: c.id, label: c.name })),
  ];

  return (
    <div className="flex gap-2">
      <div className="flex-1">
        <Input
          type="search"
          placeholder="Search items..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          prefix={<Search className="w-5 h-5" />}
        />
      </div>
      <div className="w-40">
        <Select
          options={categoryOptions}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
      </div>
    </div>
  );
}
