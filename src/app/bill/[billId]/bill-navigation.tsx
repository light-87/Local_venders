'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Home } from 'lucide-react';

export function BillNavigation() {
  const router = useRouter();

  return (
    <div className="sticky top-0 z-30 bg-surface-primary/95 backdrop-blur-sm border-b border-gray-100">
      <div className="max-w-md mx-auto flex items-center justify-between px-4 h-14">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-600"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back</span>
        </button>
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 p-2 -mr-2 rounded-full hover:bg-gray-100 text-gray-600"
        >
          <Home className="w-5 h-5" />
          <span className="text-sm font-medium">Home</span>
        </button>
      </div>
    </div>
  );
}
