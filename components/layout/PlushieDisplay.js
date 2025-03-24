"use client";

import Image from "next/image";

export default function PlushieDisplay({ imageUrl }) {
  if (!imageUrl) return null;

  return (
    <div className="mt-8 text-center">
      <h3 className="text-2xl font-semibold text-gray-800">Your Plushie:</h3>
      <Image
        src={imageUrl}
        alt="Generated Plushie"
        width={300}
        height={300}
        className="mt-4 rounded-lg shadow-lg"
      />
    </div>
  );
}
