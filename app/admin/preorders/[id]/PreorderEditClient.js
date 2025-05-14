
'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PreorderEditClient({ order }) {
  const [status, setStatus] = useState(order.status);
  const [plushieStatus, setPlushieStatus] = useState(order.plushie.status);
  const router = useRouter();

  const update = async (fields) => {
    const res = await fetch(`/api/preorders/${order.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
    });
    if (res.ok) router.push('/admin/preorders');
  };

  const handleSave = () => update({ status });
  const handleApproveProduction = () => update({ plushieStatus: 'IN_PRODUCTION' });

  return (
    <div className="p-8 bg-gray-50">
      <h1 className="text-2xl font-bold mb-4 text-gray-800">Pre-order Detail</h1>
      <div className="bg-white p-6 rounded shadow grid grid-cols-2 gap-6">
        <div>
          <p><strong>User:</strong> {order.user?.email || order.guestEmail || "Unknown"}</p>
          <p><strong>Quantity:</strong> {order.quantity}</p>
          <p><strong>Price:</strong> ${order.price.toFixed(2)}</p>
          <label className="block mt-4">
            <span>Status</span>
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="mt-1 block w-full border p-2 rounded text-gray-800"
            >
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="CANCELED">Canceled</option>
              <option value="REFUNDED">Refunded</option>
            </select>
          </label>
          <button
            onClick={handleSave}
            className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Save
          </button>
        </div>
        <div>
          <p><strong>Plushie:</strong> {order.plushie.name}</p>
          <img
            src={order.plushie.imageUrl}
            alt={order.plushie.name}
            className="h-48 w-48 object-cover rounded shadow mt-2"
          />
          <p className="mt-4"><strong>Current Production Status:</strong> {order.plushie.status}</p>
          {order.plushie.pledged >= order.plushie.minimumGoal && (
            <button
              onClick={handleApproveProduction}
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Approve for Production
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
