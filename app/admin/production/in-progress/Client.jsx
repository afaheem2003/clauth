'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const ITEMS_PER_PAGE = 10;

export default function InProductionClient({ initialClothingItems }) {
  const [items, setItems] = useState(initialClothingItems);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState(null);

  const grouped = items.reduce((acc, p) => {
    if (!acc[p.name]) acc[p.name] = [];
    acc[p.name].push(p);
    return acc;
  }, {});

  const groupNames = Object.keys(grouped);
  const pagedGroupNames = groupNames.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);

  const updateStatus = async (itemId, newStatus) => {
    setLoading(itemId);
    setError(null);

    let confirmMessage;
    if (newStatus === 'SHIPPED') {
      confirmMessage = 'Mark this clothing item as shipped?';
    } else if (newStatus === 'DELIVERED') {
      confirmMessage = 'Mark this clothing item as delivered?';
    } else if (newStatus === 'STALLED') {
        confirmMessage = 'Mark this clothing item as stalled?';
    } else if (!confirm('Mark this clothing item as shipped?')) { // Fallback, should ideally be more specific if other statuses are handled differently
      setLoading(null);
      return;
    }
    if (confirmMessage && !confirm(confirmMessage)) {
        setLoading(null);
        return;
    }

    try {
      const res = await fetch('/api/clothing/status', { // Corrected API endpoint
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clothingItemId: itemId, status: newStatus }), // Corrected body key
      });

      if (res.ok) {
        setItems(prevItems =>
          prevItems.map(item => (item.id === itemId ? { ...item, status: newStatus } : item))
        );
        alert(`Clothing item status updated to ${newStatus}.`);
      } else {
        const errData = await res.json().catch(() => ({}));
        setError(errData.error || 'Error updating status.');
        alert(errData.error || 'Error updating status.');
      }
    } catch (e) {
      console.error(e);
      setError('An unexpected error occurred.');
      alert('An unexpected error occurred.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Clothing Items&nbsp;Currently&nbsp;in&nbsp;Production</h1>
      {error && <p className="text-red-500 bg-red-100 p-3 rounded mb-4">{error}</p>}

      {groupNames.length === 0 && (
        <p className="text-gray-600">No clothing items are currently in production.</p>
      )}

      {pagedGroupNames.map(name => (
        <div key={name} className="mb-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">{name}</h2>
          <ul className="space-y-3">
            {grouped[name].map(p => (
              <li
                key={p.id}
                className="p-4 bg-white rounded shadow flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <Image
                    src={p.imageUrl}
                    alt={p.name}
                    width={64}
                    height={64}
                    className="rounded object-cover"
                  />
                  <div>
                    <p className="font-semibold text-gray-800">{p.name}</p>
                    <p className="text-gray-600 text-sm italic">
                      by {p.creator?.displayName || p.creator?.email}
                    </p>
                    <p className="text-gray-700 text-sm">{p.pledged} backers</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => updateStatus(p.id, 'SHIPPED')}
                    className="px-3 py-2 bg-green-700 text-white rounded hover:bg-green-800 text-sm"
                  >
                    Mark Shipped
                  </button>
                  <button
                    onClick={() => updateStatus(p.id, 'CANCELED')}
                    className="px-3 py-2 bg-red-700 text-white rounded hover:bg-red-800 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}

      {groupNames.length > ITEMS_PER_PAGE && (
        <div className="mt-6 flex justify-center gap-4">
          <button
            disabled={page === 0}
            onClick={() => setPage(p => p - 1)}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            Previous
          </button>
          <button
            disabled={(page + 1) * ITEMS_PER_PAGE >= groupNames.length}
            onClick={() => setPage(p => p + 1)}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
