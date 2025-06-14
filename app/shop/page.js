'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ClothingItemCard from '@/components/clothing/ClothingItemCard';
import { ITEM_TYPES } from '@/app/constants/options';
import Footer from '@/components/common/Footer';
import AnimatedCard from '@/components/common/AnimatedCard';
import Pagination from '@/components/common/Pagination';

const PER_PAGE = 20;

export default function ShopPage() {
  const [clothingItems, setClothingItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const router = useRouter();

  // Check if shop is enabled, redirect if not
  useEffect(() => {
    const isShopEnabled = process.env.NEXT_PUBLIC_ENABLE_SHOP === 'true';
    if (!isShopEnabled) {
      router.push('/discover');
      return;
    }
  }, [router]);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItemType, setSelectedItemType] = useState('All');
  const [priceRange, setPriceRange] = useState([0, 1000]); // Default price range
  const [sortBy, setSortBy] = useState('newest'); // newest, price-asc, price-desc
  const [view, setView] = useState('available'); // available or dropping-soon

  const [page, setPage] = useState(1);

  // Close filter modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isFilterOpen && !e.target.closest('.filter-modal')) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isFilterOpen]);

  useEffect(() => {
    async function fetchShopData() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/shop?view=${view}`);
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
    fetchShopData();
  }, [view]);

  const filteredItems = clothingItems.filter(item => {
    const matchesSearch = searchTerm === '' || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.itemType.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (item.description?.toLowerCase() || '').includes(searchTerm.toLowerCase());

    const matchesItemType = selectedItemType === 'All' || item.itemType === selectedItemType;
    
    const matchesPrice = (() => {
      const price = Number(item.price);
      return price >= priceRange[0] && price <= priceRange[1];
    })();

    return matchesSearch && matchesItemType && matchesPrice;
  }).sort((a, b) => {
    if (sortBy === 'price-asc') return Number(a.price) - Number(b.price);
    if (sortBy === 'price-desc') return Number(b.price) - Number(a.price);
    return new Date(b.createdAt) - new Date(a.createdAt); // newest by default
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
          style={{ backgroundImage: "url('/images/shop/banner.png')" }}
        >
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative container mx-auto px-6 text-center">
            <h1 className="text-4xl font-extrabold text-white mb-2">
              Shop Unique Designs
            </h1>
            <p className="text-lg text-white/90">
              Discover and purchase amazing community-created clothing.
            </p>
          </div>
        </section>

        {/* View Toggle */}
        <div className="container mx-auto px-6 py-6">
          <div className="flex justify-center space-x-4 mb-6">
            <button
              onClick={() => setView('available')}
              className={`px-6 py-2.5 text-sm font-medium tracking-wider transition-colors rounded-md ${
                view === 'available'
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              AVAILABLE NOW
            </button>
            <button
              onClick={() => setView('dropping-soon')}
              className={`px-6 py-2.5 text-sm font-medium tracking-wider transition-colors rounded-md ${
                view === 'dropping-soon'
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              DROPPING SOON
            </button>
          </div>
        </div>

        {/* global search bar */}
        <section className="bg-gray-50 py-6">
          <div className="container mx-auto px-6">
            <div className="max-w-2xl mx-auto relative">
              <input
                type="text"
                placeholder="Search by name, type, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-full pl-5 pr-14 py-3 bg-white text-gray-900 placeholder-gray-600 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </section>

        {/* Filter & Sort Button */}
        <div className="container mx-auto px-6 mb-6">
          <div className="flex justify-end">
            <button
              onClick={() => setIsFilterOpen(true)}
              className="px-6 py-2.5 bg-black text-white text-sm font-medium tracking-wider hover:bg-gray-900 transition-colors rounded-md"
            >
              FILTER & SORT
            </button>
          </div>
        </div>

        {/* Filter Sidebar Modal */}
        {isFilterOpen && (
          <>
            {/* Overlay */}
            <div 
              className="fixed inset-0 bg-black/30 z-40"
              onClick={() => setIsFilterOpen(false)}
            />
            
            {/* Sidebar */}
            <div className="fixed inset-y-0 right-0 z-50 w-full max-w-[400px] bg-white shadow-xl">
              <div className="filter-modal h-full overflow-y-auto animate-slide-left">
                <div className="p-8">
                  <div className="flex justify-between items-center mb-10 border-b border-gray-100 pb-6">
                    <h2 className="text-lg font-semibold text-gray-900">FILTER & SORT</h2>
                    <button
                      onClick={() => setIsFilterOpen(false)}
                      className="text-3xl text-gray-400 hover:text-gray-600 leading-none"
                    >
                      ×
                    </button>
                  </div>

                  {/* Sort Options */}
                  <div className="mb-10">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">SORT</h3>
                    <div className="space-y-3">
                      <button
                        onClick={() => setSortBy('newest')}
                        className={`w-full text-left py-2 text-sm tracking-wide transition-colors ${
                          sortBy === 'newest' 
                            ? 'text-gray-900 font-medium' 
                            : 'text-gray-700 hover:text-gray-900'
                        }`}
                      >
                        Newest
                      </button>
                      <button
                        onClick={() => setSortBy('price-asc')}
                        className={`w-full text-left py-2 text-sm tracking-wide transition-colors ${
                          sortBy === 'price-asc'
                            ? 'text-gray-900 font-medium'
                            : 'text-gray-700 hover:text-gray-900'
                        }`}
                      >
                        Price: Low to High
                      </button>
                      <button
                        onClick={() => setSortBy('price-desc')}
                        className={`w-full text-left py-2 text-sm tracking-wide transition-colors ${
                          sortBy === 'price-desc'
                            ? 'text-gray-900 font-medium'
                            : 'text-gray-700 hover:text-gray-900'
                        }`}
                      >
                        Price: High to Low
                      </button>
                    </div>
                  </div>

                  {/* Category Filter */}
                  <div className="mb-10">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">CATEGORY</h3>
                    <div className="space-y-3">
                      <button
                        onClick={() => setSelectedItemType('All')}
                        className={`w-full text-left py-2 text-sm tracking-wide transition-colors ${
                          selectedItemType === 'All'
                            ? 'text-gray-900 font-medium'
                            : 'text-gray-700 hover:text-gray-900'
                        }`}
                      >
                        All Categories
                      </button>
                      {ITEM_TYPES.map(type => (
                        <button
                          key={type}
                          onClick={() => setSelectedItemType(type)}
                          className={`w-full text-left py-2 text-sm tracking-wide transition-colors ${
                            selectedItemType === type
                              ? 'text-gray-900 font-medium'
                              : 'text-gray-700 hover:text-gray-900'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Price Range Filter */}
                  <div className="mb-10">
                    <h3 className="text-sm font-semibold text-gray-900 mb-6">PRICE</h3>
                    <div className="px-1">
                      <div className="flex justify-between text-sm text-gray-900 mb-4">
                        <span>${priceRange[0]}</span>
                        <span>${priceRange[1]}</span>
                      </div>
                      <div className="relative mb-6">
                        <div className="absolute h-[2px] inset-x-0 top-1/2 -translate-y-1/2 bg-gray-200"></div>
                        <div 
                          className="absolute h-[2px] inset-y-1/2 -translate-y-1/2 bg-gray-900"
                          style={{
                            left: `${(priceRange[0] / 1000) * 100}%`,
                            right: `${100 - (priceRange[1] / 1000) * 100}%`
                          }}
                        />
                        <input
                          type="range"
                          min="0"
                          max="1000"
                          step="10"
                          value={priceRange[0]}
                          onChange={e => setPriceRange([parseInt(e.target.value), priceRange[1]])}
                          className="absolute w-full top-1/2 -translate-y-1/2 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gray-900 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md hover:[&::-webkit-slider-thumb]:bg-gray-800"
                        />
                        <input
                          type="range"
                          min="0"
                          max="1000"
                          step="10"
                          value={priceRange[1]}
                          onChange={e => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                          className="absolute w-full top-1/2 -translate-y-1/2 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gray-900 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md hover:[&::-webkit-slider-thumb]:bg-gray-800"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Done Button */}
                  <button
                    onClick={() => setIsFilterOpen(false)}
                    className="w-full bg-gray-900 text-white py-4 text-sm font-medium tracking-wider hover:bg-black transition-colors rounded-md"
                  >
                    DONE
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Results Grid */}
        <section className="container mx-auto px-6 pb-20">
          <div className="flex-1">
            {filteredItems.length === 0 ? (
              <p className="text-center text-gray-600 mt-16">
                No clothing items match those filters &mdash; try widening your search!
              </p>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-x-8 gap-y-16">
                  {pagedItems.map(item => (
                    <AnimatedCard key={item.id}>
                      <ClothingItemCard 
                        clothingItem={item}
                        showPrice={true}
                        showProgress={true}
                        showWaitlist={false}
                        linkToShop={true}
                      />
                    </AnimatedCard>
                  ))}
                </div>

                {totalPages > 1 && (
                  <Pagination
                    currentPage={pageSafe}
                    totalPages={totalPages}
                    onPageChange={(newPage) => setPage(newPage)}
                  />
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