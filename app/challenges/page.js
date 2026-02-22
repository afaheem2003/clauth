'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { PlusIcon, UserGroupIcon, TrophyIcon, CalendarIcon, EyeIcon, HeartIcon, UsersIcon, LightBulbIcon } from '@heroicons/react/24/outline';
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
  const [mySubmission, setMySubmission] = useState(null);
  const [competitionRoom, setCompetitionRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showExistingDesigns, setShowExistingDesigns] = useState(false);
  const [existingDesigns, setExistingDesigns] = useState([]);
  const [loadingDesigns, setLoadingDesigns] = useState(false);
  const [submittingExisting, setSubmittingExisting] = useState(false);

  // Challenge ideas state
  const [ideas, setIdeas] = useState([]);
  const [loadingIdeas, setLoadingIdeas] = useState(false);
  const [ideaInput, setIdeaInput] = useState('');
  const [ideaDesc, setIdeaDesc] = useState('');
  const [submittingIdea, setSubmittingIdea] = useState(false);
  const [ideaError, setIdeaError] = useState('');
  const [similarIdeas, setSimilarIdeas] = useState(null); // null = no conflict, [] = resolved
  const [pendingIdea, setPendingIdea] = useState(null); // {title, description} waiting on user choice

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
      const [groupsResponse, challengeResponse, mySubmissionResponse, competitionRoomResponse] = await Promise.all([
        fetch('/api/challenges/groups'),
        fetch('/api/challenges/current'),
        fetch('/api/challenges/my-submission'),
        fetch('/api/challenges/my-competition-room')
      ]);

      if (groupsResponse.ok) {
        const groupsData = await groupsResponse.json();
        setGroups(groupsData.groups || []);
      }

      if (challengeResponse.ok) {
        const challengeData = await challengeResponse.json();
        setCurrentChallenge(challengeData.challenge);
      }

      if (mySubmissionResponse.ok) {
        const submissionData = await mySubmissionResponse.json();
        setMySubmission(submissionData.submission);
      }

      if (competitionRoomResponse.ok) {
        const roomData = await competitionRoomResponse.json();
        setCompetitionRoom(roomData.room);
      }
    } catch (error) {
      console.error('Error fetching challenge data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchIdeas = useCallback(async () => {
    setLoadingIdeas(true);
    try {
      const res = await fetch('/api/challenges/ideas');
      if (res.ok) {
        const data = await res.json();
        setIdeas(data.ideas || []);
      }
    } catch (e) {
      console.error('Error fetching ideas:', e);
    } finally {
      setLoadingIdeas(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated') fetchIdeas();
  }, [status, fetchIdeas]);

  const handleVoteIdea = async (ideaId) => {
    // Optimistic toggle
    setIdeas((prev) =>
      prev.map((idea) => {
        if (idea.id !== ideaId) return idea;
        const wasVoted = idea.hasVoted;
        return { ...idea, hasVoted: !wasVoted, voteCount: wasVoted ? idea.voteCount - 1 : idea.voteCount + 1 };
      })
    );
    try {
      await fetch('/api/challenges/ideas/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ideaId }),
      });
    } catch (e) {
      fetchIdeas(); // revert on error
    }
  };

  const handleSubmitIdea = async (force = false, similarTargetId = null) => {
    const title = (pendingIdea?.title ?? ideaInput).trim();
    const description = (pendingIdea?.description ?? ideaDesc).trim();

    if (!title || title.length < 3) {
      setIdeaError('Please enter at least 3 characters.');
      return;
    }

    setSubmittingIdea(true);
    setIdeaError('');

    try {
      if (force && similarTargetId) {
        // User chose to merge their idea into an existing similar one (just vote on it)
        await handleVoteIdea(similarTargetId);
        setSimilarIdeas(null);
        setPendingIdea(null);
        setIdeaInput('');
        setIdeaDesc('');
        return;
      }

      const res = await fetch('/api/challenges/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
      });

      if (res.status === 409) {
        const data = await res.json();
        setSimilarIdeas(data.similar || []);
        setPendingIdea({ title, description });
        return;
      }

      if (res.ok) {
        setIdeaInput('');
        setIdeaDesc('');
        setSimilarIdeas(null);
        setPendingIdea(null);
        await fetchIdeas();
      } else {
        const data = await res.json();
        setIdeaError(data.error || 'Failed to submit idea.');
      }
    } catch (e) {
      setIdeaError('Something went wrong. Try again.');
    } finally {
      setSubmittingIdea(false);
    }
  };

  const fetchExistingDesigns = async () => {
    if (loadingDesigns || existingDesigns.length > 0) return;
    
    setLoadingDesigns(true);
    try {
      const response = await fetch('/api/saved-clothing-items?published=true');
      if (response.ok) {
        const data = await response.json();
        setExistingDesigns(data.clothingItems || []);
      }
    } catch (error) {
      console.error('Error fetching existing designs:', error);
    } finally {
      setLoadingDesigns(false);
    }
  };

  const handleSubmitExistingDesign = async (clothingItem) => {
    if (!currentChallenge || submittingExisting) return;

    setSubmittingExisting(true);
    try {
      const response = await fetch('/api/challenges/submit-existing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          challengeId: currentChallenge.id,
          clothingItemId: clothingItem.id
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Refresh the data to show the new submission
        await fetchData();
        setShowExistingDesigns(false);
      } else {
        alert(data.error || 'Failed to submit design to challenge');
      }
    } catch (error) {
      console.error('Error submitting existing design:', error);
      alert('Failed to submit design. Please try again.');
    } finally {
      setSubmittingExisting(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8 relative">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Daily Challenges</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Compete with random players and share with friends in daily fashion challenges
          </p>
          
          {/* Past Challenges Button - Floating Action Style */}
          <div className="absolute top-0 right-0 hidden sm:block">
            <Link
              href="/challenges/past"
              className="inline-flex items-center justify-center px-6 py-3 bg-gray-800 text-white rounded-lg shadow hover:bg-gray-900 transition-colors font-semibold text-sm"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Past Challenges
            </Link>
          </div>

          {/* Mobile Past Challenges Button */}
          <div className="sm:hidden mt-6">
            <Link
              href="/challenges/past"
              className="inline-flex items-center justify-center px-8 py-4 bg-gray-800 text-white rounded-lg shadow hover:bg-gray-900 transition-colors font-semibold"
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Explore Past Challenges
            </Link>
          </div>
        </div>

        {/* Current Challenge Banner */}
        {currentChallenge && (
          <div className="bg-gradient-to-r from-gray-900 to-black rounded-2xl mb-8 shadow-lg overflow-hidden">
            <div className="p-8">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  {/* Header */}
                  <div className="flex items-center mb-6">
                    <div className="bg-white rounded-full p-2 mr-4">
                      <CalendarIcon className="w-6 h-6 text-gray-900" />
                    </div>
                    <h2 className="text-3xl font-bold text-white">Today&apos;s Challenge</h2>
                  </div>
                  
                  {/* Challenge Details */}
                  <div className="space-y-4 mb-8">
                    {currentChallenge.mainItem && (
                      <div>
                        <span className="text-gray-400 text-sm font-medium">ITEM:</span>
                        <span className="text-white text-xl font-semibold ml-2">{currentChallenge.mainItem}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-400 text-sm font-medium">THEME:</span>
                      <span className="text-white text-xl font-semibold ml-2">{currentChallenge.theme}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 text-sm font-medium">DEADLINE:</span>
                      <span className="text-white text-lg ml-2">
                        {dayjs.utc(currentChallenge.submissionDeadline).tz(EASTERN_TIMEZONE).format('h:mm A')} ET
                      </span>
                    </div>
                  </div>
                  
                  {/* Call to Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    {!mySubmission ? (
                      <>
                        <Link
                          href="/design"
                          className="inline-flex items-center justify-center px-8 py-4 bg-white text-gray-900 rounded-xl hover:bg-gray-100 transition-colors font-semibold"
                        >
                          <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                          Design with AI
                        </Link>
                        <button
                          onClick={() => {
                            setShowExistingDesigns(true);
                            fetchExistingDesigns();
                          }}
                          className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-white rounded-xl hover:bg-white hover:text-gray-900 transition-colors font-semibold"
                        >
                          <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                          Select Existing Design
                        </button>
                      </>
                    ) : (
                      <div className="inline-flex items-center justify-center px-8 py-4 bg-gray-700 text-white rounded-xl font-semibold">
                        <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Submitted!
                      </div>
                    )}
                    <Link
                      href="/challenges/past"
                      className="inline-flex items-center justify-center px-8 py-4 border-2 border-gray-600 text-white rounded-xl hover:border-gray-500 hover:bg-gray-800 transition-colors font-semibold"
                    >
                      <TrophyIcon className="w-5 h-5 mr-3" />
                      View Past Challenges
                    </Link>
                  </div>
                </div>
                
                {/* Decorative Element */}
                <div className="hidden lg:block ml-8">
                  <div className="w-32 h-32 bg-white bg-opacity-10 rounded-full flex items-center justify-center">
                    <CalendarIcon className="w-16 h-16 text-white opacity-60" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* My Submission Section */}
        {mySubmission && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">My Submission</h2>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              {mySubmission.clothingItemId ? (
                <Link href={`/clothing/${mySubmission.clothingItemId}`} className="block">
                  <div className="md:flex">
                    <div className="md:w-1/3">
                      <div className="aspect-square relative">
                        <Image
                          src={mySubmission.generatedImageUrl || '/images/placeholder.png'}
                          alt="My submission"
                          fill
                          className="object-cover"
                          unoptimized
                        />
                        <div className="absolute top-3 left-3">
                          <div className="bg-blue-600 text-white rounded-full px-3 py-1 text-xs font-semibold shadow-sm">
                            My Entry
                          </div>
                        </div>
                        {mySubmission.upvoteCount > 0 && (
                          <div className="absolute top-3 right-3">
                            <div className="bg-gray-700 rounded-full px-2 py-1 text-xs font-semibold text-white shadow-sm flex items-center">
                              ❤️ {mySubmission.upvoteCount}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="md:w-2/3 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-gray-900">
                          {currentChallenge?.theme} Challenge
                        </h3>
                        <span className="text-sm text-gray-500">
                          Submitted {dayjs(mySubmission.submittedAt).format('MMM D, h:mm A')}
                        </span>
                      </div>
                      <p className="text-gray-700 mb-4 leading-relaxed">
                        &quot;{mySubmission.outfitDescription}&quot;
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center">
                          <HeartIcon className="w-4 h-4 mr-1" />
                          {mySubmission.upvoteCount || 0} likes
                        </span>
                        <span className="flex items-center">
                          <EyeIcon className="w-4 h-4 mr-1" />
                          View full design
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ) : (
                <div className="md:flex">
                  <div className="md:w-1/3">
                    <div className="aspect-square relative">
                      <Image
                        src={mySubmission.generatedImageUrl || '/images/placeholder.png'}
                        alt="My submission"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                      <div className="absolute top-3 left-3">
                        <div className="bg-gray-800 text-white rounded-full px-3 py-1 text-xs font-semibold shadow-sm">
                          My Entry
                        </div>
                      </div>
                      {mySubmission.upvoteCount > 0 && (
                        <div className="absolute top-3 right-3">
                          <div className="bg-red-500 rounded-full px-2 py-1 text-xs font-semibold text-white shadow-sm flex items-center">
                            ❤️ {mySubmission.upvoteCount}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="md:w-2/3 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-gray-900">
                        {currentChallenge?.theme} Challenge
                      </h3>
                      <span className="text-sm text-gray-500">
                        Submitted {dayjs(mySubmission.submittedAt).format('MMM D, h:mm A')}
                      </span>
                    </div>
                    <p className="text-gray-700 mb-4 leading-relaxed">
                      &quot;{mySubmission.outfitDescription}&quot;
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span className="flex items-center">
                        <HeartIcon className="w-4 h-4 mr-1" />
                        {mySubmission.upvoteCount || 0} likes
                      </span>
                      <span className="text-sm text-gray-500">
                        Challenge submission only
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Competition Room Section */}
        {currentChallenge && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">My Competition Room</h2>
            </div>
            
            {competitionRoom ? (
              <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="bg-gray-100 rounded-lg p-3 mr-4">
                      <UsersIcon className="w-6 h-6 text-gray-700" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Room #{competitionRoom.roomNumber}</h3>
                      <p className="text-sm text-gray-600">
                        {competitionRoom.participantCount} of {competitionRoom.maxParticipants} participants
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">{competitionRoom.submissionCount}</div>
                    <div className="text-xs text-gray-500">submissions</div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-gray-600 text-sm">
                    You&apos;re competing with {competitionRoom.participantCount - 1} other designers in this room for today&apos;s challenge.
                  </p>
                  <Link
                    href={`/challenges/competition-room/${competitionRoom.id}`}
                    className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 transition-colors text-sm font-medium"
                  >
                    View Room
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-gray-100 rounded-xl border border-gray-200 p-6 text-center">
                <UsersIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Competition Room Yet</h3>
                <p className="text-gray-600 mb-4">
                  Submit to today&apos;s challenge to be assigned to a competition room with 20-30 other participants!
                </p>
                {!mySubmission && (
                  <Link
                    href="/design"
                    className="bg-gray-800 text-white px-6 py-2 rounded-lg hover:bg-gray-900 transition-colors font-medium"
                  >
                    Submit to Challenge
                  </Link>
                )}
              </div>
            )}
          </div>
        )}

        {/* Friend Groups Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">My Friend Groups ({groups.length})</h2>
              <p className="text-sm text-gray-600 mt-1">Share challenges with your friends and see what they&apos;re designing</p>
            </div>
            <div className="flex space-x-3">
              <Link
                href="/challenges/create-group"
                className="inline-flex items-center px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors text-sm font-medium"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Create Group
              </Link>
              <Link
                href="/challenges/join"
                className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
              >
                <UserGroupIcon className="w-4 h-4 mr-2" />
                Join Group
              </Link>
            </div>
          </div>

          {groups.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <UserGroupIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No friend groups yet</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Create or join a group to start sharing daily challenges with your friends and see what they&apos;re designing!
              </p>
              <div className="flex justify-center space-x-4">
                <Link
                  href="/challenges/create-group"
                  className="bg-gray-800 text-white px-6 py-3 rounded-lg hover:bg-gray-900 transition-colors font-medium"
                >
                  Create Your First Group
                </Link>
                <Link
                  href="/challenges/join"
                  className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium"
                >
                  Join a Group
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groups.map((group) => (
                <GroupCard key={group.id} group={group} currentChallenge={currentChallenge} />
              ))}
            </div>
          )}
        </div>

        {/* Challenge Ideas Leaderboard */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <LightBulbIcon className="w-6 h-6 text-yellow-500" />
                Suggest a Challenge
              </h2>
              <p className="text-sm text-gray-600 mt-1">Vote on ideas to help shape upcoming challenges</p>
            </div>
          </div>

          {/* Submit form */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-5">
            <div className="flex flex-col gap-3">
              <input
                type="text"
                value={ideaInput}
                onChange={(e) => { setIdeaInput(e.target.value); setIdeaError(''); }}
                placeholder="e.g. 90s streetwear, monochromatic fits, airport OOTD…"
                maxLength={100}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 placeholder-gray-500"
              />
              <textarea
                value={ideaDesc}
                onChange={(e) => setIdeaDesc(e.target.value)}
                placeholder="Optional description (context, rules, vibe…)"
                rows={2}
                maxLength={300}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 resize-none placeholder-gray-500"
              />
              {ideaError && <p className="text-red-600 text-xs">{ideaError}</p>}
              <div className="flex justify-end">
                <button
                  onClick={() => handleSubmitIdea()}
                  disabled={submittingIdea || ideaInput.trim().length < 3}
                  className="bg-gray-900 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {submittingIdea ? 'Submitting…' : 'Submit Idea'}
                </button>
              </div>
            </div>
          </div>

          {/* Similar ideas conflict resolution */}
          {similarIdeas && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-5">
              <p className="text-sm font-semibold text-amber-800 mb-3">
                These existing ideas look similar to &quot;{pendingIdea?.title}&quot;. Would you like to vote on one instead, or submit yours as a separate idea?
              </p>
              <div className="flex flex-col gap-2 mb-4">
                {similarIdeas.map((s) => (
                  <div key={s.id} className="flex items-center justify-between bg-white rounded-lg border border-amber-200 px-4 py-2">
                    <span className="text-sm text-gray-900 font-medium">{s.title}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500">{s.voteCount} vote{s.voteCount !== 1 ? 's' : ''}</span>
                      <button
                        onClick={() => handleSubmitIdea(true, s.id)}
                        className="text-xs bg-amber-600 text-white px-3 py-1 rounded-lg hover:bg-amber-700 transition-colors"
                      >
                        Vote on this
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    // Submit as distinct idea ignoring similarity
                    const title = pendingIdea?.title;
                    const description = pendingIdea?.description;
                    setSimilarIdeas(null);
                    setPendingIdea(null);
                    setSubmittingIdea(true);
                    fetch('/api/challenges/ideas', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ title, description, force: true }),
                    }).then(async (res) => {
                      if (res.ok) {
                        setIdeaInput('');
                        setIdeaDesc('');
                        await fetchIdeas();
                      } else {
                        const d = await res.json();
                        setIdeaError(d.error || 'Failed to submit.');
                      }
                    }).catch(() => setIdeaError('Something went wrong.')).finally(() => setSubmittingIdea(false));
                  }}
                  className="text-xs border border-gray-400 text-gray-700 px-3 py-1 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Submit as separate idea anyway
                </button>
                <button
                  onClick={() => { setSimilarIdeas(null); setPendingIdea(null); }}
                  className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Leaderboard */}
          {loadingIdeas ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900" />
            </div>
          ) : ideas.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">No ideas yet — be the first to suggest one!</div>
          ) : (
            <div className="flex flex-col gap-3">
              {ideas.map((idea, idx) => (
                <div
                  key={idea.id}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4 flex items-start gap-4"
                >
                  {/* Rank */}
                  <div className="flex-shrink-0 w-7 text-center">
                    <span className={`text-sm font-bold ${idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-gray-400' : idx === 2 ? 'text-amber-700' : 'text-gray-300'}`}>
                      #{idx + 1}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm leading-snug">{idea.title}</p>
                    {idea.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{idea.description}</p>}
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      <span>by @{idea.submittedBy}</span>
                      {idea.mergedCount > 0 && <span>· {idea.mergedCount} similar collapsed</span>}
                    </div>
                  </div>

                  {/* Vote button */}
                  <button
                    onClick={() => !idea.isOwn && handleVoteIdea(idea.id)}
                    disabled={idea.isOwn}
                    title={idea.isOwn ? "Your idea" : idea.hasVoted ? "Remove vote" : "Vote for this idea"}
                    className={`flex-shrink-0 flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg border transition-colors text-xs font-semibold
                      ${idea.isOwn ? 'border-gray-100 text-gray-300 cursor-default' :
                        idea.hasVoted ? 'border-gray-900 bg-gray-900 text-white hover:bg-gray-700' :
                        'border-gray-300 text-gray-600 hover:border-gray-900 hover:text-gray-900'}`}
                  >
                    <span>▲</span>
                    <span>{idea.voteCount}</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Existing Designs Modal */}
        {showExistingDesigns && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Select an Existing Design</h2>
                  <button
                    onClick={() => setShowExistingDesigns(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <p className="text-gray-600 text-sm">
                  Choose from your published designs to submit to today&apos;s challenge: &quot;{currentChallenge?.theme}&quot;
                </p>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {loadingDesigns ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  </div>
                ) : existingDesigns.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                      <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Published Designs Yet</h3>
                    <p className="text-gray-600 text-sm">
                      You don&apos;t have any published designs yet. Create your first design to submit to challenges!
                    </p>
                    <Link
                      href="/design"
                      className="inline-flex items-center px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
                    >
                      Create Your First Design
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {existingDesigns.map((design) => (
                      <div key={design.id} className="bg-gray-50 rounded-lg overflow-hidden">
                        <div className="aspect-square relative">
                          <Image
                            src={design.imageUrls?.front || design.imageUrl || '/images/placeholder.png'}
                            alt={design.name}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold text-gray-900 mb-1">{design.name}</h3>
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">{design.description}</p>
                          <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                            <span>{design.itemType}</span>
                            <span>{dayjs(design.createdAt).format('MMM D')}</span>
                          </div>
                          <button
                            onClick={() => handleSubmitExistingDesign(design)}
                            disabled={submittingExisting}
                            className="w-full bg-gray-800 text-white py-2 px-3 rounded-lg hover:bg-gray-900 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {submittingExisting ? 'Submitting...' : 'Submit This Design'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function GroupCard({ group, currentChallenge }) {
  const memberCount = group.memberCount || 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 text-lg mb-1">{group.name}</h3>
            <p className="text-sm text-gray-600 mb-2">@{group.handle}</p>
            {group.description && (
              <p className="text-sm text-gray-700 line-clamp-2 mb-3">{group.description}</p>
            )}
          </div>
          <div className="flex items-center text-sm text-gray-500 ml-4">
            <UserGroupIcon className="w-4 h-4 mr-1" />
            {memberCount}
          </div>
        </div>
        
        <div className="space-y-3">
          <Link
            href={`/challenges/groups/@${group.handle}`}
            className="block w-full bg-gray-800 text-white text-center py-3 rounded-lg hover:bg-gray-900 transition-colors font-medium"
          >
            View Group Submissions
          </Link>

          {currentChallenge && (
            <Link
              href={`/challenges/groups/@${group.handle}/challenge/${currentChallenge.id}`}
              className="block w-full bg-gray-100 text-gray-700 text-center py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              Today&apos;s Challenge Results
            </Link>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Created {dayjs(group.createdAt).format('MMM D, YYYY')}</span>
            {group.isCreator && (
              <span className="bg-gray-200 text-gray-800 px-2 py-1 rounded-full font-medium">
                Owner
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 