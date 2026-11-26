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
import { Factory } from 'lucide-react';
import { tokens } from '../../config/tokens';

interface FactoryProductionChartProps {
  data: any[];
  lang: string;
}

export default function FactoryProductionChart({ data, lang }: FactoryProductionChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-[280px] flex flex-col items-center justify-center text-text-muted">
        <div className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin mb-2" />
        <span className="text-xs">Loading chart...</span>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-[280px] flex flex-col items-center justify-center text-text-muted text-sm bg-surface rounded border border-border">
        <Factory className="w-8 h-8 text-text-muted mb-2 stroke-[1.75]" />
        <p className="font-medium text-text-secondary">
          {lang === 'hi' ? 'इस चक्र में कोई बैच उत्पादन दर्ज नहीं है' : 'No batch production recorded in this cycle'}
        </p>
        <p className="text-xs text-text-muted mt-0.5">
          {lang === 'hi'
            ? 'दैनिक बैच प्रविष्टि के बाद डेटा यहाँ दिखाई देगा।'
            : 'Production data will appear here once daily batches are logged.'}
        </p>
      </div>
    );
  }

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="2 2"
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
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border)',
              color: 'var(--text-primary)',
              borderRadius: '8px',
              fontSize: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            }}
          />
          {/* Neutral palette: brand blue + slate grey only */}
          <Bar
            dataKey="production"
            name={lang === 'hi' ? 'उत्पादन (नग)' : 'Production (Pcs)'}
            fill={tokens.colors.brand.DEFAULT}
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="dispatch"
            name={lang === 'hi' ? 'डिस्पैच (नग)' : 'Dispatch (Pcs)'}
            fill={tokens.colors.text.muted}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
