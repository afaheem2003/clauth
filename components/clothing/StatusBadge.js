'use client';

import { format } from 'date-fns';

export default function StatusBadge({ status, dropDate, soldQuantity, totalQuantity }) {
  // Helper function to calculate percentage sold
  const calculatePercentageSold = () => {
    if (!totalQuantity || !soldQuantity) return 0;
    return (soldQuantity / totalQuantity) * 100;
  };

  // Determine badge style and text based on status
  const getBadgeConfig = () => {
    const percentageSold = calculatePercentageSold();

    switch (status) {
      case 'CONCEPT':
        return {
          text: '',
          bgColor: 'bg-transparent',
          textColor: 'text-transparent'
        };
      case 'SELECTED':
        return {
          text: `Dropping ${dropDate ? format(new Date(dropDate), 'MMM d') : 'Soon'}`,
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-700'
        };
      case 'AVAILABLE':
        if (soldQuantity >= totalQuantity) {
          return {
            text: 'Sold Out',
            bgColor: 'bg-red-100',
            textColor: 'text-red-700'
          };
        }
        if (percentageSold > 90) {
          return {
            text: 'Last Few',
            bgColor: 'bg-orange-100',
            textColor: 'text-orange-700'
          };
        }
        if (percentageSold > 75) {
          return {
            text: 'Selling Fast',
            bgColor: 'bg-yellow-100',
            textColor: 'text-yellow-700'
          };
        }
        return {
          text: 'Available Now',
          bgColor: 'bg-green-100',
          textColor: 'text-green-700'
        };
      default:
        return {
          text: status,
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-700'
        };
    }
  };

  const { text, bgColor, textColor } = getBadgeConfig();

  if (!text) return null;

  return (
    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
      {text}
    </div>
  );
} 