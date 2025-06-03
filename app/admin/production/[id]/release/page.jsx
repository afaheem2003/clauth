'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { toast } from 'react-hot-toast';

export default function ReleasePage({ params }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [item, setItem] = useState(null);
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [error, setError] = useState('');

  // Fetch item details
  useEffect(() => {
    async function fetchItem() {
      try {
        const res = await fetch(`/api/clothing/${params.id}`);
        if (!res.ok) throw new Error('Failed to fetch item');
        const data = await res.json();
        setItem(data);
      } catch (err) {
        setError('Failed to load item details');
      }
    }
    fetchItem();
  }, [params.id]);

  async function handleRelease(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/clothing/${params.id}/release`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          price: parseFloat(price),
          totalQuantity: parseInt(quantity),
          releaseDate: new Date().toISOString(),
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to release item');
      }

      toast.success('Item released to shop successfully!');
      router.push('/admin/production');
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h1 className="text-2xl font-bold text-gray-900">Release to Shop</h1>
          <p className="text-sm text-gray-600 mt-1">Set pricing and quantity for {item.name}</p>
        </div>

        <div className="p-6">
          <div className="flex gap-8 mb-8">
            <div className="w-48 h-48 relative rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
              {item.imageUrl && (
                <Image
                  src={item.imageUrl}
                  alt={item.name}
                  fill
                  className="object-cover"
                />
              )}
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">{item.name}</h2>
              <p className="text-gray-600 mt-2">{item.description}</p>
              <div className="mt-4 space-y-2">
                <p className="text-sm text-gray-600">
                  <span className="font-medium text-gray-900">Type:</span> {item.itemType}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium text-gray-900">Material:</span> {item.material}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium text-gray-900">Size:</span> {item.size}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleRelease} className="space-y-6">
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                Price
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  name="price"
                  id="price"
                  step="0.01"
                  min="0"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                Total Quantity Available
              </label>
              <input
                type="number"
                name="quantity"
                id="quantity"
                min="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="mt-1 block w-full sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter quantity"
              />
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                {loading ? 'Releasing...' : 'Release to Shop'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 