'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ClothingItemCard from '@/components/clothing/ClothingItemCard';
import AnimatedCard from '@/components/common/AnimatedCard';
import Pagination from '@/components/common/Pagination';

const PER_PAGE = 20;

export default function DiscoverPage() {
  const router = useRouter();
  const [clothingItems, setClothingItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState([]);
  const [sortBy, setSortBy] = useState('newest'); // newest, likes
  const [expandedCategories, setExpandedCategories] = useState({});

  const [page, setPage] = useState(1);

  // Filter management functions
  const addFilter = (type, value, label) => {
    const filterId = `${type}-${value}`;
    const existingFilter = activeFilters.find(f => f.id === filterId);
    
    if (!existingFilter) {
      setActiveFilters(prev => [...prev, { id: filterId, type, value, label }]);
    }
    setPage(1);
  };

  const removeFilter = (filterId) => {
    setActiveFilters(prev => prev.filter(f => f.id !== filterId));
    setPage(1);
  };

  const clearAllFilters = () => {
    setActiveFilters([]);
    setPage(1);
  };

  const toggleCategoryExpansion = (categoryType) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryType]: !prev[categoryType]
    }));
  };

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

  // Get unique item types from actual data
  const uniqueItemTypes = [...new Set(clothingItems.map(item => item.itemType))].sort();
  
  const categories = [
    { 
      name: 'TOPS', 
      type: 'tops',
      itemTypes: ['T-Shirt (Short Sleeve)', 'T-Shirt (Long Sleeve)', 'T-Shirt', 'Tank Top', 'Polo Shirt', 'Button-Down Shirt', 'Long Sleeve', 'Hoodie', 'Sweater'],
      count: clothingItems.filter(item => 
        ['T-Shirt (Short Sleeve)', 'T-Shirt (Long Sleeve)', 'T-Shirt', 'Tank Top', 'Polo Shirt', 'Button-Down Shirt', 'Long Sleeve', 'Hoodie', 'Sweater'].includes(item.itemType)
      ).length
    },
    { 
      name: 'BOTTOMS', 
      type: 'bottoms',
      itemTypes: ['Jeans', 'Chinos', 'Dress Pants', 'Shorts'],
      count: clothingItems.filter(item => 
        ['Jeans', 'Chinos', 'Dress Pants', 'Shorts'].includes(item.itemType)
      ).length
    },
    { 
      name: 'OUTERWEAR', 
      type: 'outerwear',
      itemTypes: ['Jacket', 'Blazer'],
      count: clothingItems.filter(item => 
        ['Jacket', 'Blazer'].includes(item.itemType)
      ).length
    },
    { 
      name: 'DRESSES', 
      type: 'dresses',
      itemTypes: ['Dress', 'Evening Gown'],
      count: clothingItems.filter(item => 
        ['Dress', 'Evening Gown'].includes(item.itemType)
      ).length
    },
    { 
      name: 'NEW ARRIVALS', 
      type: 'All',
      sortOverride: 'newest',
      count: clothingItems.slice(0, 8).length
    }
  ];

  const filteredItems = clothingItems.filter(item => {
    const matchesSearch = searchTerm === '' || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.itemType.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (item.description?.toLowerCase() || '').includes(searchTerm.toLowerCase());

    // If no filters are active, show all items (that match search)
    if (activeFilters.length === 0) {
      return matchesSearch;
    }

    // Group filters by type for smart AND/OR logic
    const categoryFilters = activeFilters.filter(f => f.type === 'category');
    const itemTypeFilters = activeFilters.filter(f => f.type === 'itemType');
    const statusFilters = activeFilters.filter(f => f.type === 'status');

    // Category filters: OR within categories (any category matches)
    let matchesCategory = categoryFilters.length === 0;
    if (categoryFilters.length > 0) {
      matchesCategory = categoryFilters.some(filter => {
        const category = categories.find(cat => cat.type === filter.value);
        return category && category.itemTypes && category.itemTypes.includes(item.itemType);
      });
    }

    // Item type filters: OR within item types (any item type matches)
    let matchesItemType = itemTypeFilters.length === 0;
    if (itemTypeFilters.length > 0) {
      matchesItemType = itemTypeFilters.some(filter => item.itemType === filter.value);
    }

    // Status filters: OR within statuses (any status matches)
    let matchesStatus = statusFilters.length === 0;
    if (statusFilters.length > 0) {
      matchesStatus = statusFilters.some(filter => item.status === filter.value);
    }

    // AND between different filter types, OR within same filter type
    return matchesSearch && matchesCategory && matchesItemType && matchesStatus;
  }).sort((a, b) => {
    if (sortBy === 'likes') return (b.likes?.length || 0) - (a.likes?.length || 0);
    return new Date(b.createdAt) - new Date(a.createdAt); // newest by default
  });

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PER_PAGE));
  const pageSafe = Math.min(page, totalPages);
  const pagedItems = filteredItems.slice((pageSafe - 1) * PER_PAGE, pageSafe * PER_PAGE);

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <main className="flex-grow">
        {/* Hero Header & Search */}
        <section className="bg-white py-16 border-b border-gray-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Title */}
            <div className="text-center mb-12">
              <h1 className="text-5xl md:text-7xl font-extralight text-gray-900 mb-3 tracking-tight">
                All Designs
              </h1>
              <p className="text-gray-400 text-sm tracking-widest uppercase mb-6">
                {filteredItems.length} Items Available
              </p>
              
              {/* Active Filters Pills */}
              {activeFilters.length > 0 && (
                <div className="flex flex-wrap items-center justify-center gap-2 max-w-2xl mx-auto">
                  {activeFilters.map(filter => (
                    <div
                      key={filter.id}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-900 text-white text-sm rounded-full transition-all duration-200 hover:bg-gray-800"
                    >
                      <span className="font-medium">{filter.label}</span>
                      <button
                        onClick={() => removeFilter(filter.id)}
                        className="flex items-center justify-center w-4 h-4 rounded-full hover:bg-white/20 transition-colors duration-200"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  
                  {/* Clear All Button */}
                  {activeFilters.length > 1 && (
                    <button
                      onClick={clearAllFilters}
                      className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 border border-gray-300 hover:border-gray-400 rounded-full transition-all duration-200"
                    >
                      Clear All
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Centered Search & Filter */}
            <div className="flex items-center gap-3 max-w-2xl mx-auto">
              <div className="flex-1 relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search designs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white border border-gray-300 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-black transition-all rounded-sm"
                />
              </div>
              
              <button
                onClick={() => setIsFilterOpen(true)}
                className="flex items-center gap-2 px-6 py-4 bg-black text-white text-sm font-medium hover:bg-gray-800 transition-colors whitespace-nowrap rounded-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                FILTER
              </button>
            </div>

            {/* Category Pills */}
            <div className="flex items-center justify-center gap-2 mt-8 flex-wrap">
              {categories.filter(cat => cat.count > 0).map((category) => {
                const isActive = activeFilters.some(f => f.type === 'category' && f.value === category.type);
                return (
                  <button
                    key={category.name}
                    onClick={() => {
                      if (category.type === 'All') {
                        clearAllFilters();
                        if (category.sortOverride) setSortBy(category.sortOverride);
                      } else {
                        if (isActive) {
                          removeFilter(`category-${category.type}`);
                        } else {
                          addFilter('category', category.type, category.name);
                        }
                        if (category.sortOverride) setSortBy(category.sortOverride);
                      }
                    }}
                    className={`px-5 py-2 text-xs font-medium tracking-wider transition-all rounded-full ${
                      isActive 
                        ? 'bg-black text-white' 
                        : 'bg-white border border-gray-300 text-gray-700 hover:border-black'
                    }`}
                  >
                    {category.name}
                    {category.count > 0 && (
                      <span className="ml-2 text-xs opacity-70">({category.count})</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

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
              <div className="filter-modal h-full flex flex-col animate-slide-left">
                {/* Fixed Header */}
                <div className="p-8 border-b border-gray-100">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-semibold text-gray-900">FILTER & SORT</h2>
                    <button
                      onClick={() => setIsFilterOpen(false)}
                      className="text-3xl text-gray-400 hover:text-gray-600 leading-none"
                    >
                      ×
                    </button>
                  </div>

                  {/* Active Filters */}
                  {activeFilters.length > 0 && (
                    <div className="mb-6">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-sm font-semibold text-gray-900">ACTIVE FILTERS</h3>
                        <button
                          onClick={clearAllFilters}
                          className="text-xs text-gray-500 hover:text-gray-700 underline"
                        >
                          Clear All
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {activeFilters.map(filter => (
                          <div
                            key={filter.id}
                            className="flex items-center gap-2 px-3 py-1 bg-black text-white text-xs rounded-full"
                          >
                            <span>{filter.label}</span>
                            <button
                              onClick={() => removeFilter(filter.id)}
                              className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-8">

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
                        Newest First
                      </button>
                      <button
                        onClick={() => setSortBy('likes')}
                        className={`w-full text-left py-2 text-sm tracking-wide transition-colors ${
                          sortBy === 'likes'
                            ? 'text-gray-900 font-medium'
                            : 'text-gray-700 hover:text-gray-900'
                        }`}
                      >
                        Most Liked
                      </button>
                    </div>
                  </div>

                  {/* Status Filter */}
                  <div className="mb-10">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">STATUS</h3>
                    <div className="space-y-3">
                      {[
                        { value: 'CONCEPT', label: 'Coming Soon' },
                        { value: 'SELECTED', label: 'Dropping Soon' },
                        { value: 'AVAILABLE', label: 'Available Now' }
                      ].map(status => {
                        const isActive = activeFilters.some(f => f.type === 'status' && f.value === status.value);
                        const count = clothingItems.filter(item => item.status === status.value).length;
                        
                        if (count === 0) return null;
                        
                        return (
                          <button
                            key={status.value}
                            onClick={() => {
                              if (isActive) {
                                removeFilter(`status-${status.value}`);
                              } else {
                                addFilter('status', status.value, status.label);
                              }
                            }}
                            className={`w-full text-left py-2 text-sm tracking-wide transition-colors ${
                              isActive
                                ? 'text-gray-900 font-medium'
                                : 'text-gray-700 hover:text-gray-900'
                            }`}
                          >
                            {status.label}
                            <span className="ml-2 text-xs text-gray-500">({count})</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Category Filter */}
                  <div className="mb-10">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">CATEGORY</h3>
                    <div className="space-y-2">
                      {categories.filter(cat => cat.count > 0 && cat.type !== 'All').map(category => {
                        const isCategoryActive = activeFilters.some(f => f.type === 'category' && f.value === category.type);
                        const isExpanded = expandedCategories[category.type];
                        const categoryItems = category.itemTypes.filter(itemType => 
                          clothingItems.some(item => item.itemType === itemType)
                        );
                        
                        return (
                          <div key={`category-${category.type}`} className="group">
                            {/* Category Header */}
                            <div className="flex items-center justify-between">
                              <button
                                onClick={() => {
                                  if (isCategoryActive) {
                                    removeFilter(`category-${category.type}`);
                                  } else {
                                    addFilter('category', category.type, category.name);
                                  }
                                }}
                                className={`flex-1 text-left py-3 px-0 text-sm font-medium tracking-wide transition-all duration-200 ${
                                  isCategoryActive
                                    ? 'text-black'
                                    : 'text-gray-700 hover:text-black'
                                }`}
                              >
                                {category.name}
                                <span className={`ml-2 text-xs transition-colors duration-200 ${
                                  isCategoryActive ? 'text-gray-600' : 'text-gray-400'
                                }`}>({category.count})</span>
                              </button>
                              
                              {/* Expand/Collapse Button */}
                              <button
                                onClick={() => toggleCategoryExpansion(category.type)}
                                className="p-1 text-gray-400 hover:text-gray-700 transition-all duration-200 hover:bg-gray-100 rounded-md"
                              >
                                <svg 
                                  className={`w-4 h-4 transition-transform duration-300 ease-out ${isExpanded ? 'rotate-180' : ''}`}
                                  fill="none" 
                                  stroke="currentColor" 
                                  viewBox="0 0 24 24"
                                  strokeWidth={1.5}
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>
                            </div>
                            
                            {/* Subcategories */}
                            <div className={`overflow-hidden transition-all duration-400 ease-out ${
                              isExpanded ? 'max-h-96 opacity-100 mt-2' : 'max-h-0 opacity-0 mt-0'
                            }`}>
                              <div className="pl-4 space-y-1">
                                {categoryItems.map(itemType => {
                                  const count = clothingItems.filter(item => item.itemType === itemType).length;
                                  const isActive = activeFilters.some(f => f.type === 'itemType' && f.value === itemType);
                                  
                                  return (
                                    <button
                                      key={`item-${itemType}`}
                                      onClick={() => {
                                        if (isActive) {
                                          removeFilter(`itemType-${itemType}`);
                                        } else {
                                          addFilter('itemType', itemType, itemType);
                                        }
                                      }}
                                      className={`w-full text-left py-2 px-3 text-sm transition-all duration-200 rounded-md border-l-2 ${
                                        isActive
                                          ? 'text-black font-medium bg-gray-50 border-black'
                                          : 'text-gray-600 hover:text-black hover:bg-gray-50 border-transparent hover:border-gray-300'
                                      }`}
                                    >
                                      {itemType}
                                      <span className={`ml-2 text-xs transition-colors duration-200 ${
                                        isActive ? 'text-gray-600' : 'text-gray-400'
                                      }`}>({count})</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      })}
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
        <section className="container mx-auto px-6 py-16">
          <div className="flex-1">
            {filteredItems.length === 0 ? (
              <p className="text-center text-gray-500 mt-16 font-light">
                No items match your filters — try adjusting your search
              </p>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-x-6 gap-y-12">
                  {pagedItems.map(item => (
                    <AnimatedCard key={item.id}>
                      <ClothingItemCard 
                        clothingItem={item}
                        showPrice={item.status !== 'CONCEPT'}
                        showProgress={item.status === 'AVAILABLE'}
                        showWaitlist={item.status === 'SELECTED'}
                        linkToShop={item.status === 'AVAILABLE'}
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
    </div>
  );
}

