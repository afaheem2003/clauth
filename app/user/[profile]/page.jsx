// app/user/[profile]/page.jsx
// REMOVED 'use client'; - This will now be a Server Component

import { fetchUserProfile } from '@/lib/fetchUserProfile'; // Keep for generateMetadata or if we fetch server-side later
import UserProfileClient from './UserProfileClient'; // New client component to be created

// generateMetadata can stay here as this is now a Server Component
export async function generateMetadata({ params }) {
  const { profile } = params;
  const userProfileData = await fetchUserProfile(profile).catch(() => null);
  const titleName = userProfileData?.user?.displayName || userProfileData?.user?.name || profile;
  return { title: `${titleName}'s Clauth Profile` };
}

// This Server Component will pass params to the Client Component
export default async function UserProfilePage({ params }) {
  const { profile } = params;
  const initialProfileData = await fetchUserProfile(profile).catch(err => {
    console.error("[UserProfilePage Server Component] Error fetching profile:", err);
    // Return a structure that UserProfileClient can understand as an error or empty state
    return { user: null, clothingItems: [], error: err.message || 'Failed to load profile data on server.' }; 
  });

  return <UserProfileClient profileIdentifier={profile} initialData={initialProfileData} />;
}
