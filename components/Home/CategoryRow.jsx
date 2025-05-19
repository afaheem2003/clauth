'use client'

import Link from 'next/link'
import ClothingItemCard from '@/components/clothing/ClothingItemCard'
import clsx        from 'clsx'

export default function CategoryRow ({ title, items = [] }) {
  if (!items.length) return null

  return (
    <div className="py-6">
      <h3 className="text-2xl font-semibold mb-4">{title}</h3>

      <div
        className={clsx(
          'flex gap-4 overflow-x-auto scroll-smooth',
          'snap-x snap-mandatory',
          'scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none]'
        )}
      >
        {items.map(p => (
          <div key={p.id} className="flex-[0_0_auto] w-72 h-auto mr-5 last:mr-0">
            <ClothingItemCard clothingItem={p} />
          </div>
        ))}
      </div>
    </div>
  )
}
