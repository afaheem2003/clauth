'use client';

import { useState } from 'react';
import clsx          from 'clsx';

/**
 * Header (site-wide)
 * ──────────────────────────────────────────────────────────────
 * @prop {boolean} showSearch – display the centred search bar   (default = true)
 * @prop {boolean} showLogo   – display the left-hand logo text  (default = true)
 */
export default function Header({ showSearch = true, showLogo = true }) {
  const [q, setQ] = useState('');

  return (
    <header className="bg-white border-b sticky top-0 z-40">
      <div
        className={clsx(
          'container mx-auto px-6 py-3 flex items-center',
          // centre search bar if the logo is hidden
          showSearch && !showLogo && 'justify-center'
        )}
      >
        {showLogo && (
          <span className="text-2xl font-extrabold text-gray-900 mr-6">
            Clauth
          </span>
        )}

        {showSearch && (
          <div
            className={clsx(
              'relative transition-all duration-200',
              'w-full max-w-xl',
              showLogo ? 'mx-auto' : '' // already centred if no logo
            )}
          >
            <input
              type="text"
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search clothing, designers…"
              className="
                w-full bg-gray-100 text-gray-900 placeholder-gray-600
                rounded-full pl-4 pr-14 py-2 shadow-sm
                focus:outline-none focus:ring-2 focus:ring-blue-500
              "
            />
            <button
              className="
                absolute right-1 top-1/2 -translate-y-1/2
                bg-blue-600 hover:bg-blue-700 text-white
                text-sm rounded-full px-4 py-1 transition
              "
            >
              Search
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
