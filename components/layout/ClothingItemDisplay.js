"use client";

import Image from "next/image";

export default function ClothingItemDisplay({ imageUrl }) {
  if (!imageUrl) return null;

  return (
    <div className="mt-8 text-center">
      <h3 className="text-2xl font-semibold text-gray-800">Your Clothing Item:</h3>
      <Image
        src={imageUrl}
        alt="Generated Clothing Item"
        width={300}
        height={300}
        className="mt-4 rounded-lg shadow-lg"
      />
    </div>
  );
}
