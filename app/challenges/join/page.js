'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon, UserGroupIcon } from '@heroicons/react/24/outline';

export default function JoinGroupPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [groupPreview, setGroupPreview] = useState(null);

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/challenges/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inviteCode: inviteCode.trim() }),
      });

      const data = await response.json();

      if (data.success) {
        router.push(`/challenges/groups/@${data.group.handle}`);
      } else {
        setError(data.error || 'Failed to join group');
      }
    } catch (error) {
      console.error('Error joining group:', error);
      setError('Failed to join group. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async () => {
    if (!inviteCode.trim()) return;
    
    setLoading(true);
    setError('');
    setGroupPreview(null);

    try {
      const response = await fetch(`/api/challenges/preview?code=${encodeURIComponent(inviteCode.trim())}`);
      const data = await response.json();

      if (data.success) {
        setGroupPreview(data.group);
      } else {
        setError(data.error || 'Invalid invite code');
      }
    } catch (error) {
      console.error('Error previewing group:', error);
      setError('Failed to preview group');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
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
          <h1 className="text-3xl font-bold text-gray-900">Join Challenge Group</h1>
          <p className="text-gray-600 mt-2">
            Enter an invite code to join a fashion challenge group
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {/* Invite Code Input */}
            <div>
              <label htmlFor="inviteCode" className="block text-sm font-medium text-gray-700 mb-2">
                Invite Code *
              </label>
              <div className="flex space-x-3">
                <input
                  type="text"
                  id="inviteCode"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  required
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-600 text-gray-900"
                  placeholder="Enter the invite code from your friend"
                />
                <button
                  type="button"
                  onClick={handlePreview}
                  disabled={loading || !inviteCode.trim()}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                >
                  Preview
                </button>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Ask a group member for their invite code
              </p>
            </div>

            {/* Group Preview */}
            {groupPreview && (
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h3 className="font-medium text-gray-900 mb-2">Group Preview</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-lg">{groupPreview.name}</span>
                    <div className="flex items-center text-sm text-gray-600">
                      <UserGroupIcon className="w-4 h-4 mr-1" />
                      {groupPreview.memberCount} members
                    </div>
                  </div>
                  
                  {groupPreview.description && (
                    <p className="text-gray-600">{groupPreview.description}</p>
                  )}
                  
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Created by {groupPreview.creator.displayName || groupPreview.creator.name}</span>
                    <span>{new Date(groupPreview.createdAt).toLocaleDateString()}</span>
                  </div>

                  {groupPreview.isMember && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-3">
                      <p className="text-yellow-800 text-sm">
                        You are already a member of this group!
                      </p>
                    </div>
                  )}

                  {groupPreview.isFull && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-3">
                      <p className="text-red-800 text-sm">
                        This group is full ({groupPreview.memberCount}/{groupPreview.maxMembers} members).
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">What happens when you join?</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• You'll be added to the group immediately</li>
                <li>• You can participate in daily challenges with the group</li>
                <li>• You'll see your friends' creative outfit submissions</li>
                <li>• Share your own outfits and get inspired by others</li>
                <li>• The group creator can remove members if needed</li>
              </ul>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <Link
                href="/challenges"
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading || !inviteCode.trim() || groupPreview?.isMember || groupPreview?.isFull}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Joining...' : 'Join Group'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 