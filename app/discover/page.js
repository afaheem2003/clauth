"use client";

import { useState, useEffect } from "react";
import PlushieCard from "@/components/plushie/PlushieCard";
import { TEXTURES, SIZES } from "@/app/constants/options";

export default function DiscoverPage() {
  const [plushies, setPlushies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("trending");

  // Additional filters
  const [selectedTexture, setSelectedTexture] = useState("");
  const [animalFilter, setAnimalFilter] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [artistFilter, setArtistFilter] = useState("");

  // Fetch plushies from the backend on component mount
  useEffect(() => {
    async function fetchPlushies() {
      try {
        const res = await fetch("/api/discover");
        const data = await res.json();
        setPlushies(data.plushies || []);
      } catch (err) {
        console.error("Failed to fetch plushies:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchPlushies();
  }, []);

  // The API already sorts by closeness to goal
  const sortedPlushies = plushies;

  // Client-side filtering
  const filteredPlushies = sortedPlushies.filter((p) => {
    if (selectedTexture && p.texture !== selectedTexture) return false;
    if (
      animalFilter &&
      !p.name.toLowerCase().includes(animalFilter.toLowerCase())
    )
      return false;
    if (selectedSize && p.size !== selectedSize) return false;
    if (artistFilter && p.creator && p.creator.name) {
      if (!p.creator.name.toLowerCase().includes(artistFilter.toLowerCase()))
        return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg font-semibold">Loading...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero / Title */}
      <section className="py-12 bg-white shadow-sm mb-8">
        <div className="container mx-auto px-6">
          <h1 className="text-4xl font-extrabold text-gray-800 mb-2 text-center">
            Discover and Shop AI Plushies
          </h1>
          <p className="text-lg text-gray-600 text-center">
            Browse top community picks, newest drops, and personalized
            suggestions
          </p>
        </div>
      </section>

      {/* Filters Row */}
      <section className="container mx-auto px-6 mb-10">
        <div className="grid grid-cols-5 gap-10 items-center w-full max-w-6xl mx-auto">
          {/* Sorting (Dropdown) */}
          <div className="relative w-full">
            <label className="block text-gray-700 font-semibold mb-1">
              Sort by:
            </label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-800 bg-white shadow-md"
            >
              <option value="trending">Trending</option>
              <option value="newest">Newest</option>
              <option value="popular">Popular</option>
            </select>
          </div>

          {/* Texture (Dropdown) */}
          <div className="relative w-full">
            <label className="block text-gray-700 font-semibold mb-1">
              Texture:
            </label>
            <select
              value={selectedTexture}
              onChange={(e) => setSelectedTexture(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-800 bg-white shadow-md"
            >
              <option value="">All Textures</option>
              {TEXTURES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Size (Dropdown) */}
          <div className="relative w-full">
            <label className="block text-gray-700 font-semibold mb-1">
              Size:
            </label>
            <select
              value={selectedSize}
              onChange={(e) => setSelectedSize(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-800 bg-white shadow-md"
            >
              <option value="">All Sizes</option>
              {SIZES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Animal (Search Input) */}
          <div className="relative w-full">
            <label className="block text-gray-700 font-semibold mb-1">
              Animal:
            </label>
            <input
              type="text"
              placeholder="e.g. Cat, Bunny"
              value={animalFilter}
              onChange={(e) => setAnimalFilter(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-800 shadow-md"
            />
          </div>

          {/* Artist (Search Input) */}
          <div className="relative w-full">
            <label className="block text-gray-700 font-semibold mb-1">
              Artist:
            </label>
            <input
              type="text"
              placeholder="e.g. PlushieMaker"
              value={artistFilter}
              onChange={(e) => setArtistFilter(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-800 shadow-md"
            />
          </div>
        </div>
      </section>

      {/* Plushie Grid */}
      <section className="w-full px-6 mx-auto pb-16">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-8">
          {filteredPlushies.map((p) => (
            <PlushieCard key={p.id} plushie={p} setPlushies={setPlushies} />
          ))}
        </div>
      </section>
    </main>
  );
}
