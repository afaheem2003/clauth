"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import PlushieGeneratorModal from "@/components/layout/PlushieGeneratorModal";
import Footer from "@/components/common/Footer";
import AuthPromptModal from "@/components/common/AuthPromptModal";
import PlushieCard from "@/components/plushie/PlushieCard";
import Link from "next/link";

const SCROLLING_PLUSHIES = [
  "/images/plushie-placeholder.png",
  "/images/plushie-placeholder.png",
  "/images/plushie-placeholder.png",
  "/images/plushie-placeholder.png",
];

export default function HomePage() {
  const { data: session } = useSession();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  const handleCreateClick = () => {
    if (session?.user) {
      setIsModalOpen(true);
    } else {
      setShowAuthPrompt(true);
    }
  };

  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col items-center justify-center">
        <div className="container mx-auto px-6 py-16 text-center">
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

      {/* Featured Plushies Section */}
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

      {/* Discover Section */}
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
