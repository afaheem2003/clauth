// app/admin/TrendLineChart.js
'use client';
import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function TrendLineChart({ data, title }) {
  return (
    <div className="bg-white p-6 rounded shadow">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">{title}</h2>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
          <XAxis dataKey="date" tick={{ fill: '#1f2937' }} />
          <YAxis tick={{ fill: '#1f2937' }} />
          <Tooltip />
          <Line type="monotone" dataKey="count" stroke="#4f46e5" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}