'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PlushieEditClient({ initialPlushie }) {
  const [formData, setFormData] = useState({
    ...initialPlushie,
    expiresAt: initialPlushie.expiresAt ? initialPlushie.expiresAt.split('T')[0] : ''
  });
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      expiresAt: formData.expiresAt || null
    };
    const res = await fetch(`/api/plushies/${formData.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) router.push('/admin/plushies');
  };

  const handleDelete = async () => {
    if (!confirm('Delete this plushie?')) return;
    await fetch(`/api/plushies/${formData.id}`, { method: 'DELETE' });
    router.push('/admin/plushies');
  };

  return (
    <div className="p-8 bg-gray-50">
      <h1 className="text-2xl font-bold mb-4 text-gray-800">Edit Plushie</h1>
      <div className="mb-6">
        <img src={formData.imageUrl} alt={formData.name} className="h-48 w-48 object-cover rounded shadow" />
      </div>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow grid grid-cols-2 gap-4">
        <label className="flex flex-col">
          Name
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="mt-1 border p-2 rounded text-gray-800"
            required
          />
        </label>
        <label className="flex flex-col">
          Image URL
          <input
            type="text"
            name="imageUrl"
            value={formData.imageUrl}
            onChange={handleChange}
            className="mt-1 border p-2 rounded text-gray-800"
            required
          />
        </label>
        <label className="flex flex-col">
          Raw Prompt
          <textarea
            name="promptRaw"
            value={formData.promptRaw}
            onChange={handleChange}
            className="mt-1 border p-2 rounded text-gray-800"
            rows={3}
          />
        </label>
        <label className="flex flex-col">
          Sanitized Prompt
          <textarea
            name="promptSanitized"
            value={formData.promptSanitized}
            onChange={handleChange}
            className="mt-1 border p-2 rounded text-gray-800"
            rows={3}
          />
        </label>
        <label className="flex flex-col">
          Texture
          <input
            type="text"
            name="texture"
            value={formData.texture}
            onChange={handleChange}
            className="mt-1 border p-2 rounded text-gray-800"
          />
        </label>
        <label className="flex flex-col">
          Size
          <input
            type="text"
            name="size"
            value={formData.size}
            onChange={handleChange}
            className="mt-1 border p-2 rounded text-gray-800"
          />
        </label>
        <label className="flex flex-col">
          Emotion
          <input
            type="text"
            name="emotion"
            value={formData.emotion}
            onChange={handleChange}
            className="mt-1 border p-2 rounded text-gray-800"
          />
        </label>
        <label className="flex flex-col">
          Color
          <input
            type="text"
            name="color"
            value={formData.color}
            onChange={handleChange}
            className="mt-1 border p-2 rounded text-gray-800"
          />
        </label>
        <label className="flex flex-col">
          Outfit
          <input
            type="text"
            name="outfit"
            value={formData.outfit}
            onChange={handleChange}
            className="mt-1 border p-2 rounded text-gray-800"
          />
        </label>
        <label className="flex flex-col">
          Accessories
          <input
            type="text"
            name="accessories"
            value={formData.accessories}
            onChange={handleChange}
            className="mt-1 border p-2 rounded text-gray-800"
          />
        </label>
        <label className="flex flex-col">
          Pose
          <input
            type="text"
            name="pose"
            value={formData.pose}
            onChange={handleChange}
            className="mt-1 border p-2 rounded text-gray-800"
          />
        </label>
        <label className="flex items-center mt-4">
          <input
            type="checkbox"
            name="isPublished"
            checked={formData.isPublished}
            onChange={handleChange}
            className="form-checkbox"
          />
          <span className="ml-2">Published</span>
        </label>
        <label className="flex flex-col">
          Expires At
          <input
            type="date"
            name="expiresAt"
            value={formData.expiresAt}
            onChange={handleChange}
            className="mt-1 border p-2 rounded text-gray-800"
          />
        </label>
        <label className="flex flex-col">
          Goal
          <input
            type="number"
            name="goal"
            value={formData.goal}
            onChange={handleChange}
            className="mt-1 border p-2 rounded text-gray-800"
          />
        </label>
        <label className="flex flex-col">
          Minimum Goal
          <input
            type="number"
            name="minimumGoal"
            value={formData.minimumGoal}
            onChange={handleChange}
            className="mt-1 border p-2 rounded text-gray-800"
          />
        </label>
        <label className="flex flex-col">
          Status
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="mt-1 border p-2 rounded text-gray-800"
          >
            <option value="PENDING">Pending</option>
            <option value="IN_PRODUCTION">In Production</option>
            <option value="SHIPPED">Shipped</option>
            <option value="CANCELED">Canceled</option>
          </select>
        </label>

        <div className="col-span-2 flex justify-end space-x-4 mt-4">
          <button
            type="button"
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Delete
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
}
