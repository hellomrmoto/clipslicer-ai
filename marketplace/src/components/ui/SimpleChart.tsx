'use client'

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface BaseChartProps {
  data: Record<string, string | number>[]
  xKey: string
  valueKey: string
  height?: number
  color?: string
  label?: string
}

export function AreaChartWidget({
  data,
  xKey,
  valueKey,
  height = 180,
  color = '#ea580c',
  label = 'tokens',
}: BaseChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id={`grad-${valueKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.25} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
        <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: 12 }}
          formatter={(val) => [`${val ?? 0} ${label}`, '']}
        />
        <Area
          type="monotone"
          dataKey={valueKey}
          stroke={color}
          strokeWidth={2}
          fill={`url(#grad-${valueKey})`}
          dot={false}
          activeDot={{ r: 4, fill: color }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function BarChartWidget({
  data,
  xKey,
  valueKey,
  height = 180,
  color = '#fb923c',
  label = 'orders',
}: BaseChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
        <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip
          contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: 12 }}
          formatter={(val) => [`${val ?? 0} ${label}`, '']}
        />
        <Bar dataKey={valueKey} fill={color} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function LineChartWidget({
  data,
  xKey,
  valueKey,
  height = 180,
  color = '#f97316',
  label = 'users',
}: BaseChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
        <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip
          contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: 12 }}
          formatter={(val) => [`${val ?? 0} ${label}`, '']}
        />
        <Line
          type="monotone"
          dataKey={valueKey}
          stroke={color}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: color }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
