
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const PAGE_SIZE = 10;

export default function PreordersAdminClient({ initialOrders }) {
  const [orders, setOrders] = useState(initialOrders);
  const [page, setPage] = useState(0);

  const handleDelete = async (id) => {
    if (!confirm('Cancel this preorder?')) return;
    const res = await fetch(`/api/preorders/${id}`, { method: 'DELETE' });
    if (res.ok) setOrders(prev => prev.filter(o => o.id !== id));
    else alert('Failed to cancel preorder.');
  };

  const handleRefund = async (id) => {
    if (!confirm('Issue a refund for this preorder?')) return;
    const res = await fetch(`/api/preorders/${id}/refund`, { method: 'POST' });
    if (res.ok) {
      const updated = await res.json();
      alert('Refund issued successfully.');
      setOrders(prev => prev.map(o => (o.id === id ? updated : o)));
    } else {
      alert('Refund failed.');
    }
  };

  const groupedByPlushie = orders.reduce((acc, order) => {
    const key = order.plushie.id;
    if (!acc[key]) acc[key] = { plushie: order.plushie, orders: [] };
    acc[key].orders.push(order);
    return acc;
  }, {});

  const plushieKeys = Object.keys(groupedByPlushie);
  const totalPages = Math.ceil(plushieKeys.length / PAGE_SIZE);
  const paginatedKeys = plushieKeys.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="p-8 bg-gray-50">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Manage Pre-orders</h1>

      {paginatedKeys.map((key) => {
        const { plushie, orders } = groupedByPlushie[key];
        return (
          <div key={key} className="mb-10 border rounded bg-white shadow-md">
            <div className="flex items-center gap-4 p-4 border-b">
              <Image src={plushie.imageUrl} alt={plushie.name} width={64} height={64} className="rounded" />
              <div>
                <h2 className="text-xl font-semibold">{plushie.name}</h2>
                <p className="text-gray-500 italic">{orders.length} orders</p>
              </div>
            </div>

            <ul className="divide-y">
              {orders.map((o) => (
                <li key={o.id} className="flex justify-between items-center px-4 py-2">
                  <div>
                    <p className="text-gray-800">
                      <strong>{o.user?.email || o.guestEmail || "Unknown"}</strong> &rarr; {o.quantity}x <span className="text-sm text-gray-600">Status: {o.status}</span>
                    </p>
                  </div>
                  <div className="flex space-x-4">
                    <Link
                      href={`/admin/preorders/${o.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      Details
                    </Link>
                    <button
                      onClick={() => handleDelete(o.id)}
                      className="text-red-600 hover:underline"
                    >
                      Cancel
                    </button>
                    {o.status === 'COLLECTED' && (
                      <button
                        onClick={() => handleRefund(o.id)}
                        className="text-yellow-600 hover:underline"
                      >
                        Refund
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        );
      })}

      {totalPages > 1 && (
        <div className="flex justify-center gap-4 mt-6">
          <button
            onClick={() => setPage(prev => Math.max(0, prev - 1))}
            disabled={page === 0}
            className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span className="self-center">Page {page + 1} of {totalPages}</span>
          <button
            onClick={() => setPage(prev => Math.min(totalPages - 1, prev + 1))}
            disabled={page === totalPages - 1}
            className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
