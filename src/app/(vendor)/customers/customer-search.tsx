'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui';
import { Search } from 'lucide-react';

export function CustomerSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') ?? '');

  useEffect(() => {
    const timeout = setTimeout(() => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      router.push(`/customers?${params.toString()}`);
    }, 300);

    return () => clearTimeout(timeout);
  }, [search, router]);

  return (
    <Input
      type="search"
      placeholder="Search customers..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      startIcon={<Search className="w-5 h-5" />}
    />
  );
}
