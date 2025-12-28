'use client';

interface PeriodSelectorProps {
  value: 'today' | 'week' | 'month';
  onChange: (period: 'today' | 'week' | 'month') => void;
}

const periods = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
] as const;

export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  return (
    <div className="flex bg-gray-100 rounded-xl p-1">
      {periods.map((period) => (
        <button
          key={period.value}
          onClick={() => onChange(period.value)}
          className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
            value === period.value
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {period.label}
        </button>
      ))}
    </div>
  );
}
