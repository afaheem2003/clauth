'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function WardrobesClient({ initialWardrobes }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [wardrobes, setWardrobes] = useState(initialWardrobes);
  const [isAddingToWardrobe, setIsAddingToWardrobe] = useState(false);
  const [selectedWardrobe, setSelectedWardrobe] = useState('');
  const [itemNotes, setItemNotes] = useState('');

  // Check for addItem query parameter
  useEffect(() => {
    const itemId = searchParams.get('addItem');
    if (itemId) {
      setIsAddingToWardrobe(true);
    }
  }, [searchParams]);

  const handleAddToWardrobe = async (e) => {
    e.preventDefault();
    const itemId = searchParams.get('addItem');
    if (!itemId || !selectedWardrobe) return;

    try {
      const response = await fetch(`/api/wardrobes/${selectedWardrobe}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clothingItemId: itemId,
          notes: itemNotes,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add item to wardrobe');
      }

      const { wardrobeItem } = await response.json();
      setWardrobes(wardrobes.map(w => {
        if (w.id === selectedWardrobe) {
          return {
            ...w,
            items: [...w.items, wardrobeItem],
          };
        }
        return w;
      }));

      setIsAddingToWardrobe(false);
      setSelectedWardrobe('');
      setItemNotes('');
      router.replace('/wardrobes');
    } catch (error) {
      console.error('Error adding item to wardrobe:', error);
      alert('Failed to add item to wardrobe. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Wardrobes</h1>
          <Link
            href="/wardrobes/create"
            className="bg-black text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-gray-800 transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
            Create Wardrobe
          </Link>
        </div>

        {isAddingToWardrobe && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full mx-auto shadow-xl transform transition-all">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Add to Wardrobe</h2>
                  <button
                    onClick={() => {
                      setIsAddingToWardrobe(false);
                      router.replace('/wardrobes');
                    }}
                    className="text-gray-400 hover:text-gray-500 transition-colors"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
                <form onSubmit={handleAddToWardrobe} className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Select Wardrobe
                    </label>
                    <select
                      value={selectedWardrobe}
                      onChange={(e) => setSelectedWardrobe(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-300 focus:ring focus:ring-gray-200 focus:ring-opacity-50 transition-colors bg-gray-50"
                      required
                    >
                      <option value="">Choose a wardrobe</option>
                      {wardrobes.map((wardrobe) => (
                        <option key={wardrobe.id} value={wardrobe.id}>
                          {wardrobe.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Notes (optional)
                    </label>
                    <textarea
                      value={itemNotes}
                      onChange={(e) => setItemNotes(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-300 focus:ring focus:ring-gray-200 focus:ring-opacity-50 transition-colors bg-gray-50 min-h-[100px] resize-none"
                      placeholder="Add any notes about this item in your wardrobe..."
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingToWardrobe(false);
                        router.replace('/wardrobes');
                      }}
                      className="px-6 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-xl bg-black text-white hover:bg-gray-900 transition-colors font-medium"
                    >
                      Add to Wardrobe
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Wardrobe Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wardrobes.map((wardrobe) => (
            <Link
              key={wardrobe.id}
              href={`/wardrobes/${wardrobe.id}`}
              className="block group"
            >
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                <div className="aspect-[16/9] relative bg-gray-100">
                  {wardrobe.items && wardrobe.items.length > 0 ? (
                    <div className="grid grid-cols-2 h-full">
                      {wardrobe.items.slice(0, 2).map((item) => (
                        <div key={item.id} className="relative h-full">
                          <Image
                            src={item.clothingItem.images[0]}
                            alt={item.clothingItem.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      No items yet
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 group-hover:text-black">
                    {wardrobe.name}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {wardrobe.items?.length || 0} items
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
} 