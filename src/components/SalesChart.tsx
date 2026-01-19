"use client";

import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Jan', uv: 100 },
  { name: 'Feb', uv: 200 },
  { name: 'Mar', uv: 150 },
  { name: 'Apr', uv: 300 },
  { name: 'May', uv: 250 },
  { name: 'Jun', uv: 380 },
  { name: 'Jul', uv: 320 },
  { name: 'Aug', uv: 450 },
  { name: 'Sep', uv: 400 },
];

const SalesChart = () => {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorUvDark" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid #1e293b', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
            itemStyle={{ color: '#e2e8f0' }}
          />
          <Area type="monotone" dataKey="uv" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorUvDark)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SalesChart;