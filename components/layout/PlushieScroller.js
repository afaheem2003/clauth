"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const PLUSHIE_IMAGES = [
  "/images/plushie-placeholder.png",
  "/images/plushie-placeholder.png",
  "/images/plushie-placeholder.png",
];

export default function PlushieScroller() {
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
        {[...PLUSHIE_IMAGES, ...PLUSHIE_IMAGES].map((src, index) => (
          <Image
            key={index}
            src={src}
            alt="Plushie"
            width={150}
            height={150}
            className="opacity-30"
          />
        ))}
      </div>
    </div>
  );
}
