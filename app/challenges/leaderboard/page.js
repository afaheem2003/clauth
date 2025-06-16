'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon, TrophyIcon, StarIcon, UsersIcon } from '@heroicons/react/24/outline';

export default function LeaderboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const challengeId = searchParams.get('challengeId');
  
  const [leaderboard, setLeaderboard] = useState([]);
  const [roomInfo, setRoomInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      if (!challengeId) {
        setError('Challenge ID is required');
        setLoading(false);
        return;
      }
      fetchLeaderboard();
    }
  }, [status, challengeId, router]);

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch(`/api/challenges/leaderboard?challengeId=${challengeId}`);
      
      if (!response.ok) {
        setError('Failed to load leaderboard');
        return;
      }

      const data = await response.json();
      setLeaderboard(data.leaderboard || []);
      setRoomInfo(data.roomInfo);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      setError('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Oops!</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/challenges"
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to Challenges
          </Link>
        </div>
      </div>
    );
  }

  const getRankIcon = (rank) => {
    if (rank === 1) return <TrophyIcon className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <TrophyIcon className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <TrophyIcon className="w-6 h-6 text-amber-600" />;
    return <span className="w-6 h-6 flex items-center justify-center text-gray-600 font-bold">#{rank}</span>;
  };

  const getRankBadge = (rank) => {
    if (rank === 1) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (rank === 2) return 'bg-gray-100 text-gray-800 border-gray-200';
    if (rank === 3) return 'bg-amber-100 text-amber-800 border-amber-200';
    if (rank <= 10) return 'bg-blue-100 text-blue-800 border-blue-200';
    return 'bg-green-100 text-green-800 border-green-200';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/challenges"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to Challenges
          </Link>
          
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white mb-6">
            <div className="flex items-center mb-2">
              <TrophyIcon className="w-8 h-8 mr-3" />
              <h1 className="text-2xl font-bold">Room Leaderboard</h1>
            </div>
            <p className="opacity-90">
              Top 25% of eligible participants in your competition room
            </p>
            {roomInfo && (
              <div className="mt-3 flex items-center space-x-4 text-sm opacity-90">
                <div className="flex items-center">
                  <UsersIcon className="w-4 h-4 mr-1" />
                  <span>Room {roomInfo.roomNumber}</span>
                </div>
                <span>•</span>
                <span>{roomInfo.participantCount} participants</span>
                <span>•</span>
                <span>{roomInfo.submissionCount} submissions</span>
              </div>
            )}
          </div>
        </div>

        {/* Leaderboard */}
        {leaderboard.length > 0 ? (
          <div className="space-y-4">
            {leaderboard.map((entry, index) => (
              <div
                key={entry.id}
                className={`bg-white rounded-lg shadow-sm border-2 p-6 transition-all hover:shadow-md ${getRankBadge(entry.rank)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {/* Rank Icon */}
                    <div className="flex-shrink-0">
                      {getRankIcon(entry.rank)}
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-gray-900">
                          {entry.user.displayName || entry.user.name}
                        </h3>
                        <span className="text-sm text-gray-500">
                          @{entry.group.handle}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mt-1 italic">
                        "{entry.outfitDescription}"
                      </p>
                      
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        <span>{entry.group.name}</span>
                        <span>• {new Date(entry.submittedAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Design Preview */}
                    {entry.generatedImageUrl && (
                      <div className="hidden md:block w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                        <img
                          src={entry.generatedImageUrl}
                          alt="Design"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>

                  {/* Score */}
                  <div className="text-right">
                    <div className="flex items-center space-x-1">
                      <StarIcon className="w-4 h-4 text-yellow-500" />
                      <span className="text-lg font-bold text-gray-900">
                        {entry.upvotes}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">upvotes</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <TrophyIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Rankings Yet</h3>
            <p className="text-gray-600">
              No eligible submissions found in your competition room.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Participants need to upvote 3+ submissions in their room to be eligible for rankings.
            </p>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">How Room Rankings Work</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• You compete against 20-30 other participants in your assigned room</li>
            <li>• Only participants who upvoted 3+ other submissions in their room are eligible</li>
            <li>• Rankings are based on upvotes received from room participants</li>
            <li>• Only the top 25% of eligible participants in your room are shown</li>
            <li>• Ties are broken by submission time (earlier submissions rank higher)</li>
            <li>• Room assignments rotate for each new challenge</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 