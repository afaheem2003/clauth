'use client';

import { useEffect, useState } from 'react';
import ClothingItemCard from '@/components/clothing/ClothingItemCard';
import { ITEM_TYPES, MATERIALS, SIZES, COLORS, FITS, PRICE_RANGES } from '@/app/constants/options';
import FilterBar from '@/components/discover/FilterBar';
// import SearchBar from '@/components/discover/SearchBar'; // Removed as component not found
import Footer from '@/components/common/Footer';
import AnimatedCard from '@/components/common/AnimatedCard';

const PER_PAGE = 20;

export default function DiscoverPage() {
  const [clothingItems, setClothingItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItemType, setSelectedItemType] = useState('All');
  const [selectedMaterial, setSelectedMaterial] = useState('All');
  const [selectedSize, setSelectedSize] = useState('All');
  const [selectedColor, setSelectedColor] = useState('All');
  const [selectedFit, setSelectedFit] = useState('All');
  const [selectedPriceRange, setSelectedPriceRange] = useState('All');

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
    const matchesSearch = searchTerm === '' || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.itemType.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (item.description?.toLowerCase() || '').includes(searchTerm.toLowerCase());

    const matchesItemType = selectedItemType === 'All' || item.itemType === selectedItemType;
    const matchesMaterial = selectedMaterial === 'All' || item.material === selectedMaterial;
    const matchesSize = selectedSize === 'All' || item.size === selectedSize;
    const matchesColor = selectedColor === 'All' || item.color === selectedColor;
    const matchesFit = selectedFit === 'All' || item.fit === selectedFit;
    
    const matchesPrice = selectedPriceRange === 'All' || (() => {
      const price = Number(item.price);
      if (selectedPriceRange === 'All') return true;
      const range = PRICE_RANGES.find(r => r.label === selectedPriceRange);
      if (!range) return true;
      if (range.max === null) return price >= range.min;
      return price >= range.min && price < range.max;
    })();

    return matchesSearch && matchesItemType && matchesMaterial && 
           matchesSize && matchesColor && matchesFit && matchesPrice;
  });

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PER_PAGE));
  const pageSafe = Math.min(page, totalPages);
  const pagedItems = filteredItems.slice((pageSafe - 1) * PER_PAGE, pageSafe * PER_PAGE);

  const handleItemSoftDeleted = (deletedItemId) => {
    setClothingItems(prevItems => prevItems.filter(item => item.id !== deletedItemId));
  };

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
            {/* Category/Type Filter */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Category</h3>
              <select
                value={selectedItemType}
                onChange={e => setSelectedItemType(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-gray-900"
              >
                <option value="All" className="text-gray-800">All Categories</option>
                {ITEM_TYPES.map(t => (
                  <option key={t} value={t} className="text-gray-900">{t}</option>
                ))}
              </select>
            </div>

            {/* Material Filter */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Material</h3>
              <select
                value={selectedMaterial}
                onChange={e => setSelectedMaterial(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-gray-900"
              >
                <option value="All" className="text-gray-800">All Materials</option>
                {MATERIALS.map(m => (
                  <option key={m} value={m} className="text-gray-900">{m}</option>
                ))}
              </select>
            </div>

            {/* Size Filter */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Size</h3>
              <select
                value={selectedSize}
                onChange={e => setSelectedSize(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-gray-900"
              >
                <option value="All" className="text-gray-800">All Sizes</option>
                {SIZES.map(s => (
                  <option key={s} value={s} className="text-gray-900">{s}</option>
                ))}
              </select>
            </div>

            {/* Color Filter */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Color</h3>
              <select
                value={selectedColor}
                onChange={e => setSelectedColor(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-gray-900"
              >
                <option value="All" className="text-gray-800">All Colors</option>
                {COLORS.map(c => (
                  <option key={c} value={c} className="text-gray-900">{c}</option>
                ))}
              </select>
            </div>

            {/* Fit Filter */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Fit</h3>
              <select
                value={selectedFit}
                onChange={e => setSelectedFit(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-gray-900"
              >
                <option value="All" className="text-gray-800">All Fits</option>
                {FITS.map(f => (
                  <option key={f} value={f} className="text-gray-900">{f}</option>
                ))}
              </select>
            </div>

            {/* Price Range Filter */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Price Range</h3>
              <select
                value={selectedPriceRange}
                onChange={e => setSelectedPriceRange(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-gray-900"
              >
                <option value="All" className="text-gray-800">All Prices</option>
                {PRICE_RANGES.map(range => (
                  <option key={range.label} value={range.label} className="text-gray-900">{range.label}</option>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-12">
                  {pagedItems.map(item => (
                    <AnimatedCard key={item.id}>
                      <ClothingItemCard 
                        clothingItem={item} 
                        onItemSoftDeleted={handleItemSoftDeleted}
                      />
                    </AnimatedCard>
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
