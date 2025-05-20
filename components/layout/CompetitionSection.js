"use client";

import Link from "next/link";

export default function CompetitionSection() {
  return (
    <div className="bg-gradient-to-r from-purple-600 to-pink-500 text-white py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold mb-6 text-center">
          Monthly Design Competition
        </h2>
        <p className="text-lg text-center mb-8">
          Win up to $1,000 in prizes! Submit your best designs and let the community vote.
        </p>
        <div className="flex justify-center">
          <button className="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition">
            Learn More
          </button>
        </div>
      </div>
    </div>
  );
}
