'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function WardrobeClient({ wardrobe, availableItems, isOwner }) {
  const [items, setItems] = useState(wardrobe.items);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [itemNotes, setItemNotes] = useState('');

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!selectedItemId) return;

    try {
      const response = await fetch(`/api/wardrobes/${wardrobe.id}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clothingItemId: selectedItemId,
          notes: itemNotes,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add item to wardrobe');
      }

      const { wardrobeItem } = await response.json();
      setItems([...items, wardrobeItem]);
      setIsAdding(false);
      setSelectedItemId('');
      setItemNotes('');
    } catch (error) {
      console.error('Error adding item to wardrobe:', error);
      alert('Failed to add item to wardrobe. Please try again.');
    }
  };

  const handleRemoveItem = async (clothingItemId) => {
    try {
      const response = await fetch(
        `/api/wardrobes/${wardrobe.id}/items?clothingItemId=${clothingItemId}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to remove item from wardrobe');
      }

      setItems(items.filter((item) => item.clothingItemId !== clothingItemId));
    } catch (error) {
      console.error('Error removing item from wardrobe:', error);
      alert('Failed to remove item from wardrobe. Please try again.');
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Link
            href="/wardrobes"
            className="text-gray-600 hover:text-gray-900"
          >
            ← Back to Wardrobes
          </Link>
          {wardrobe.isPublic && (
            <span className="px-2 py-1 bg-gray-100 rounded-full text-sm">
              Public
            </span>
          )}
        </div>
        <h1 className="text-3xl font-bold mb-2">{wardrobe.name}</h1>
        {wardrobe.description && (
          <p className="text-gray-600 mb-4">{wardrobe.description}</p>
        )}
        <div className="flex flex-wrap gap-2">
          {wardrobe.style && (
            <span className="px-2 py-1 bg-gray-100 rounded-full text-sm">
              Style: {wardrobe.style}
            </span>
          )}
          {wardrobe.season && (
            <span className="px-2 py-1 bg-gray-100 rounded-full text-sm">
              Season: {wardrobe.season}
            </span>
          )}
          {wardrobe.occasion && (
            <span className="px-2 py-1 bg-gray-100 rounded-full text-sm">
              Occasion: {wardrobe.occasion}
            </span>
          )}
        </div>
      </div>

      {isOwner && (
        <div className="mb-8">
          <button
            onClick={() => setIsAdding(true)}
            className="bg-black text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-gray-800 transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
            Add Item
          </button>
        </div>
      )}

      {isAdding && (
        <div className="mb-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Add Item to Wardrobe</h2>
          <form onSubmit={handleAddItem} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Select Item
              </label>
              <select
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black"
                required
              >
                <option value="">Select an item...</option>
                {availableItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Notes
              </label>
              <textarea
                value={itemNotes}
                onChange={(e) => setItemNotes(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black"
                rows={3}
                placeholder="Add any notes about how this item fits in the wardrobe..."
              />
            </div>
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
              >
                Add Item
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-lg shadow overflow-hidden group relative"
          >
            {isOwner && (
              <button
                onClick={() => handleRemoveItem(item.clothingItemId)}
                className="absolute top-2 right-2 p-1 bg-white rounded-full shadow hover:bg-gray-100 z-10"
              >
                <XMarkIcon className="h-5 w-5 text-gray-600" />
              </button>
            )}
            <Link href={`/clothing/${item.clothingItemId}`}>
              <div className="aspect-square relative">
                <Image
                  src={item.clothingItem.frontImage || item.clothingItem.imageUrl}
                  alt={item.clothingItem.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-4">
                <h3 className="font-semibold mb-1">{item.clothingItem.name}</h3>
                {item.notes && (
                  <p className="text-sm text-gray-600">{item.notes}</p>
                )}
                <div className="mt-2 flex flex-wrap gap-2">
                  {item.clothingItem.style && (
                    <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                      {item.clothingItem.style}
                    </span>
                  )}
                  {item.clothingItem.color && (
                    <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                      {item.clothingItem.color}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
} 