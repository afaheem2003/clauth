"use client";

import Image from "next/image";

export default function PlushieCard({ title, description, imageUrl }) {
  return (
    <div className="bg-white rounded-lg shadow hover:shadow-lg transition p-4 flex flex-col items-center">
      <div className="w-full h-48 relative overflow-hidden rounded-md">
        {/* Placeholder or actual plushie image */}
        <Image
          src={imageUrl || "/images/plushie-placeholder.png"}
          alt={title}
          fill
          className="object-cover"
        />
      </div>
      <h3 className="mt-4 text-xl font-bold text-gray-800">{title}</h3>
      <p className="text-gray-600 text-sm mt-1 text-center">{description}</p>
    </div>
  );
}
