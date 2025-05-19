'use client';

import { useEffect, useState } from 'react';
// Removed useRouter as it's not directly used in the copied logic, 
// but can be re-added if navigation is needed from here.
// import { useRouter } from 'next/navigation'; 
import Image from 'next/image';
// import Link from 'next/link'; // Not used in the direct JSX copied, can be re-added if needed
import ClothingItemCard from '@/components/clothing/ClothingItemCard';
// fetchUserProfile is no longer directly called from client, but kept if needed for other client-side logic later (unlikely for this component)
// import { fetchUserProfile } from '@/lib/fetchUserProfile'; 

export default function UserProfileClient({ profileIdentifier, initialData }) {
  // const router = useRouter(); // Re-add if needed
  
  const [user, setUser] = useState(initialData?.user || null);
  const [clothingItems, setClothingItems] = useState(initialData?.clothingItems || []);
  // If initialData contains an error property, it means server-side fetch failed.
  const [loading, setLoading] = useState(!initialData || (initialData && !initialData.error && !initialData.user && profileIdentifier)); 
  const [error, setError] = useState(initialData?.error || null);

  useEffect(() => {
    // Only fetch if initialData was not provided, or if it was but indicated an error, 
    // or if it was empty and we still have a profileIdentifier (e.g. server returned null for non-error empty case)
    // However, with the current server component logic, initialData should always exist.
    // This useEffect might become redundant if server always provides sufficient initialData (user or error).
    if (initialData && (initialData.user || initialData.error)) {
        // Data or an error was already provided by the server
        if(initialData.user) setUser(initialData.user);
        if(initialData.clothingItems) setClothingItems(initialData.clothingItems);
        if(initialData.error) setError(initialData.error);
        setLoading(false);
        return;
    }

    // Fallback or re-fetch logic (currently might not be hit if server component is robust)
    // For now, we assume initialData is the source of truth from the server load.
    // If profileIdentifier changes and we need to re-fetch on client, this logic would be different.
    // Given the page structure (profileIdentifier comes from URL, page reloads), 
    // this client-side fetch might be entirely removed if server pre-fetching is complete.

    // Example of how a client-side fetch would look if it were still needed:
    /*
    if (!profileIdentifier) {
        setError('Profile identifier is missing.');
        setLoading(false);
        return;
    }
    async function loadProfile() {
      setLoading(true);
      setError(null);
      try {
        // This would call an API route, not fetchUserProfile directly
        // const res = await fetch(`/api/user-profile/${profileIdentifier}`);
        // if (!res.ok) throw new Error('Failed to fetch from API');
        // const data = await res.json(); 
        // setUser(data.user);
        // setClothingItems(data.clothingItems || []);
        setError('Client-side fetching not implemented post-SSR data.'); // Placeholder
      } catch (err) {
        console.error("Error fetching profile on client:", err);
        setError(err.message || 'Failed to load profile.');
        setUser(null);
        setClothingItems([]);
      }
      setLoading(false);
    }
    // loadProfile(); 
    */

  }, [profileIdentifier, initialData]); // Depend on initialData to re-evaluate if it changes

  if (loading) return <div className="text-center py-12"><p>Loading profile...</p></div>;
  // Error from server or client-side fetch attempt
  if (error) return <div className="text-center py-12 text-red-500"><p>{error}</p></div>; 
  // If no error, but user is still null after server attempt (should be handled by initialData.error or a specific message)
  if (!user) {
    // This matches the old structure's not found page style more closely
    return (
      <div className="h-screen flex items-center justify-center text-center">
        <div>
          <h1 className="text-4xl font-bold mb-2">Oops!</h1>
          <p className="text-gray-600">User not found.</p>
        </div>
      </div>
    );
  }

  // Prioritize displayName, then name, then a fallback from email or generic 'User'
  const displayName = user.displayName || user.name || (user.email ? user.email.split('@')[0] : 'Anonymous');
  const photoURL = user.image || '/images/profile-placeholder.png'; // Using photoURL to match old var name

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-10">
      <div className="container mx-auto px-4">
        {/* Profile Info - matches old structure */}
        <div className="bg-white rounded-lg shadow p-6 flex flex-col md:flex-row items-center md:items-start md:space-x-6">
          <Image
            src={photoURL}
            alt={`${displayName}'s profile picture`}
            width={128} 
            height={128}
            className="rounded-full object-cover border border-gray-200"
          />
          <div className="mt-4 md:mt-0">
            <h2 className="text-2xl font-bold text-gray-800">{displayName}</h2>
            <p className="text-gray-600 mt-2">
              {user.bio || `These are ${displayName}'s published clothing designs!`}
            </p>
          </div>
        </div>

        {/* Published Clothing Items - matches old structure */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-8 mt-8">
          {clothingItems.length > 0 ? (
            clothingItems.map((item) => (
              <ClothingItemCard key={item.id} clothingItem={item} />
            ))
          ) : (
            <p className="text-center text-gray-500 col-span-full">
              No published clothing items yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
} 