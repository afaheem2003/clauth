'use client';

import { useState } from 'react';
import Image        from 'next/image';

export default function ReadyForProdClient({ initialPlushies }) {
  const [items, setItems] = useState(initialPlushies);

  async function approve(id) {
    if (!confirm('Approve this plushie for production?')) return;
    const res = await fetch('/api/plushies/approve', {
      method : 'POST',
      headers: { 'Content-Type':'application/json' },
      body   : JSON.stringify({ id })
    });
    if (res.ok) setItems(prev => prev.filter(p => p.id !== id));
    else        alert('Error approving plushie.');
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">
        Plushies Ready&nbsp;for&nbsp;Production
      </h1>

      {items.length === 0 && (
        <p className="text-gray-600">No plushies have reached their goal yet.</p>
      )}

      <ul className="space-y-4">
        {items.map(p => (
          <li key={p.id} className="p-4 bg-white rounded shadow flex items-center justify-between">
            {/* IMAGE + INFO */}
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

            {/* APPROVE BUTTON */}
            <button
              onClick={() => approve(p.id)}
              className="px-4 py-2 bg-green-700 text-white rounded hover:bg-green-800"
            >
              Approve
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
