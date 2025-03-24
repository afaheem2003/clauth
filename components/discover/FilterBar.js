"use client";

export default function FilterBar({ filter, setFilter }) {
  return (
    <div className="flex items-center gap-4">
      <span className="font-semibold text-gray-700">Sort By:</span>
      <button
        onClick={() => setFilter("trending")}
        className={`px-4 py-2 rounded-full border ${
          filter === "trending"
            ? "bg-gray-900 text-white"
            : "bg-white text-gray-700 hover:bg-gray-100"
        }`}
      >
        Trending
      </button>
      <button
        onClick={() => setFilter("newest")}
        className={`px-4 py-2 rounded-full border ${
          filter === "newest"
            ? "bg-gray-900 text-white"
            : "bg-white text-gray-700 hover:bg-gray-100"
        }`}
      >
        Newest
      </button>
      <button
        onClick={() => setFilter("popular")}
        className={`px-4 py-2 rounded-full border ${
          filter === "popular"
            ? "bg-gray-900 text-white"
            : "bg-white text-gray-700 hover:bg-gray-100"
        }`}
      >
        Popular
      </button>
    </div>
  );
}
