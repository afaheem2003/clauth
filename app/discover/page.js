"use client";

import { useState } from "react";
import PlushieCard from "@/components/plushie/PlushieCard";
import { TEXTURES, SIZES } from "@/app/constants/options";

// Updated dummy data with `animal`, `texture`, `size`, `author`
const DUMMY_PLUSHIES = [
  {
    id: "1",
    name: "Galaxy Dragon",
    animal: "Dragon",
    texture: "Minky",
    size: "Keychain",
    author: "@PlushieMaker",
    unitsBought: 10,
    image: "/images/plushie-placeholder.png",
    description: "A cosmic plush made of dreams.",
  },
  {
    id: "2",
    name: "Bubble Bunny",
    animal: "Bunny",
    texture: "Fleece",
    size: "Small",
    author: "@CuddleCrafts",
    unitsBought: 0,
    image: "/images/plushie-placeholder.png",
    description: "Adorable bunny with pastel vibes.",
  },
  {
    id: "3",
    name: "Robot Cat",
    animal: "Cat",
    texture: "Velboa",
    size: "Medium",
    author: "@MechMew",
    unitsBought: 25,
    image: "/images/plushie-placeholder.png",
    description: "Futuristic kitty plush with LED eyes.",
  },
];

export default function DiscoverPage() {
  const [plushies, setPlushies] = useState(DUMMY_PLUSHIES);

  // Sort By (FilterBar) => trending/newest/popular
  const [filter, setFilter] = useState("trending");

  // Additional filters
  const [selectedTexture, setSelectedTexture] = useState("");
  const [animalFilter, setAnimalFilter] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [artistFilter, setArtistFilter] = useState("");

  // 1) Sort
  const sortedPlushies = [...plushies].sort((a, b) => {
    switch (filter) {
      case "newest":
        return parseInt(b.id) - parseInt(a.id);
      case "popular":
        return (b.unitsBought || 0) - (a.unitsBought || 0);
      default:
        return (b.unitsBought || 0) - (a.unitsBought || 0);
    }
  });

  // 2) Filter
  const filteredPlushies = sortedPlushies.filter((p) => {
    if (selectedTexture && p.texture !== selectedTexture) return false;
    if (
      animalFilter &&
      !p.animal.toLowerCase().includes(animalFilter.toLowerCase())
    )
      return false;
    if (selectedSize && p.size !== selectedSize) return false;
    if (
      artistFilter &&
      !p.author.toLowerCase().includes(artistFilter.toLowerCase())
    )
      return false;
    return true;
  });

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero / Title */}
      <section className="py-12 bg-white shadow-sm mb-8">
        <div className="container mx-auto px-6">
          <h1 className="text-4xl font-extrabold text-gray-800 mb-2 text-center">
            Discover AI Plushies
          </h1>
          <p className="text-lg text-gray-600 text-center">
            Browse top community picks, newest drops, and personalized
            suggestions
          </p>
        </div>
      </section>

      {/* Filters Row (Now Grouped by Type) */}
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
              placeholder="e.g. @PlushieMaker"
              value={artistFilter}
              onChange={(e) => setArtistFilter(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-800 shadow-md"
            />
          </div>
        </div>
      </section>

      {/* Plushie Grid (Full Width, Larger Images) */}
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
