'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon, UserGroupIcon, ClipboardDocumentListIcon, ShareIcon, CalendarIcon, TrashIcon, StarIcon } from '@heroicons/react/24/outline';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

// Extend dayjs with timezone support
dayjs.extend(utc);
dayjs.extend(timezone);

export default function GroupDetailByHandlePage({ params }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [group, setGroup] = useState(null);
  const [currentChallenge, setCurrentChallenge] = useState(null);
  const [userSubmittedToday, setUserSubmittedToday] = useState(false);
  const [recentSubmissions, setRecentSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showInviteCode, setShowInviteCode] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [removingMember, setRemovingMember] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingGroup, setDeletingGroup] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [showBannerUpload, setShowBannerUpload] = useState(false);

  const EASTERN_TIMEZONE = 'America/New_York';

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      fetchGroupDetails();
    }
  }, [status, router]);

  const fetchGroupDetails = async () => {
    try {
      // Await params and handle @ prefix
      const resolvedParams = await params;
      const handle = resolvedParams.handle.startsWith('@') ? resolvedParams.handle.slice(1) : resolvedParams.handle;
      
      const response = await fetch(`/api/challenges/groups/by-handle/${handle}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Group not found');
        } else if (response.status === 403) {
          setError('You are not a member of this group');
        } else {
          setError('Failed to load group details');
        }
        return;
      }

      const data = await response.json();
      setGroup(data.group);
      setCurrentChallenge(data.currentChallenge);
      setUserSubmittedToday(data.userSubmittedToday);
      setRecentSubmissions(data.recentSubmissions || []);
    } catch (error) {
      console.error('Error fetching group details:', error);
      setError('Failed to load group details');
    } finally {
      setLoading(false);
    }
  };

  const copyInviteCode = async () => {
    try {
      await navigator.clipboard.writeText(group.inviteCode);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy invite code:', err);
    }
  };

  const shareInviteCode = async () => {
    const shareData = {
      title: `Join ${group.name} on Clauth!`,
      text: `Join my fashion challenge group "${group.name}" using invite code: ${group.inviteCode}`,
      url: window.location.href
    };

    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        // Fallback to copy
        await copyInviteCode();
      }
    } catch (err) {
      console.error('Error sharing:', err);
      // Fallback to copy
      await copyInviteCode();
    }
  };

  const removeMember = async (memberUserId) => {
    if (removingMember === memberUserId) return;
    
    setRemovingMember(memberUserId);
    
    try {
      const response = await fetch(`/api/challenges/groups/${group.id}/members`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ memberUserId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove member');
      }

      // Refresh group details to update member list
      await fetchGroupDetails();
    } catch (error) {
      console.error('Error removing member:', error);
      setError(error.message);
    } finally {
      setRemovingMember(null);
    }
  };

  const deleteGroup = async () => {
    setDeletingGroup(true);
    
    try {
      const response = await fetch(`/api/challenges/groups/${group.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete group');
      }

      // Redirect to challenges page after successful deletion
      router.push('/challenges');
    } catch (error) {
      console.error('Error deleting group:', error);
      setError(error.message);
      setDeletingGroup(false);
      setShowDeleteConfirm(false);
    }
  };

  const uploadBanner = async (file) => {
    if (!file) return;

    setUploadingBanner(true);
    
    try {
      const formData = new FormData();
      formData.append('banner', file);
      
      const response = await fetch(`/api/challenges/groups/${group.id}/banner`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload banner');
      }

      // Refresh group details to show new banner
      await fetchGroupDetails();
      setShowBannerUpload(false);
    } catch (error) {
      console.error('Error uploading banner:', error);
      setError(error.message);
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleBannerUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type and size
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('Image must be smaller than 5MB');
        return;
      }
      uploadBanner(file);
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

  if (!group) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Group Not Found</h1>
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
          
          {/* Banner Section */}
          <div className="relative mb-6">
            {group.bannerUrl ? (
              <div className="relative h-48 sm:h-64 rounded-xl overflow-hidden">
                <img
                  src={group.bannerUrl}
                  alt={`${group.name} banner`}
                  className="w-full h-full object-cover"
                />
                {group.isCreator && (
                  <div className="absolute top-4 right-4">
                    <button
                      onClick={() => setShowBannerUpload(true)}
                      className="px-3 py-2 bg-black bg-opacity-50 text-white rounded-lg text-sm hover:bg-opacity-70 transition-colors"
                    >
                      Change Banner
                    </button>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60"></div>
                <div className="absolute bottom-6 left-6 text-white">
                  <h1 className="text-4xl font-bold">{group.name}</h1>
                  <p className="text-xl opacity-90">@{group.handle}</p>
                </div>
              </div>
            ) : (
              <div className="h-48 sm:h-64 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center relative">
                {group.isCreator && (
                  <div className="absolute top-4 right-4">
                    <button
                      onClick={() => setShowBannerUpload(true)}
                      className="px-3 py-2 bg-black bg-opacity-30 text-white rounded-lg text-sm hover:bg-opacity-50 transition-colors"
                    >
                      Add Banner
                    </button>
                  </div>
                )}
                <div className="text-center text-white">
                  <h1 className="text-4xl font-bold">{group.name}</h1>
                  <p className="text-xl opacity-90">@{group.handle}</p>
                </div>
              </div>
            )}
          </div>

          {/* Banner Upload Modal */}
          {showBannerUpload && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg max-w-md w-full p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Upload Group Banner</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Choose an image (max 5MB)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBannerUpload}
                      disabled={uploadingBanner}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                    />
                  </div>
                  {uploadingBanner && (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                      <span className="text-sm text-gray-600">Uploading...</span>
                    </div>
                  )}
                </div>
                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={() => setShowBannerUpload(false)}
                    disabled={uploadingBanner}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex items-start justify-between">
            <div>
              {!group.bannerUrl && (
                <>
                  <h1 className="text-3xl font-bold text-gray-900">{group.name}</h1>
                  <p className="text-gray-600 mt-1">@{group.handle}</p>
                </>
              )}
              {group.description && (
                <p className="text-gray-600 mt-2">{group.description}</p>
              )}
              <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                <div className="flex items-center">
                  <UserGroupIcon className="w-4 h-4 mr-1" />
                  {group.memberCount} / {group.maxMembers} members
                </div>
                <div>
                  Created by {group.creator.displayName || group.creator.name}
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col space-y-2">
              {group.isCreator && (
                <button
                  onClick={() => setShowInviteCode(!showInviteCode)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <ShareIcon className="w-4 h-4 mr-2" />
                  Invite Code
                </button>
              )}

              {group.isCreator && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="inline-flex items-center px-3 py-2 border border-red-300 rounded-lg text-sm font-medium text-red-700 bg-white hover:bg-red-50"
                >
                  <TrashIcon className="w-4 h-4 mr-2" />
                  Delete Group
                </button>
              )}
            </div>
          </div>
          
          {/* Invite Code Section */}
          {group.isCreator && showInviteCode && (
            <div className="mt-4 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900">Group Invite Code</h3>
                <ShareIcon className="w-5 h-5 text-indigo-600" />
              </div>
              <p className="text-sm text-gray-700 mb-4">Share this code with friends to invite them to your group:</p>
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
                <div className="flex-1 w-full">
                  <code className="block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-2xl font-mono font-bold text-gray-900 tracking-widest text-center shadow-sm">
                    {group.inviteCode}
                  </code>
                </div>
                <div className="flex space-x-2 w-full sm:w-auto">
                  <button
                    onClick={shareInviteCode}
                    className="flex-1 sm:flex-none px-4 py-3 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                  >
                    {copySuccess ? 'Copied!' : 'Share'}
                  </button>
                  <button
                    onClick={copyInviteCode}
                    className="flex-1 sm:flex-none px-4 py-3 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    Copy
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-3">
                Friends can use this code at <span className="font-mono">clauth.com/challenges/join</span>
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Challenge */}
            {currentChallenge ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Today&apos;s Challenge</h2>
                  <div className="flex items-center text-sm text-gray-500">
                    <CalendarIcon className="w-4 h-4 mr-1" />
                    {new Date(currentChallenge.date).toLocaleDateString()}
                  </div>
                </div>
                
                <div className="space-y-3">
                  {currentChallenge.mainItem && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">Main Item:</span>
                      <p className="text-lg text-gray-900">{currentChallenge.mainItem}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-sm font-medium text-gray-500">Theme:</span>
                    <p className="text-lg text-indigo-600">{currentChallenge.theme}</p>
                  </div>
                  {currentChallenge.description && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">Description:</span>
                      <p className="text-gray-700">{currentChallenge.description}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-sm font-medium text-gray-500">Deadline:</span>
                    <p className="text-gray-700">
                      {dayjs.utc(currentChallenge.submissionDeadline).tz(EASTERN_TIMEZONE).format('dddd, MMMM D, YYYY h:mm A')} ET
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  {userSubmittedToday ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-green-800 text-sm">
                        ✓ You&apos;ve already submitted for today&apos;s challenge!
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Link
                        href="/design"
                        className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        Design with AI
                      </Link>
                    <Link
                      href={`/challenges/submit?groupId=${group.id}&challengeId=${currentChallenge.id}`}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <ClipboardDocumentListIcon className="w-4 h-4 mr-2" />
                        Submit Description
                    </Link>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">No Active Challenge</h2>
                <p className="text-gray-600 text-sm">
                  There&apos;s no active challenge for today. Check back later or contact an admin.
                </p>
              </div>
            )}

            {/* Recent Submissions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Submissions</h2>
              
              {recentSubmissions.length > 0 ? (
                <div className="space-y-4">
                  {recentSubmissions.map((submission) => (
                    <div key={submission.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="font-medium text-gray-900">
                              {submission.user.displayName || submission.user.name}
                            </span>
                            <span className="text-sm text-gray-500">
                              • {new Date(submission.submittedAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 mb-2">
                            {submission.challenge.mainItem && `${submission.challenge.mainItem} • `}
                            {submission.challenge.theme}
                          </div>
                          <p className="text-gray-800 italic">
                            &quot;{submission.outfitDescription}&quot;
                          </p>
                        </div>
                        
                        {submission.generatedImageUrl && (
                          <div className="ml-4">
                            <img
                              src={submission.generatedImageUrl}
                              alt="Outfit submission"
                              className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No submissions yet. Be the first to participate!</p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Members */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Members ({group.memberCount})
              </h3>
              <div className="space-y-3">
                {group.members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">
                          {(member.user.displayName || member.user.name)?.charAt(0)?.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {member.user.displayName || member.user.name}
                          </p>
                          {member.role === 'CREATOR' && (
                            <StarIcon className="w-4 h-4 text-yellow-500" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          {member.role === 'CREATOR' ? 'Creator' : 'Designer'} • 
                          Joined {new Date(member.joinedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    {/* Remove Member Button (only for creators, and not for themselves) */}
                    {group.isCreator && member.role !== 'CREATOR' && (
                      <button
                        onClick={() => removeMember(member.userId)}
                        disabled={removingMember === member.userId}
                        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Remove member"
                      >
                        {removingMember === member.userId ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                        ) : (
                          <TrashIcon className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Link
                  href="/challenges/leaderboard"
                  className="block w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  View Global Leaderboard
                </Link>
                <Link
                  href="/challenges/groups/join"
                  className="block w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Join Another Group
                </Link>
                {group.isCreator && (
                  <button
                    onClick={() => setShowInviteCode(!showInviteCode)}
                    className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    {showInviteCode ? 'Hide' : 'Show'} Invite Code
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Delete Group</h3>
              <p className="text-sm text-gray-600 mb-6">
                Are you sure you want to delete &quot;{group.name}&quot;? This action cannot be undone. 
                All members will be removed and all submissions will be deleted.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deletingGroup}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={deleteGroup}
                  disabled={deletingGroup}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {deletingGroup ? 'Deleting...' : 'Delete Group'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 