'use client';

export default function SalesProgress({ sold, total, status }) {
  if (status !== 'AVAILABLE' || !total) return null;

  const percentage = Math.min(100, Math.round((sold / total) * 100));
  
  return (
    <div className="mt-2">
      <div className="h-1 bg-white/20 rounded-full overflow-hidden">
        <div
          className="h-full bg-white transition-all duration-300 ease-in-out rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
} 