'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

import Header from '@/components/layout/Header';
import HeroCarousel from '@/components/Home/HeroCarousel';
import Footer from '@/components/common/Footer';
import ClothingItemGeneratorModal from '@/components/layout/ClothingItemGeneratorModal';
import AuthPromptModal from '@/components/common/AuthPromptModal';

const heroPanelsDesktop = [
  {
    img: '/images/homepage/background1.png',
    heading: 'Ready to find your style?',
    cta: 'Browse the latest creator-generated clothing',
  },
  {
    img: '/images/homepage/background2.png',
    heading: 'Lose yourself in Clauth joy…',
    cta: 'Explore top-voted community creations',
  },
  {
    img: '/images/homepage/background3.png',
    heading: 'Ready to design your own?',
    cta: 'Design Your Clothing',
    highlightCreate: true,
  },
];

const heroPanelsMobile = [
  {
    img: '/images/homepage/background_mobile1.png',
    heading: 'Looking for a new look?',
    cta: 'Discover our latest Clothing',
  },
  {
    img: '/images/homepage/background_mobile2.png',
    heading: 'Lose yourself in Clauth joy…',
    cta: 'Browse community favourites',
  },
  {
    img: '/images/homepage/background_mobile3.png',
    heading: 'Ready to design your own?',
    cta: 'Design Your Clothing',
    highlightCreate: true,
  },
];

export default function HomeClient({ featured = [], almostThere = [], trending = [] }) {
  const { data: session } = useSession();
  const [showGen, setShowGen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const onCreate = () => (session ? setShowGen(true) : setShowAuth(true));

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const heroPanels = isMobile ? heroPanelsMobile : heroPanelsDesktop;

  return (
    <>
      {/* ---------------- HERO (scroll-snap) ---------------- */}
      <section className="h-screen overflow-y-scroll snap-y snap-mandatory scroll-smooth">
        {heroPanels.map((p, i) => (
          <div
            key={i}
            className="snap-start h-screen relative flex items-center justify-center text-white"
            style={{
              backgroundImage: `url('${p.img}')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className="absolute inset-0 bg-black/30" />
            <div className="relative z-10 text-center px-4">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 drop-shadow">{p.heading}</h1>
              {p.highlightCreate ? (
                <button
                  onClick={onCreate}
                  className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full transition"
                >
                  {p.cta}
                </button>
              ) : (
                <Link
                  href="/discover"
                  className="inline-block bg-white/90 hover:bg-white text-gray-900 px-8 py-3 rounded-full backdrop-blur transition"
                >
                  {p.cta} &rarr;
                </Link>
              )}
            </div>
          </div>
        ))}
      </section>

      {/* --------- FEATURED / ALMOST THERE / TRENDING ---------- */}
      {featured.length > 0 && (
        <section className="py-12 bg-gray-50">
          <div className="container mx-auto px-6">
            <h2 className="text-3xl font-semibold text-gray-900 text-center mb-6">
              Featured Clothing Items
            </h2>
            <HeroCarousel items={featured} />
          </div>
        </section>
      )}

      {almostThere.length > 0 && (
        <section className="py-12 bg-gray-50">
          <div className="container mx-auto px-6">
            <h2 className="text-3xl font-semibold text-gray-900 text-center mb-6">
              Almost&nbsp;There&nbsp;&mdash;&nbsp;Help These Designs Come to Life
            </h2>
            <HeroCarousel items={almostThere} />
          </div>
        </section>
      )}

      {trending.length > 0 && (
        <section className="py-12 bg-gray-50">
          <div className="container mx-auto px-6">
            <h2 className="text-3xl font-semibold text-gray-900 text-center mb-6">
              Trending&nbsp;Now
            </h2>
            <HeroCarousel items={trending} />
          </div>
        </section>
      )}

      <Footer />

      {showGen && <ClothingItemGeneratorModal onClose={() => setShowGen(false)} />}
      {showAuth && <AuthPromptModal onClose={() => setShowAuth(false)} />}
    </>
  );
}
