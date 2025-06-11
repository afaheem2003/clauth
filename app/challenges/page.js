'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PlusIcon, UserGroupIcon, TrophyIcon, CalendarIcon } from '@heroicons/react/24/outline';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

// Extend dayjs with timezone support
dayjs.extend(utc);
dayjs.extend(timezone);

export default function ChallengesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [groups, setGroups] = useState([]);
  const [currentChallenge, setCurrentChallenge] = useState(null);
  const [topSubmissions, setTopSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  const EASTERN_TIMEZONE = 'America/New_York';

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      fetchData();
    }
  }, [status, router]);

  const fetchData = async () => {
    try {
      const [groupsResponse, challengeResponse, topSubmissionsResponse] = await Promise.all([
        fetch('/api/challenges/groups/my'),
        fetch('/api/challenges/current'),
        fetch('/api/challenges/current/top-submissions')
      ]);

      if (groupsResponse.ok) {
        const groupsData = await groupsResponse.json();
        setGroups(groupsData.groups || []);
      }

      if (challengeResponse.ok) {
        const challengeData = await challengeResponse.json();
        setCurrentChallenge(challengeData.challenge);
      }

      if (topSubmissionsResponse.ok) {
        const topSubmissionsData = await topSubmissionsResponse.json();
        setTopSubmissions(topSubmissionsData.submissions || []);
      }
    } catch (error) {
      console.error('Error fetching challenge data:', error);
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Fashion Challenges</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Join groups with friends, take on daily challenges, and share your creative outfits together
          </p>
        </div>

        {/* Current Challenge Banner */}
        {currentChallenge && (
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 mb-8 text-white">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2">Today's Challenge</h2>
                {currentChallenge.mainItem && (
                  <p className="text-lg mb-2">
                    <span className="font-semibold">Item:</span> {currentChallenge.mainItem}
                  </p>
                )}
                <p className="text-lg mb-4">
                  <span className="font-semibold">Theme:</span> {currentChallenge.theme}
                </p>
                <p className="text-sm opacity-90 mb-6">
                  Submissions close at {dayjs.utc(currentChallenge.submissionDeadline).tz(EASTERN_TIMEZONE).format('h:mm A')} ET
                </p>
                
                {/* Call to Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/design"
                    className="inline-flex items-center px-6 py-3 bg-white text-indigo-600 rounded-lg hover:bg-gray-50 transition-colors font-semibold shadow-sm"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    Design with AI
                  </Link>
                  <Link
                    href="/challenges/past"
                    className="inline-flex items-center px-6 py-3 bg-white bg-opacity-20 text-white rounded-lg hover:bg-opacity-30 transition-colors font-semibold"
                  >
                    <TrophyIcon className="w-5 h-5 mr-2" />
                    View Past Challenges
                  </Link>
                </div>
              </div>
              <div className="flex items-center ml-6">
                <CalendarIcon className="w-16 h-16 opacity-80" />
              </div>
            </div>
          </div>
        )}

        {/* Top Submissions for Current Challenge */}
        {currentChallenge && topSubmissions.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Top Submissions Today</h2>
              <Link
                href="/challenges/past"
                className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
              >
                View All →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {topSubmissions.slice(0, 6).map((submission, index) => (
                <div key={submission.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                  {submission.generatedImageUrl && (
                    <div className="aspect-square relative">
                      <img
                        src={submission.generatedImageUrl}
                        alt="Top submission"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-3 left-3">
                        <div className="bg-white rounded-full px-2 py-1 text-xs font-semibold text-gray-900 shadow-sm">
                          #{index + 1}
                        </div>
                      </div>
                      <div className="absolute top-3 right-3">
                        <div className="bg-red-500 rounded-full px-2 py-1 text-xs font-semibold text-white shadow-sm flex items-center">
                          ❤️ {submission.upvoteCount || 0}
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-xs font-medium text-gray-600">
                          {(submission.user.displayName || submission.user.name)?.charAt(0)?.toUpperCase()}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {submission.user.displayName || submission.user.name}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2 italic">
                      "{submission.outfitDescription}"
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link
            href="/challenges/create-group"
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center">
              <div className="bg-indigo-100 rounded-lg p-3 group-hover:bg-indigo-200 transition-colors">
                <PlusIcon className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="ml-4">
                <h3 className="font-semibold text-gray-900">Create Group</h3>
                <p className="text-sm text-gray-600">Start a new challenge group</p>
              </div>
            </div>
          </Link>

          <Link
            href="/challenges/join"
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center">
              <div className="bg-green-100 rounded-lg p-3 group-hover:bg-green-200 transition-colors">
                <UserGroupIcon className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="font-semibold text-gray-900">Join Group</h3>
                <p className="text-sm text-gray-600">Connect with friends</p>
              </div>
            </div>
          </Link>

          <Link
            href="/challenges/past"
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center">
              <div className="bg-purple-100 rounded-lg p-3 group-hover:bg-purple-200 transition-colors">
                <TrophyIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <h3 className="font-semibold text-gray-900">Past Challenges</h3>
                <p className="text-sm text-gray-600">Browse previous competitions</p>
              </div>
            </div>
          </Link>
        </div>

        {/* My Groups */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">My Groups ({groups.length})</h2>
          </div>

          {groups.length === 0 ? (
            <div className="text-center py-12">
              <UserGroupIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No groups yet</h3>
              <p className="text-gray-600 mb-6">Create or join a group to start sharing challenges with friends</p>
              <div className="flex justify-center space-x-4">
                <Link
                  href="/challenges/create-group"
                  className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Create Group
                </Link>
                <Link
                  href="/challenges/join"
                  className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Join Group
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groups.map((group) => (
                <GroupCard key={group.id} group={group} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function GroupCard({ group }) {
  const memberCount = group.members?.length || 0;
  const hasSubmittedToday = group.userSubmittedToday || false;

  return (
    <Link
      href={`/challenges/groups/@${group.handle}`}
      className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors border border-gray-200"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-gray-900 truncate">{group.name}</h3>
        <div className="flex items-center text-sm text-gray-600">
          <UserGroupIcon className="w-4 h-4 mr-1" />
          {memberCount}
        </div>
      </div>
      
      {group.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{group.description}</p>
      )}
      
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">
          Created {new Date(group.createdAt).toLocaleDateString()}
        </span>
        
        {hasSubmittedToday ? (
          <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">
            Shared
          </span>
        ) : (
          <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
            Share Today
          </span>
        )}
      </div>
    </Link>
  );
} 