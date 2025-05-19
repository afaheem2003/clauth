"use client";

import Link from "next/link";

export default function CompetitionSection() {
  return (
    <section className="bg-gray-50 py-16 text-center">
      <div className="container mx-auto px-6">
        <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
          Join the Clauth Competition
        </h2>
        <p className="text-xl md:text-2xl text-gray-700 max-w-2xl mx-auto mb-8">
          Submit your clothing design ideas, vote on your favorites, and see which
          designs rise to the top. When a design reaches enough votes, we'll
          bring it to life!
        </p>
        <Link
          href="/competition"
          className="inline-block px-10 py-4 bg-gray-900 text-white text-xl font-semibold rounded-full shadow-lg hover:bg-gray-700 transition-colors"
        >
          View Competition
        </Link>
      </div>
    </section>
  );
}
