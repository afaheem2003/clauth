'use client';

import { useState, useEffect, useMemo } from 'react';
import PlushieCard from '@/components/plushie/PlushieCard';
import { TEXTURES, SIZES } from '@/app/constants/options';
import { MagnifyingGlassIcon } from '@heroicons/react/24/solid';
import Footer from '@/components/common/Footer';

const PER_PAGE = 20;

export default function DiscoverPage() {
  const [plushies, setPlushies] = useState([]);
  const [loading, setLoading] = useState(true);

  const [sort, setSort] = useState('trending');
  const [selectedTexture, setSelectedTexture] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [searchBar, setSearchBar] = useState('');

  const [page, setPage] = useState(1);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/discover', { cache: 'no-store' });
        const data = await res.json();
        setPlushies(data.plushies || []);
      } catch (e) {
        console.error('Failed to fetch plushies:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    let out = plushies;
    if (selectedTexture) out = out.filter(p => p.texture === selectedTexture);
    if (selectedSize) out = out.filter(p => p.size === selectedSize);
    if (searchBar) {
      const q = searchBar.toLowerCase();
      out = out.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.creator?.name?.toLowerCase().includes(q) ||
        p.creator?.displayName?.toLowerCase().includes(q)
      );
    }
    return out;
  }, [plushies, selectedTexture, selectedSize, searchBar]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const pageSafe = Math.min(page, totalPages);
  const paged = filtered.slice((pageSafe - 1) * PER_PAGE, pageSafe * PER_PAGE);

  useEffect(() => setPage(1), [selectedTexture, selectedSize, searchBar]);

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
              Discover and Shop AI Plushies
            </h1>
            <p className="text-lg text-white/90">
              Browse top community picks, newest drops, and personalized suggestions
            </p>
          </div>
        </section>

        {/* global search bar */}
        <section className="bg-gray-50 py-6">
          <div className="container mx-auto px-6">
            <div className="max-w-2xl mx-auto relative">
              <input
                type="text"
                value={searchBar}
                onChange={e => setSearchBar(e.target.value)}
                placeholder="Search plushies, creators…"
                className="w-full rounded-full pl-5 pr-14 py-3 bg-white text-gray-800 placeholder-gray-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute right-5 top-1/2 -translate-y-1/2" />
            </div>
          </div>
        </section>

        {/* sidebar + grid */}
        <section className="container mx-auto px-6 pb-20 flex flex-col lg:flex-row gap-10">
          {/* sidebar */}
          <aside className="lg:w-64 space-y-6 sticky top-24">
            <div>
              <h3 className="font-semibold text-gray-700 mb-1">Sort by</h3>
              <select
                value={sort}
                onChange={e => setSort(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="trending">Trending</option>
                <option value="newest">Newest</option>
                <option value="popular">Popular</option>
              </select>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700 mb-1">Texture</h3>
              <select
                value={selectedTexture}
                onChange={e => setSelectedTexture(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="">All</option>
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
                <option value="">All</option>
                {SIZES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </aside>

          {/* results */}
          <div className="flex-1">
            {filtered.length === 0 ? (
              <p className="text-center text-gray-600 mt-16">
                No plushies match those filters &mdash; try widening your search!
              </p>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-8">
                  {paged.map(p => (
                    <PlushieCard key={p.id} plushie={p} setPlushies={setPlushies} />
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
