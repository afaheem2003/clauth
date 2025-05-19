'use client';

import { useEffect, useState } from 'react';
import ClothingItemCard from '@/components/clothing/ClothingItemCard';
import { TEXTURES, SIZES } from '@/app/constants/options';
import FilterBar from '@/components/discover/FilterBar';
// import SearchBar from '@/components/discover/SearchBar'; // Removed as component not found
import Footer from '@/components/common/Footer';

const PER_PAGE = 20;

export default function DiscoverPage() {
  const [clothingItems, setClothingItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTexture, setSelectedTexture] = useState('All');
  const [selectedSize, setSelectedSize] = useState('All');

  const [page, setPage] = useState(1);

  useEffect(() => {
    async function fetchDiscoverData() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/discover');
        if (!res.ok) throw new Error('Failed to fetch clothing items');
        const data = await res.json();
        setClothingItems(data.clothingItems || []);
      } catch (e) {
        console.error('Failed to fetch clothing items:', e);
        setError('Could not load items. Please try again later.');
        setClothingItems([]);
      }
      setLoading(false);
    }
    fetchDiscoverData();
  }, []);

  const filteredItems = clothingItems.filter(item => {
    return (
      (selectedTexture === 'All' || item.texture === selectedTexture) &&
      (selectedSize === 'All' || item.size === selectedSize) &&
      (searchTerm === '' || item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.itemType.toLowerCase().includes(searchTerm.toLowerCase()) || item.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PER_PAGE));
  const pageSafe = Math.min(page, totalPages);
  const pagedItems = filteredItems.slice((pageSafe - 1) * PER_PAGE, pageSafe * PER_PAGE);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg font-semibold">Loading…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <main className="flex-grow">
        {/* banner */}
        <section
          className="relative py-20 md:py-24 bg-center bg-cover shadow-sm"
          style={{ backgroundImage: "url('/images/discover/banner.png')" }}
        >
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative container mx-auto px-6 text-center">
            <h1 className="text-4xl font-extrabold text-white mb-2">
              Discover Amazing Clothing Items
            </h1>
            <p className="text-lg text-white/90">
              Find your next favorite piece designed by our community.
            </p>
          </div>
        </section>

        {/* global search bar */}
        <section className="bg-gray-50 py-6">
          <div className="container mx-auto px-6">
            <div className="max-w-2xl mx-auto relative">
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search by name, type, or description..."
                className="w-full rounded-full pl-5 pr-14 py-3 bg-white text-gray-800 placeholder-gray-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </section>

        {/* sidebar + grid */}
        <section className="container mx-auto px-6 pb-20 flex flex-col lg:flex-row gap-10">
          {/* sidebar */}
          <aside className="lg:w-64 space-y-6 lg:sticky lg:top-24">
            <div>
              <h3 className="font-semibold text-gray-700 mb-1">Texture</h3>
              <select
                value={selectedTexture}
                onChange={e => setSelectedTexture(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="All">All Textures</option>
                {TEXTURES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700 mb-1">Size</h3>
              <select
                value={selectedSize}
                onChange={e => setSelectedSize(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="All">All Sizes</option>
                {SIZES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </aside>

          {/* results */}
          <div className="flex-1">
            {filteredItems.length === 0 ? (
              <p className="text-center text-gray-600 mt-16">
                No clothing items match those filters &mdash; try widening your search!
              </p>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-8">
                  {pagedItems.map(item => (
                    <ClothingItemCard key={item.id} clothingItem={item} />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="mt-10 flex justify-center gap-2">
                    <button
                      disabled={pageSafe === 1}
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      className="px-3 py-1 rounded bg-gray-200 disabled:opacity-40"
                    >
                      ‹
                    </button>
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setPage(i + 1)}
                        className={`px-3 py-1 rounded ${
                          pageSafe === i + 1
                            ? 'bg-gray-900 text-white'
                            : 'bg-gray-200 hover:bg-gray-300'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      disabled={pageSafe === totalPages}
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      className="px-3 py-1 rounded bg-gray-200 disabled:opacity-40"
                    >
                      ›
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
