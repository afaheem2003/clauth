"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import ClothingItemCard from "@/components/clothing/ClothingItemCard";
import { formatCompactNumber } from "@/utils/formatters";
import AnimatedCard from "@/components/common/AnimatedCard";

export default function PublicProfilePage() {
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [clothingItems, setClothingItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchProfileAndItems() {
      setLoading(true);
      setError(null);
      try {
        // Fetch profile data
        const profileRes = await fetch(`/api/profile/${username}`);
        if (!profileRes.ok) {
          throw new Error("Failed to fetch profile");
        }
        const profileData = await profileRes.json();
        
        // The API returns { user: {...}, clothingItems: [...] }
        if (!profileData.user) {
          throw new Error("Profile not found");
        }
        setProfile(profileData.user);
        
        // The API already includes clothing items, no need for a second request
        if (profileData.clothingItems) {
          setClothingItems(profileData.clothingItems);
        }
      } catch (err) {
        console.error("Failed to fetch profile data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (username) {
      fetchProfileAndItems();
    }
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600"></div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Profile Not Found</h2>
          <p className="text-gray-600">The designer you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const displayName = profile.displayName || profile.name || username;
  const photoURL = profile.image || "/images/profile-placeholder.png";
  const totalLikes = clothingItems.reduce((sum, item) => sum + (item.likes?.length || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 py-10">
      <div className="container mx-auto px-4">
        {/* Profile Banner */}
        <div className="flex flex-col items-center gap-6 mb-12">
          <div className="relative">
            <div className="w-32 h-32 rounded-full overflow-hidden shadow-lg">
              <Image
                src={photoURL}
                alt={`${displayName}'s profile`}
                width={128}
                height={128}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">@{displayName}</h2>
            {profile.bio && (
              <p className="text-gray-600 max-w-2xl mx-auto">{profile.bio}</p>
            )}
          </div>

          {/* Stats */}
          <div className="flex justify-center gap-12 mt-4">
            <div className="text-center flex flex-col">
              <p className="text-4xl font-bold text-gray-900 mb-1">{formatCompactNumber(clothingItems.length)}</p>
              <p className="text-gray-500 text-sm uppercase tracking-wide">Creations</p>
            </div>
            <div className="text-center flex flex-col">
              <p className="text-4xl font-bold text-gray-900 mb-1">{formatCompactNumber(totalLikes)}</p>
              <p className="text-gray-500 text-sm uppercase tracking-wide">Likes</p>
            </div>
          </div>
        </div>

        {/* Designs Grid */}
        <div className="mt-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-8">
            {clothingItems.length > 0 ? (
              clothingItems.map((item) => (
                <AnimatedCard key={item.id}>
                  <ClothingItemCard clothingItem={item} />
                </AnimatedCard>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500 text-xl">
                  No designs published yet.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 