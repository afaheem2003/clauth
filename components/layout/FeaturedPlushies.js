"use client";

import PlushieCard from "@/components/plushie/PlushieCard";
import HorizontalScrollContainer from "@/components/plushie/HorizontalScrollContainer";

export default function FeaturedPlushies() {
  return (
    <section className="bg-white py-16">
      <div className="container mx-auto px-6">
        <h2 className="text-4xl md:text-5xl font-bold text-center text-gray-800 mb-10">
          Featured Plushies
        </h2>

        <div className="w-full overflow-hidden relative">
          <HorizontalScrollContainer>
            <PlushieCard
              src="/images/plushie-1.png"
              name="Galaxy Dragon"
              desc="A cosmic-inspired plushie."
            />
            <PlushieCard
              src="/images/plushie-2.png"
              name="Bubble Bunny"
              desc="A cute bunny with pastel colors."
            />
            <PlushieCard
              src="/images/plushie-3.png"
              name="Robot Cat"
              desc="A futuristic cat plush."
            />
          </HorizontalScrollContainer>
        </div>
      </div>
    </section>
  );
}
