'use client';

import BigSpinner from './BigSpinner'; // Assuming BigSpinner is in the same common/ directory

export default function Button({
  children,
  onClick,
  type = 'button',
  primary = false,
  secondary = false,
  danger = false,
  disabled = false,
  loading = false,
  fullWidth = false,
  className = '',
  ...props // To pass any other native button attributes like 'aria-label'
}) {
  const baseClasses =
    'inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-150';

  let variantClasses = '';
  if (primary) {
    variantClasses = 'bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500';
  } else if (secondary) {
    variantClasses = 'bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-gray-400';
  } else if (danger) {
    variantClasses = 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500';
  } else {
    // Default/unstyled or link-like button if no variant is specified
    variantClasses = 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500 border-gray-300';
  }

  const disabledClasses = disabled || loading ? 'opacity-60 cursor-not-allowed' : '';
  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${
        baseClasses
      } ${variantClasses} ${disabledClasses} ${widthClass} ${className}`.trim()}
      {...props}
    >
      {loading && <BigSpinner className="-ml-1 mr-2 h-4 w-4" />}
      {children}
    </button>
  );
} 