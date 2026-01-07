'use client';

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface ChartData {
  month: string;
  year: string;
  count: number;
}

interface MaintenanceChartProps {
  data: ChartData[];
}

export function MaintenanceChart({ data }: MaintenanceChartProps) {
  const totalCount = data.reduce((sum, d) => sum + d.count, 0);

  if (totalCount === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-gray-400">
        No maintenance data available
      </div>
    );
  }

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#6B7280' }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#6B7280' }}
            allowDecimals={false}
          />
          <Tooltip
            formatter={(value) => [`${value} services`, 'Completed']}
            labelFormatter={(label, payload) => {
              if (payload && payload[0]) {
                const item = payload[0].payload as ChartData;
                return `${label} ${item.year}`;
              }
              return label;
            }}
            labelStyle={{ color: '#1F2937' }}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
            }}
          />
          <Bar
            dataKey="count"
            name="Services"
            fill="#8B5CF6"
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
