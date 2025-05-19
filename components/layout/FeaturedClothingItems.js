"use client";

import ClothingItemCard from "@/components/clothing/ClothingItemCard";
import HorizontalScrollContainer from "@/components/clothing/HorizontalScrollContainer";

export default function FeaturedClothingItems() {
  return (
    <section className="bg-white py-16">
      <div className="container mx-auto px-6">
        <h2 className="text-4xl md:text-5xl font-bold text-center text-gray-800 mb-10">
          Featured Clothing Items
        </h2>

        <div className="w-full overflow-hidden relative">
          <HorizontalScrollContainer>
            <ClothingItemCard
              src="/images/clothing-item-1.png"
              name="Galaxy Hoodie"
              desc="A cosmic-inspired hoodie."
            />
            <ClothingItemCard
              src="/images/clothing-item-2.png"
              name="Pastel Dream Dress"
              desc="A flowing dress with pastel gradients."
            />
            <ClothingItemCard
              src="/images/clothing-item-3.png"
              name="Urban Tech Jacket"
              desc="A sleek jacket with a futuristic design."
            />
          </HorizontalScrollContainer>
        </div>
      </div>
    </section>
  );
}
