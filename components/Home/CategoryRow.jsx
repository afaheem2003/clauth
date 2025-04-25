'use client'

import PlushieCard from '@/components/plushie/PlushieCard'
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
          <div key={p.id} className="w-48 shrink-0 snap-start">
            <PlushieCard plushie={p} />
          </div>
        ))}
      </div>
    </div>
  )
}
