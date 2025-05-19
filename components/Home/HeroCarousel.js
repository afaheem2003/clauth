'use client'

import React from "react";
import ClothingItemCard from "@/components/clothing/ClothingItemCard";
import clsx from 'clsx'

/**
 * Generic horizontal carousel
 *  – scroll-snap
 *  – smooth scrolling
 *  – scrollbar hidden on WebKit / Firefox
 */
export default function HeroCarousel({ items = [], cardWidth = 'w-56' }) {
  if (!items.length) return null

  return (
    <section className="py-8">
      <div className="px-4 sm:px-6">
        <div
          className={clsx(
            'flex gap-6 overflow-x-auto scroll-smooth',
            'snap-x snap-mandatory',
            // hide scrollbar
            'scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none]'
          )}
        >
          {items.map((p, index) => (
            <div
              key={p.id}
              className={clsx(cardWidth, 'shrink-0 snap-start')}
            >
              <ClothingItemCard clothingItem={p} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
