// components/common/ProgressBar.js
"use client";
export default function ProgressBar({ pledged, goal }) {
  const pct = Math.min(100, (pledged / goal) * 100);
  return (
    <div className="w-full bg-gray-200 rounded h-4 mt-1 overflow-hidden">
      <div
        className={`h-4 ${pct >= 100 ? "bg-green-500" : "bg-blue-500"}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
