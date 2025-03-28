"use client";

import Image from "next/image";

export default function PlushieBackground() {
  // Number of rows and number of items per row for the background
  const NUM_ROWS = 4;
  const ITEMS_PER_ROW = 8; // Adjust as needed

  return (
    <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
      {Array.from({ length: NUM_ROWS }).map((_, rowIndex) => (
        <ScrollingRow key={rowIndex} itemsPerRow={ITEMS_PER_ROW} />
      ))}
    </div>
  );
}

/**
 * Renders a single horizontal row that scrolls from right to left.
 * The row is duplicated to create a seamless looping effect.
 */
function ScrollingRow({ itemsPerRow }) {
  const plushies = Array.from({ length: itemsPerRow }).map((_, i) => (
    <div key={i} className="relative w-32 h-32 mr-6 flex-shrink-0">
      <Image
        src="/images/plushie-placeholder.png"
        alt="Plushie"
        fill
        className="object-cover"
      />
    </div>
  ));

  return (
    <div className="flex w-[200%] animate-scroll-loop">
      {plushies}
      {plushies /* Duplicate for seamless loop */}
    </div>
  );
}
