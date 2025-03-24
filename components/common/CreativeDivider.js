"use client";

export default function CreativeDivider({ title }) {
  return (
    <div className="relative w-full">
      {/* Inline SVG Divider */}
      <svg viewBox="0 0 1440 320" className="w-full">
        <defs>
          <linearGradient
            id="dividerGradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor="#1F2937" />
            <stop offset="100%" stopColor="#4B5563" />
          </linearGradient>
        </defs>
        <path
          fill="url(#dividerGradient)"
          d="M0,224L48,197.3C96,171,192,117,288,101.3C384,85,480,107,576,112C672,117,768,107,864,122.7C960,139,1056,181,1152,208C1248,235,1344,245,1392,250.7L1440,256L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"
        />
      </svg>

      {/* Overlay Title Badge */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="px-4 py-2 bg-white text-xl font-bold text-gray-800 rounded-full shadow-md">
          {title}
        </span>
      </div>
    </div>
  );
}
