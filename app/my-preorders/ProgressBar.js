"use client";

export default function ProgressBar({ pledged, goal }) {
  const progress = (pledged / goal) * 100;
  return (
    <div className="w-full bg-gray-200 rounded h-4 mt-1 overflow-hidden">
      <div
        className={`h-4 ${progress >= 100 ? "bg-green-500" : "bg-blue-500"}`}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
