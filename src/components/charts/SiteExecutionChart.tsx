'use client';

import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { HardHat } from 'lucide-react';
import { tokens } from '../../config/tokens';

interface SiteExecutionChartProps {
  data: any[];
  lang: string;
}

export default function SiteExecutionChart({ data, lang }: SiteExecutionChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-[280px] flex flex-col items-center justify-center text-text-muted">
        <div className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin mb-2" />
        <span className="text-xs">Loading execution chart...</span>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-text-muted text-sm">
        <HardHat className="w-8 h-8 text-text-muted mb-2 stroke-[1.75]" />
        <p className="font-semibold text-text-secondary">
          {lang === 'hi' ? 'इस चक्र में कोई साइट कार्य या खर्च दर्ज नहीं है' : 'No site execution or spending recorded in this cycle'}
        </p>
        <p className="text-xs text-text-muted mt-0.5">
          {lang === 'hi'
            ? 'दैनिक M-Book व खरीद प्रविष्टि के बाद चार्ट यहाँ दिखाई देगा।'
            : 'Execution data will appear here once daily MB or purchases are logged.'}
        </p>
      </div>
    );
  }

  const formatCurrency = (val: number) => {
    if (val >= 100000) {
      return `₹${(val / 100000).toFixed(1)}L`;
    }
    if (val >= 1000) {
      return `₹${(val / 1000).toFixed(0)}k`;
    }
    return `₹${val}`;
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 10, left: -5, bottom: 0 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          stroke="var(--border)"
        />
        <XAxis
          dataKey="displayDay"
          tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
          stroke="var(--border)"
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
          stroke="var(--border)"
          tickLine={false}
          tickFormatter={formatCurrency}
        />
        <Tooltip
          formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, '']}
          contentStyle={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border)',
            color: 'var(--text-primary)',
            borderRadius: '8px',
            fontSize: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          }}
        />
        <Bar
          dataKey="measured"
          name={lang === 'hi' ? 'प्रमाणित कार्य (M-Book ₹)' : 'Certified Work (M-Book ₹)'}
          fill={tokens.colors.brand.DEFAULT}
          radius={[4, 4, 0, 0]}
        />
        <Bar
          dataKey="spending"
          name={lang === 'hi' ? 'वास्तविक खर्च (₹)' : 'Site Spending (₹)'}
          fill={tokens.colors.text.muted}
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
