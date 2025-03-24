"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/app/lib/firebaseClient"; // Adjust if needed
import PlushieCard from "./PlushieCard";

// Example placeholders for plushies
const savedPlushiesPlaceholder = [
  {
    id: 1,
    title: "Galaxy Dragon",
    description: "A cosmic plush with stars.",
    imageUrl: "/images/plushie-placeholder.png",
  },
  {
    id: 2,
    title: "Rainbow Unicorn",
    description: "Bright, colorful, sparkly plush!",
    imageUrl: "/images/plushie-placeholder.png",
  },
];

const publishedPlushiesPlaceholder = [
  {
    id: 3,
    title: "Robot Cat",
    description: "Futuristic kitty plush.",
    imageUrl: "/images/plushie-placeholder.png",
  },
];

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("saved");

  useEffect(() => {
    // Check if user is logged in
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (!currentUser) {
        router.push("/login"); // Not logged in → redirect
      } else {
        setUser(currentUser);
      }
    });
    return () => unsubscribe();
  }, [router]);

  if (!user) {
    // Show a loading screen while checking auth
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg font-semibold">Loading...</p>
      </div>
    );
  }

  // Dummy user info from Firebase
  const displayName = user.displayName || "Anonymous User";
  const photoURL = user.photoURL || "/images/profile-placeholder.png";

  // Toggling between saved & published plushies
  const isSavedTab = activeTab === "saved";
  const plushiesToDisplay = isSavedTab
    ? savedPlushiesPlaceholder
    : publishedPlushiesPlaceholder;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-10">
      <div className="container mx-auto px-4">
        {/* User Info Section */}
        <div className="bg-white rounded-lg shadow p-6 flex flex-col md:flex-row items-center md:items-start md:space-x-6">
          <img
            src={photoURL}
            alt="Profile"
            className="w-32 h-32 rounded-full object-cover border border-gray-200"
          />
          <div className="mt-4 md:mt-0">
            <h2 className="text-2xl font-bold text-gray-800">{displayName}</h2>
            <p className="text-gray-600 mt-2">
              Welcome to your profile page!
              {/* Add more user details here if desired */}
            </p>
          </div>
        </div>

        {/* Toggle Buttons for Saved vs Published */}
        <div className="mt-8 flex space-x-4">
          <button
            onClick={() => setActiveTab("saved")}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              isSavedTab
                ? "bg-gray-900 text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
            }`}
          >
            Saved Plushies
          </button>
          <button
            onClick={() => setActiveTab("published")}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              !isSavedTab
                ? "bg-gray-900 text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
            }`}
          >
            Published Plushies
          </button>
        </div>

        {/* Plushies Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-8">
          {plushiesToDisplay.map((plushie) => (
            <PlushieCard
              key={plushie.id}
              title={plushie.title}
              description={plushie.description}
              imageUrl={plushie.imageUrl}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
