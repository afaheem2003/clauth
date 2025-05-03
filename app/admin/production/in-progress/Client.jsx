'use client';

import { useState } from 'react';
import Image        from 'next/image';

export default function InProductionClient({ initialPlushies }) {
  const [items, setItems] = useState(initialPlushies);

  async function finish(id, action) {
    const verb = action === 'SHIPPED' ? 'mark as shipped' : 'cancel';
    if (!confirm(`Really ${verb} this plushie?`)) return;

    const res = await fetch('/api/plushies/status', {
      method : 'POST',
      headers: { 'Content-Type':'application/json' },
      body   : JSON.stringify({ id, status: action }),
    });
    if (res.ok) setItems(prev => prev.filter(p => p.id !== id));
    else        alert('Operation failed.');
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">
        Plushies&nbsp;Currently&nbsp;in&nbsp;Production
      </h1>

      {items.length === 0 && (
        <p className="text-gray-600">Nothing is in production right now.</p>
      )}

      <ul className="space-y-4">
        {items.map(p => (
          <li key={p.id} className="p-4 bg-white rounded shadow flex items-center justify-between">
            {/* image + info */}
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
                  {p.pledged} backers
                </p>
              </div>
            </div>

            {/* actions */}
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
  );
}
