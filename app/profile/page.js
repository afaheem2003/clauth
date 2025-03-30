"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import PlushieCard from "@/components/plushie/PlushieCard";
import SavedPlushieCard from "@/components/plushie/SavedPlushieCard";

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [plushies, setPlushies] = useState([]);
  const [loading, setLoading] = useState(true);
  // activeTab: "published" means live designs; "saved" means drafts
  const [activeTab, setActiveTab] = useState("published");

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user) {
      router.push("/login");
      return;
    }
    async function fetchMyPlushies() {
      try {
        // This endpoint should return plushies where creator.id === session.user.uid
        const res = await fetch("/api/my-plushies");
        const data = await res.json();
        // Sort by creation date (newest first)
        const sortedPlushies = data.plushies.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        setPlushies(sortedPlushies);
      } catch (err) {
        console.error("Failed to fetch plushies:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchMyPlushies();
  }, [session, status, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg font-semibold">Loading...</p>
      </div>
    );
  }

  // Filter plushies based on active tab:
  // "published" => isPublished is true; "saved" => isPublished is false.
  const filteredPlushies = plushies.filter((p) =>
    activeTab === "saved" ? !p.isPublished : p.isPublished
  );

  const displayName = session?.user?.name || "Anonymous User";
  const photoURL = session?.user?.image || "/images/profile-placeholder.png";

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
            <p className="text-gray-600 mt-2">Welcome to your profile page!</p>
          </div>
        </div>

        {/* Toggle Buttons: Published appears first, then Saved */}
        <div className="mt-8 flex space-x-4">
          <button
            onClick={() => setActiveTab("published")}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              activeTab === "published"
                ? "bg-gray-900 text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
            }`}
          >
            Published Plushies
          </button>
          <button
            onClick={() => setActiveTab("saved")}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              activeTab === "saved"
                ? "bg-gray-900 text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
            }`}
          >
            Saved Plushies
          </button>
        </div>

        {/* Plushies Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-8 mt-8">
          {filteredPlushies.map((plushie) =>
            activeTab === "saved" ? (
              <SavedPlushieCard
                key={plushie.id}
                plushie={plushie}
                setPlushies={setPlushies}
              />
            ) : (
              <PlushieCard
                key={plushie.id}
                plushie={plushie}
                setPlushies={setPlushies}
              />
            )
          )}
        </div>
      </div>
    </div>
  );
}
