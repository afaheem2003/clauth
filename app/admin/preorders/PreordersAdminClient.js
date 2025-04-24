'use client';
import React, { useState } from 'react';
import Link from 'next/link';

export default function PreordersAdminClient({ initialOrders }) {
  const [orders, setOrders] = useState(initialOrders);

  const handleDelete = async (id) => {
    if (!confirm('Cancel this preorder?')) return;
    const res = await fetch(`/api/preorders/${id}`, { method: 'DELETE' });
    if (res.ok) setOrders(prev => prev.filter(o => o.id !== id));
  };

  return (
    <div className="p-8 bg-gray-50">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Manage Pre-orders</h1>
      <ul className="space-y-4">
        {orders.map(o => (
          <li key={o.id} className="p-4 bg-white rounded shadow flex justify-between items-center">
            <div>
              <p className="font-medium text-gray-800">
                <strong>{o.user.email}</strong> &rarr; <em>{o.plushie.name}</em>
              </p>
              <p className="text-gray-700">Status: {o.status}</p>
            </div>
            <div className="flex space-x-4">
              <Link
                href={`/admin/preorders/${o.id}`}
                className="text-blue-600 hover:underline"
              >
                Details
              </Link>
              <button onClick={() => handleDelete(o.id)} className="text-red-600 hover:underline">
                Cancel
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}