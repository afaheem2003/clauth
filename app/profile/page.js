"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import ClothingItemCard from "@/components/clothing/ClothingItemCard";
import SavedClothingItemCard from "@/components/clothing/SavedClothingItemCard";
import Link from "next/link";
import { PencilIcon } from "@heroicons/react/24/solid";
import { HangerIcon } from "@/components/icons/HangerIcon";
import { DrawerIcon } from "@/components/icons/DrawerIcon";
import AnimatedCard from "@/components/common/AnimatedCard";

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, status, update } = useSession();
  const [activeTab, setActiveTab] = useState("published");
  const [clothingItems, setClothingItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bio, setBio] = useState("");
  const [isSavingBio, setIsSavingBio] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user) {
      router.push("/login");
      return;
    }
    setBio(session.user.bio || "");
    fetchMyClothingItems();
  }, [session, status, router]);

  async function fetchMyClothingItems() {
    setLoading(true);
    try {
      const res = await fetch("/api/my-clothing-items");
      if (!res.ok) throw new Error("Failed to fetch data");
      const data = await res.json();
      const sortedClothingItems = data.clothingItems.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      setClothingItems(sortedClothingItems);
    } catch (err) {
      console.error("Failed to fetch clothing items:", err);
      setClothingItems([]);
    }
    setLoading(false);
  }

  const handleSaveBio = async () => {
    setIsSavingBio(true);
    try {
      const res = await fetch('/api/bio', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bio }),
      });
      
      if (!res.ok) throw new Error('Failed to update bio');
      
      if (typeof update === 'function') {
        await update({ bio });
      }
      setIsEditingBio(false);
    } catch (error) {
      console.error('Failed to save bio:', error);
    } finally {
      setIsSavingBio(false);
    }
  };

  if (status === "loading") {
    return <p className="text-center py-10">Loading profile...</p>;
  }
  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6">
        <p className="text-2xl text-gray-700 mb-4">Please log in to view your profile.</p>
        <Link href="/login" legacyBehavior>
          <a className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors">
            Log In
          </a>
        </Link>
      </div>
    );
  }

  const filteredClothingItems = clothingItems.filter((item) =>
    activeTab === "published" ? item.isPublished : !item.isPublished
  );

  const displayName = session?.user?.name || "Anonymous User";
  const photoURL = session?.user?.image || "/images/profile-placeholder.png";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 py-10">
      <div className="container mx-auto px-4">
        {/* Profile Banner */}
        <div className="flex items-center gap-6 mb-12">
          <div className="relative shrink-0">
            <div className="w-24 h-24 rounded-full overflow-hidden shadow-lg">
              <img
                src={photoURL}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <div className="flex-grow">
            <h2 className="text-2xl font-bold text-gray-800 mb-1">{displayName}</h2>
            <div className="relative group">
              {isEditingBio ? (
                <div className="flex items-end gap-2">
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full p-2 text-gray-600 bg-transparent border-b-2 border-indigo-200 focus:border-indigo-600 focus:outline-none placeholder-gray-400 resize-none"
                    rows={2}
                    placeholder="Tell others about your style..."
                  />
                  <div className="flex gap-2 mb-1">
                    <button
                      onClick={handleSaveBio}
                      disabled={isSavingBio}
                      className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      {isSavingBio ? "Saving..." : "Save"}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingBio(false);
                        setBio(session.user.bio || "");
                      }}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="group relative">
                  <p className="text-gray-600 pr-8">
                    {bio || "Welcome to your wardrobe! Tell others about your style..."}
                  </p>
                  <button
                    onClick={() => setIsEditingBio(true)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <PencilIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex justify-center space-x-6 mb-8">
          <button
            onClick={() => setActiveTab("published")}
            className={`flex items-center px-6 py-3 font-semibold transition-all ${
              activeTab === "published"
                ? "text-indigo-600 border-b-2 border-indigo-600"
                : "text-gray-600 hover:text-indigo-600"
            }`}
          >
            <HangerIcon className={`w-5 h-5 mr-2 ${activeTab === "published" ? "text-indigo-600" : "text-gray-500"}`} />
            Published Items
          </button>
          <button
            onClick={() => setActiveTab("saved")}
            className={`flex items-center px-6 py-3 font-semibold transition-all ${
              activeTab === "saved"
                ? "text-indigo-600 border-b-2 border-indigo-600"
                : "text-gray-600 hover:text-indigo-600"
            }`}
          >
            <DrawerIcon className={`w-5 h-5 mr-2 ${activeTab === "saved" ? "text-indigo-600" : "text-gray-500"}`} />
            Saved Drafts
          </button>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-12">
          {loading ? (
            <div className="col-span-full flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600"></div>
            </div>
          ) : filteredClothingItems.length > 0 ? (
            filteredClothingItems.map((item) =>
              activeTab === "saved" ? (
                <AnimatedCard key={item.id}>
                  <SavedClothingItemCard
                    clothingItem={item}
                    setClothingItems={setClothingItems}
                  />
                </AnimatedCard>
              ) : (
                <AnimatedCard key={item.id}>
                  <ClothingItemCard
                    clothingItem={item}
                  />
                </AnimatedCard>
              )
            )
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500 text-xl">
                {activeTab === "published"
                  ? "Your wardrobe is empty! Time to showcase your designs."
                  : "No drafts in your drawer. Start creating!"
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
