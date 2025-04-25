'use client';

import { useState, useEffect } from 'react';
import PlushieCard                   from '@/components/plushie/PlushieCard';
import { TEXTURES, SIZES }           from '@/app/constants/options';
import { MagnifyingGlassIcon }       from '@heroicons/react/24/solid';

export default function DiscoverPage() {
  /* ------------------------ data + state --------------------------- */
  const [plushies, setPlushies]         = useState([]);
  const [loading,  setLoading]          = useState(true);
  const [sort,     setSort]             = useState('trending');

  const [selectedTexture, setSelectedTexture] = useState('');
  const [animalFilter,    setAnimalFilter]    = useState('');
  const [selectedSize,    setSelectedSize]    = useState('');
  const [artistFilter,    setArtistFilter]    = useState('');
  const [searchBar,       setSearchBar]       = useState('');

  /* ----------------------- fetch once ------------------------------ */
  useEffect(() => {
    (async () => {
      try {
        const res  = await fetch('/api/discover');
        const data = await res.json();
        setPlushies(data.plushies || []);
      } catch (err) {
        console.error('Failed to fetch plushies:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ------------------- client-side filtering ----------------------- */
  let filtered = plushies;

  if (selectedTexture) filtered = filtered.filter(p => p.texture === selectedTexture);
  if (selectedSize)    filtered = filtered.filter(p => p.size    === selectedSize);
  if (animalFilter)    filtered = filtered.filter(p => p.name.toLowerCase().includes(animalFilter.toLowerCase()));
  if (artistFilter)    filtered = filtered.filter(p => p.creator?.name?.toLowerCase().includes(artistFilter.toLowerCase()));
  if (searchBar) {
    const q = searchBar.toLowerCase();
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.creator?.name?.toLowerCase().includes(q)
    );
  }

  /* ---------------------------- UI --------------------------------- */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg font-semibold">Loading…</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* hero / heading with banner */}
      <section
        className="
          relative py-20 md:py-24
          bg-center bg-cover shadow-sm
        "
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
              placeholder="Search plushies, creators…"
              value={searchBar}
              onChange={e => setSearchBar(e.target.value)}
              className="
                w-full bg-white text-gray-800 placeholder-gray-600
                rounded-full pl-5 pr-14 py-3 shadow-sm
                focus:outline-none focus:ring-2 focus:ring-blue-500
              "
            />
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </section>

      {/* content + sidebar */}
      <section className="container mx-auto px-6 pb-20 flex flex-col lg:flex-row gap-10">
        {/* ---------------- sidebar ---------------- */}
        <aside className="lg:w-64 lg:shrink-0">
          <div className="sticky top-24 space-y-6">

            {/* sort */}
            <div>
              <h3 className="font-semibold text-gray-700 mb-1">Sort by</h3>
              <select
                value={sort}
                onChange={e => setSort(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 placeholder-gray-600"
              >
                <option value="trending">Trending</option>
                <option value="newest">Newest</option>
                <option value="popular">Popular</option>
              </select>
            </div>

            {/* texture */}
            <div>
              <h3 className="font-semibold text-gray-700 mb-1">Texture</h3>
              <select
                value={selectedTexture}
                onChange={e => setSelectedTexture(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 placeholder-gray-600"
              >
                <option value="">All</option>
                {TEXTURES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {/* size */}
            <div>
              <h3 className="font-semibold text-gray-700 mb-1">Size</h3>
              <select
                value={selectedSize}
                onChange={e => setSelectedSize(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 placeholder-gray-600"
              >
                <option value="">All</option>
                {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* animal */}
            <div>
              <h3 className="font-semibold text-gray-700 mb-1">Animal</h3>
              <input
                type="text"
                placeholder="e.g. Cat"
                value={animalFilter}
                onChange={e => setAnimalFilter(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 placeholder-gray-600"
              />
            </div>

            {/* artist */}
            <div>
              <h3 className="font-semibold text-gray-700 mb-1">Artist</h3>
              <input
                type="text"
                placeholder="e.g. PlushieMaker"
                value={artistFilter}
                onChange={e => setArtistFilter(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 placeholder-gray-600"
              />
            </div>
          </div>
        </aside>

        {/* ---------------- results grid ---------------- */}
        <div className="flex-1">
          {filtered.length === 0 ? (
            <p className="text-center text-gray-600 mt-16">
              No plushies match those filters &mdash; try widening your search!
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-8">
              {filtered.map(p => (
                <PlushieCard
                  key={p.id}
                  plushie={p}
                  setPlushies={setPlushies}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
