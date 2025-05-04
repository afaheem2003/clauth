'use client';

import { useState } from 'react';
import Image from 'next/image';

const ITEMS_PER_PAGE = 10;

export default function InProductionClient({ initialPlushies }) {
  const [items, setItems] = useState(initialPlushies);
  const [page, setPage] = useState(0);

  const grouped = items.reduce((acc, p) => {
    if (!acc[p.name]) acc[p.name] = [];
    acc[p.name].push(p);
    return acc;
  }, {});

  const groupNames = Object.keys(grouped);
  const pagedGroupNames = groupNames.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);

  async function finish(id, action) {
    if (action === 'CANCELED') {
      const confirmation = prompt(
        '⚠️ This will cancel production and may result in lost data.\n\nType "cancel" to confirm:'
      );
      if (confirmation?.toLowerCase() !== 'cancel') {
        alert('Cancellation aborted.');
        return;
      }
    } else if (!confirm('Mark this plushie as shipped?')) {
      return;
    }

    const res = await fetch('/api/plushies/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: action }),
    });

    if (res.ok) {
      setItems(prev => prev.filter(p => p.id !== id));
    } else {
      alert('Operation failed.');
    }
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">
        Plushies&nbsp;Currently&nbsp;in&nbsp;Production
      </h1>

      {groupNames.length === 0 && (
        <p className="text-gray-600">Nothing is in production right now.</p>
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
                    onClick={() => finish(p.id, 'SHIPPED')}
                    className="px-3 py-2 bg-green-700 text-white rounded hover:bg-green-800 text-sm"
                  >
                    Mark Shipped
                  </button>
                  <button
                    onClick={() => finish(p.id, 'CANCELED')}
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
