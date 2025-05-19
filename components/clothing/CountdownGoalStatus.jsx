"use client";

import { useEffect, useState } from 'react';

function calculateTimeLeft(expiresAt) {
  if (!expiresAt) return null;
  
  const difference = new Date(expiresAt) - new Date();
  if (difference <= 0) return null;

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60)
  };
}

export default function CountdownGoalStatus({ expiresAt, goal, pledged, status }) {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(expiresAt));
  const isExpired = !timeLeft && expiresAt && new Date(expiresAt) < new Date();
  const hasReachedGoal = pledged >= goal;
  
  useEffect(() => {
    if (!expiresAt) return;
    
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(expiresAt));
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresAt]);

  if (status === 'IN_PRODUCTION' || status === 'SHIPPED') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
        <p className="text-green-700 font-semibold">
          🎉 This item has reached its goal and is {status === 'IN_PRODUCTION' ? 'being produced' : 'shipped'}!
        </p>
      </div>
    );
  }

  if (isExpired && !hasReachedGoal) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
        <p className="text-gray-700">
          ⌛ This campaign has ended without reaching its goal
        </p>
      </div>
    );
  }

  if (hasReachedGoal) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
        <p className="text-green-700 font-semibold">
          🎉 Goal reached! This item will be produced!
        </p>
        {timeLeft && (
          <p className="text-sm text-green-600 mt-2">
            Campaign ends in: {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
          </p>
        )}
      </div>
    );
  }

  if (timeLeft) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="text-center">
          <p className="text-blue-700 font-semibold mb-2">
            Time remaining to reach goal:
          </p>
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-white p-2 rounded shadow-sm">
              <div className="text-2xl font-bold text-blue-600">{timeLeft.days}</div>
              <div className="text-xs text-blue-500">Days</div>
            </div>
            <div className="bg-white p-2 rounded shadow-sm">
              <div className="text-2xl font-bold text-blue-600">{timeLeft.hours}</div>
              <div className="text-xs text-blue-500">Hours</div>
            </div>
            <div className="bg-white p-2 rounded shadow-sm">
              <div className="text-2xl font-bold text-blue-600">{timeLeft.minutes}</div>
              <div className="text-xs text-blue-500">Mins</div>
            </div>
            <div className="bg-white p-2 rounded shadow-sm">
              <div className="text-2xl font-bold text-blue-600">{timeLeft.seconds}</div>
              <div className="text-xs text-blue-500">Secs</div>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full" 
                style={{ width: `${Math.min((pledged / goal) * 100, 100)}%` }}
              ></div>
            </div>
            <p className="text-sm text-blue-700 mt-2">
              {pledged} of {goal} pledged ({Math.round((pledged / goal) * 100)}%)
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
} 