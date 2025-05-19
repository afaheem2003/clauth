'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const ITEMS_PER_PAGE = 10;

export default function ReadyForProdClient({ initialClothingItems }) {
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

  const handleAction = async (itemId, actionType) => {
    setLoading(itemId);
    setError(null);
    let confirmMessage, apiEndpoint, successMessage, errorMessage;

    if (actionType === 'approve') {
      confirmMessage = 'Approve this clothing item for production?';
      apiEndpoint = '/api/clothing/approve';
      successMessage = 'Clothing item approved for production.';
      errorMessage = 'Error approving clothing item.';
    } else if (actionType === 'cancel') {
      confirmMessage = 'Cancel preorders for this clothing item?';
      apiEndpoint = '/api/clothing/cancel';
      successMessage = 'Preorders cancelled for clothing item.';
      errorMessage = 'Error cancelling clothing item.';
    } else {
      return;
    }

    if (!confirm(confirmMessage)) {
      setLoading(null);
      return;
    }

    try {
      const res = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clothingItemId: itemId }),
      });
      if (res.ok) {
        setItems(prevItems => prevItems.filter(item => item.id !== itemId));
        alert(successMessage);
      } else {
        const errData = await res.json().catch(() => ({}));
        setError(errData.error || errorMessage);
        alert(errData.error || errorMessage);
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
      <h1 className="text-3xl font-bold mb-6 text-gray-800">
        Clothing Items Ready&nbsp;for&nbsp;Production
      </h1>
      {error && <p className="text-red-500 bg-red-100 p-3 rounded mb-4">{error}</p>}

      {groupNames.length === 0 && (
        <p className="text-gray-600">No clothing items have reached their goal yet.</p>
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
                    <p className="text-gray-700 text-sm">
                      {p.pledged}/{p.minimumGoal} pre-orders
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleAction(p.id, 'approve')}
                    className="px-4 py-2 bg-green-700 text-white rounded hover:bg-green-800 text-sm"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleAction(p.id, 'cancel')}
                    className="px-4 py-2 bg-red-700 text-white rounded hover:bg-red-800 text-sm"
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
