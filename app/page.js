"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/app/lib/firebaseClient";
import PlushieGeneratorModal from "@/components/layout/PlushieGeneratorModal";
import Footer from "@/components/common/Footer";
import AuthPromptModal from "@/components/common/AuthPromptModal";
import PlushieCard from "@/components/plushie/PlushieCard";
import Link from "next/link";
import Image from "next/image";

// Dummy plushies for scrolling animation
const SCROLLING_PLUSHIES = [
  "/images/plushie-placeholder.png",
  "/images/plushie-placeholder.png",
  "/images/plushie-placeholder.png",
  "/images/plushie-placeholder.png",
];

export default function HomePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  const handleCreateClick = () => {
    if (user) {
      setIsModalOpen(true);
    } else {
      setShowAuthPrompt(true);
    }
  };

  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col items-center justify-center overflow-hidden">
        {/* Scrolling Plushie Background */}
        <PlushieScroller />

        {/* Foreground Content */}
        <div className="container mx-auto px-6 py-16 text-center relative z-10">
          <h1 className="text-6xl md:text-7xl font-extrabold text-gray-800 mb-6 drop-shadow-sm">
            Welcome to Ploosh
          </h1>
          <p className="text-xl md:text-2xl text-gray-700 max-w-3xl mx-auto mb-8">
            Unleash your creativity and design custom AI-driven plushies. Join
            the community, vote on your favorites, and bring unique designs to
            life!
          </p>
          <button
            onClick={handleCreateClick}
            className="bg-gray-900 text-white text-xl font-semibold rounded-full px-8 py-4 shadow-lg hover:bg-gray-700 transition-colors"
          >
            Create Your Plushie
          </button>
        </div>
      </section>

      {/* Featured Plushies Section (Unchanged) */}
      <section className="py-12 bg-gray-100">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-gray-800 mb-6 text-center">
            Featured Plushies
          </h2>
          <div className="flex space-x-6 overflow-x-auto pb-4">
            {SCROLLING_PLUSHIES.map((image, index) => (
              <PlushieCard key={index} plushie={{ image }} />
            ))}
          </div>
        </div>
      </section>

      {/* Discover Section (Unchanged) */}
      <section className="bg-gray-100 py-16 text-center">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-semibold text-gray-800 mb-4">
            Ready to Explore More?
          </h2>
          <p className="text-lg text-gray-600 mb-6">
            Discover AI-generated plushies and vote for your favorites!
          </p>
          <Link
            href="/discover"
            className="bg-gray-900 text-white text-xl font-semibold rounded-full px-8 py-4 shadow-lg hover:bg-gray-700 transition-colors"
          >
            Discover Plushies
          </Link>
        </div>
      </section>

      {/* Footer */}
      <Footer />

      {/* Modals */}
      {isModalOpen && (
        <PlushieGeneratorModal onClose={() => setIsModalOpen(false)} />
      )}
      {showAuthPrompt && (
        <AuthPromptModal onClose={() => setShowAuthPrompt(false)} />
      )}
    </>
  );
}

function PlushieScroller() {
  const [screenWidth, setScreenWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1920
  );

  useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const NUM_ROWS = 4;
  const PLUSHIE_SIZE = Math.min(screenWidth / 10, 160);
  const GAP_BETWEEN = PLUSHIE_SIZE * 0.75;
  const PLUSHIES_PER_ROW = Math.ceil(
    screenWidth / (PLUSHIE_SIZE + GAP_BETWEEN)
  );

  const BASE_SPEED = 1;

  const [plushies, setPlushies] = useState(() =>
    Array.from({ length: NUM_ROWS * PLUSHIES_PER_ROW }, (_, i) => ({
      id: `plushie-${i}`,
      x: (i % PLUSHIES_PER_ROW) * (PLUSHIE_SIZE + GAP_BETWEEN),
      y: Math.floor(i / PLUSHIES_PER_ROW) * (PLUSHIE_SIZE + 80),
      speed: BASE_SPEED + Math.floor(i / PLUSHIES_PER_ROW) * 0.15,
    }))
  );

  useEffect(() => {
    let animationFrame;
    const updatePositions = () => {
      setPlushies((prevPlushies) =>
        prevPlushies.map((plushie) => {
          let newX = plushie.x - plushie.speed;
          if (newX < -PLUSHIE_SIZE - 5) {
            newX = screenWidth;
          }
          return { ...plushie, x: newX };
        })
      );
      animationFrame = requestAnimationFrame(updatePositions);
    };
    animationFrame = requestAnimationFrame(updatePositions);
    return () => cancelAnimationFrame(animationFrame);
  }, [screenWidth]);

  return (
    <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
      {plushies.map(({ id, x, y }) => (
        <div
          key={id}
          className="absolute"
          style={{
            width: `${PLUSHIE_SIZE}px`,
            height: `${PLUSHIE_SIZE}px`,
            transform: `translate(${x}px, ${y}px)`,
          }}
        >
          <Image
            src="/images/plushie-placeholder.png"
            alt="Plushie"
            fill
            className="object-cover"
          />
        </div>
      ))}
    </div>
  );
}
