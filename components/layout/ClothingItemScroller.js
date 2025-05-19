"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const CLOTHING_ITEM_IMAGES = [
  "/images/clothing-item-placeholder.png",
  "/images/clothing-item-placeholder.png",
  "/images/clothing-item-placeholder.png",
];

export default function ClothingItemScroller() {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setOffset((prev) => (prev + 1) % 100);
    }, 50); // Adjust speed of scrolling

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden z-0">
      <div
        className="flex space-x-10 absolute top-1/2 transform -translate-y-1/2"
        style={{
          left: `-${offset}%`,
          width: "200%",
          animation: "scrolling 30s linear infinite",
        }}
      >
        {[...CLOTHING_ITEM_IMAGES, ...CLOTHING_ITEM_IMAGES].map((src, index) => (
          <Image
            key={index}
            src={src}
            alt="Clothing Item"
            width={150}
            height={150}
            className="opacity-30"
          />
        ))}
      </div>
    </div>
  );
}
