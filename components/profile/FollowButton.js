import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function FollowButton({ userId, initialIsFollowing = false }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [loading, setLoading] = useState(false);

  // Don't show button if viewing own profile
  if (session?.user?.uid === userId) {
    return null;
  }

  const handleFollow = async () => {
    if (!session) {
      router.push('/login');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/users/${userId}/follow`, {
        method: isFollowing ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) throw new Error('Failed to follow/unfollow');

      setIsFollowing(!isFollowing);
    } catch (error) {
      console.error('Error following/unfollowing:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleFollow}
      disabled={loading}
      className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
        isFollowing
          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          : 'bg-black text-white hover:bg-gray-900'
      } disabled:opacity-50`}
    >
      {loading ? 'Loading...' : isFollowing ? 'Following' : 'Follow'}
    </button>
  );
} 