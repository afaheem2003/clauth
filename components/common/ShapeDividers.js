// components/ShapeDividers.js (example filename)
"use client";

export function ShapeDividerBottom({ fillColor = "#ffffff" }) {
  return (
    <div className="pointer-events-none overflow-hidden">
      <svg
        className="block w-full h-16 rotate-180"
        viewBox="0 0 1200 120"
        preserveAspectRatio="none"
      >
        {/* 
          M1200 0L0 0 0 120 1200 120Z = a simple diagonal / triangle shape
          fill={fillColor} merges the shape with the next section's background
        */}
        <path d="M1200 0L0 0 0 120 1200 120Z" fill={fillColor} />
      </svg>
    </div>
  );
}

export function ShapeDividerTop({ fillColor = "#ffffff" }) {
  return (
    <div className="pointer-events-none overflow-hidden">
      <svg
        className="block w-full h-16"
        viewBox="0 0 1200 120"
        preserveAspectRatio="none"
      >
        <path d="M1200 0L0 0 0 120 1200 120Z" fill={fillColor} />
      </svg>
    </div>
  );
}
