'use client';
import React, { useState } from 'react';
import Link from 'next/link';

export default function ClothingAdminClient({ initialClothingItems }) {
  const [clothingItems, setClothingItems] = useState(initialClothingItems);

  const handleDelete = async (id) => {
    if (!confirm('Delete this clothing item?')) return;
    const res = await fetch(`/api/clothing/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setClothingItems(clothingItems.filter(item => item.id !== id));
    }
  };

  return (
    <div className="p-8 bg-gray-50">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Manage Clothing Items</h1>
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
          {clothingItems.map(item => (
            <tr key={item.id} className="border-t hover:bg-gray-50">
              <td className="p-3">
                <img src={item.imageUrl} alt={item.name} className="h-12 w-12 object-cover rounded" />
              </td>
              <td className="p-3 text-gray-800">{item.name}</td>
              <td className="p-3 text-gray-800">{item.isPublished ? 'Yes' : 'No'}</td>
              <td className="p-3 text-gray-800">{item.status}</td>
              <td className="p-3 flex space-x-4">
                <Link href={`/admin/clothing/${item.id}`} className="text-blue-600 hover:underline">Edit</Link>
                <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:underline">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}