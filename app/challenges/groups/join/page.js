'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon, MagnifyingGlassIcon, UserGroupIcon, UsersIcon } from '@heroicons/react/24/outline';

export default function JoinGroupPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [inviteCode, setInviteCode] = useState('');
  const [foundGroup, setFoundGroup] = useState(null);
  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const searchGroup = async (e) => {
    e.preventDefault();
    if (!inviteCode.trim()) {
      setError('Please enter an invite code');
      return;
    }

    setLoading(true);
    setError('');
    setFoundGroup(null);

    try {
      const response = await fetch('/api/challenges/groups/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inviteCode: inviteCode.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to search for group');
        return;
      }

      const data = await response.json();
      setFoundGroup(data.group);
    } catch (error) {
      console.error('Error searching for group:', error);
      setError('Failed to search for group');
    } finally {
      setLoading(false);
    }
  };

  const joinGroup = async () => {
    if (!foundGroup) return;

    setJoining(true);
    setError('');

    try {
      const response = await fetch(`/api/challenges/groups/${foundGroup.id}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inviteCode: foundGroup.inviteCode }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to join group');
        return;
      }

      const data = await response.json();
      setSuccess(data.message);
      
      // Redirect to group page after successful join
      setTimeout(() => {
        router.push(`/challenges/groups/@${foundGroup.handle}`);
      }, 2000);
    } catch (error) {
      console.error('Error joining group:', error);
      setError('Failed to join group');
    } finally {
      setJoining(false);
    }
  };

  const handleCodeInput = (e) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (value.length <= 8) {
      setInviteCode(value);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/challenges"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to Challenges
          </Link>
          
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-6 text-white mb-6">
            <div className="flex items-center mb-2">
              <UserGroupIcon className="w-8 h-8 mr-3" />
              <h1 className="text-2xl font-bold">Join a Group</h1>
            </div>
            <p className="opacity-90">
              Enter an 8-character invite code to join a design group
            </p>
          </div>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <form onSubmit={searchGroup} className="space-y-4">
            <div>
              <label htmlFor="invite-code" className="block text-sm font-medium text-gray-700 mb-2">
                Invite Code
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="invite-code"
                  value={inviteCode}
                  onChange={handleCodeInput}
                  placeholder="Enter 8-character code"
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-center text-lg font-mono tracking-wider"
                  maxLength={8}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <span className="text-sm text-gray-400">
                    {inviteCode.length}/8
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Invite codes are 8 characters long and contain only letters and numbers
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || inviteCode.length !== 8}
              className="w-full flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <MagnifyingGlassIcon className="w-5 h-5 mr-2" />
                  Search Group
                </>
              )}
            </button>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-green-800 text-sm">{success}</p>
            <p className="text-green-600 text-xs mt-1">Redirecting to group page...</p>
          </div>
        )}

        {/* Found Group */}
        {foundGroup && !success && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900">{foundGroup.name}</h3>
                <p className="text-gray-600 mt-1">@{foundGroup.handle}</p>
                {foundGroup.description && (
                  <p className="text-gray-600 mt-2">{foundGroup.description}</p>
                )}
                
                <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                  <div className="flex items-center">
                    <UsersIcon className="w-4 h-4 mr-1" />
                    {foundGroup.memberCount} / {foundGroup.maxMembers} members
                  </div>
                  <div>
                    Created by {foundGroup.creator.displayName || foundGroup.creator.name}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <button
                onClick={joinGroup}
                disabled={joining}
                className="w-full flex items-center justify-center px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {joining ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <UserGroupIcon className="w-5 h-5 mr-2" />
                    Join Group
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Help Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Need Help?</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Ask a group creator to share their 8-character invite code with you</li>
            <li>• Invite codes are case-insensitive and contain only letters and numbers</li>
            <li>• You can be a member of multiple groups at the same time</li>
            <li>• Each group has its own submission history and challenges</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 