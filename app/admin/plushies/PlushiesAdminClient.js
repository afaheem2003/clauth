'use client';
import React, { useState } from 'react';
import Link from 'next/link';

export default function PlushiesAdminClient({ initialPlushies }) {
  const [plushies, setPlushies] = useState(initialPlushies);

  const handleDelete = async (id) => {
    if (!confirm('Delete this plushie?')) return;
    const res = await fetch(`/api/plushies/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setPlushies(plushies.filter(p => p.id !== id));
    }
  };

  return (
    <div className="p-8 bg-gray-50">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Manage Plushies</h1>
      <table className="w-full bg-white rounded shadow">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-3 text-left font-medium text-gray-700">Image</th>
            <th className="p-3 text-left font-medium text-gray-700">Name</th>
            <th className="p-3 text-left font-medium text-gray-700">Published</th>
            <th className="p-3 text-left font-medium text-gray-700">Status</th>
            <th className="p-3 text-left font-medium text-gray-700">Actions</th>
          </tr>
        </thead>
        <tbody>
          {plushies.map(p => (
            <tr key={p.id} className="border-t hover:bg-gray-50">
              <td className="p-3">
                <img src={p.imageUrl} alt={p.name} className="h-12 w-12 object-cover rounded" />
              </td>
              <td className="p-3 text-gray-800">{p.name}</td>
              <td className="p-3 text-gray-800">{p.isPublished ? 'Yes' : 'No'}</td>
              <td className="p-3 text-gray-800">{p.status}</td>
              <td className="p-3 flex space-x-4">
                <Link href={`/admin/plushies/${p.id}`} className="text-blue-600 hover:underline">Edit</Link>
                <button onClick={() => handleDelete(p.id)} className="text-red-600 hover:underline">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}