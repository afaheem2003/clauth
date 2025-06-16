'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeftIcon, UsersIcon, TrophyIcon, HeartIcon, EyeIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';
import dayjs from 'dayjs';

export default function CompetitionRoomPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const roomId = params.id;
  
  const [room, setRoom] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [qualifiedSubmissions, setQualifiedSubmissions] = useState([]);
  const [unqualifiedSubmissions, setUnqualifiedSubmissions] = useState([]);
  const [challenge, setChallenge] = useState(null);
  const [userUpvotes, setUserUpvotes] = useState(new Set());
  const [upvoting, setUpvoting] = useState(null);
  const [userVoteCount, setUserVoteCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated' && roomId) {
      fetchRoomData();
    }
  }, [status, roomId, router]);

  const fetchRoomData = async () => {
    try {
      const [roomResponse, submissionsResponse, upvotesResponse] = await Promise.all([
        fetch(`/api/challenges/competition-room/${roomId}`),
        fetch(`/api/challenges/competition-room/${roomId}/submissions`),
        fetch(`/api/challenges/competition-room/${roomId}/user-upvotes`)
      ]);

      if (roomResponse.ok) {
        const roomData = await roomResponse.json();
        setRoom(roomData.room);
        setChallenge(roomData.challenge);
      }

      if (submissionsResponse.ok) {
        const submissionsData = await submissionsResponse.json();
        setSubmissions(submissionsData.submissions || []);
        setQualifiedSubmissions(submissionsData.qualifiedSubmissions || []);
        setUnqualifiedSubmissions(submissionsData.unqualifiedSubmissions || []);
      }

      if (upvotesResponse.ok) {
        const upvotesData = await upvotesResponse.json();
        setUserUpvotes(new Set(upvotesData.upvotedSubmissionIds || []));
        setUserVoteCount(upvotesData.upvoteCount || 0);
      }
    } catch (error) {
      console.error('Error fetching room data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpvote = async (submissionId) => {
    if (upvoting) return;
    
    setUpvoting(submissionId);
    
    try {
      const isUpvoted = userUpvotes.has(submissionId);
      const method = isUpvoted ? 'DELETE' : 'POST';
      
      const response = await fetch('/api/challenges/upvote', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ submissionId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update upvote');
      }

      const result = await response.json();

      // Update local state
      const newUpvotes = new Set(userUpvotes);
      if (isUpvoted) {
        newUpvotes.delete(submissionId);
        setUserVoteCount(prev => prev - 1);
      } else {
        newUpvotes.add(submissionId);
        setUserVoteCount(prev => prev + 1);
      }
      setUserUpvotes(newUpvotes);

      // Update submission upvote count
      setSubmissions(prev => prev.map(sub => 
        sub.id === submissionId 
          ? { 
              ...sub, 
              upvoteCount: sub.upvoteCount + (isUpvoted ? -1 : 1) 
            }
          : sub
      ));

    } catch (error) {
      console.error('Error updating upvote:', error);
      // You could show a toast notification here
    } finally {
      setUpvoting(null);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Room Not Found</h2>
          <Link href="/challenges" className="text-orange-600 hover:text-orange-500">
            ← Back to Challenges
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/challenges"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to Challenges
          </Link>
          
          <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl border border-orange-200 p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-orange-100 rounded-xl p-4 mr-6">
                  <UsersIcon className="w-8 h-8 text-orange-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Competition Room #{room.roomNumber}
                  </h1>
                  <p className="text-lg text-gray-600">
                    {challenge?.theme} Challenge
                  </p>
                  {challenge?.mainItem && (
                    <p className="text-sm text-gray-500 mt-1">
                      Required item: {challenge.mainItem}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="text-right">
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{room.participantCount}</div>
                    <div className="text-xs text-gray-500">participants</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{submissions.length}</div>
                    <div className="text-xs text-gray-500">submissions</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Voting Eligibility Status */}
          <div className={`mt-6 rounded-lg p-4 ${
            userVoteCount >= 3 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-yellow-50 border border-yellow-200'
          }`}>
            <div className="flex items-start">
              {userVoteCount >= 3 ? (
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center mt-0.5 mr-3 flex-shrink-0">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full border-2 border-yellow-500 flex items-center justify-center mt-0.5 mr-3 flex-shrink-0">
                  <span className="text-xs font-bold text-yellow-600">{Math.max(0, 3 - userVoteCount)}</span>
                </div>
              )}
              <div>
                <h3 className={`font-semibold ${
                  userVoteCount >= 3 ? 'text-green-900' : 'text-yellow-900'
                }`}>
                  {userVoteCount >= 3 ? 'You\'re Eligible for Rankings!' : 'Vote to Compete'}
                </h3>
                <p className={`text-sm ${
                  userVoteCount >= 3 ? 'text-green-700' : 'text-yellow-700'
                }`}>
                  {userVoteCount >= 3 
                    ? 'Your submission is now eligible for room competition rankings.' 
                    : `Vote on ${3 - userVoteCount} more submission${3 - userVoteCount !== 1 ? 's' : ''} in this room to be eligible for competition rankings.`
                  }
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  You&apos;ve voted on {userVoteCount} submissions in this room.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Submissions Grid */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Room Submissions</h2>
          </div>

          {submissions.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <UsersIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No submissions yet</h3>
              <p className="text-gray-600">
                Be the first to submit to this challenge!
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Qualified Submissions */}
              {qualifiedSubmissions.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Competition Rankings
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {qualifiedSubmissions.map((submission, index) => (
                      <SubmissionCard 
                        key={submission.id} 
                        submission={submission} 
                        rank={index + 1}
                        currentUserId={session?.user?.uid}
                        userUpvotes={userUpvotes}
                        userVoteCount={userVoteCount}
                        handleUpvote={handleUpvote}
                        upvoting={upvoting}
                        challenge={challenge}
                        showRank={true}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Unqualified Submissions */}
              {unqualifiedSubmissions.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Other Submissions
                  </h3>
                  <p className="text-gray-600 text-sm">
                    You didn&apos;t submit to this challenge
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {unqualifiedSubmissions.map((submission, index) => (
                      <SubmissionCard 
                        key={submission.id} 
                        submission={submission} 
                        rank={null}
                        currentUserId={session?.user?.uid}
                        userUpvotes={userUpvotes}
                        userVoteCount={userVoteCount}
                        handleUpvote={handleUpvote}
                        upvoting={upvoting}
                        challenge={challenge}
                        showRank={false}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SubmissionCard({ submission, rank, currentUserId, userUpvotes, userVoteCount, handleUpvote, upvoting, challenge, showRank }) {
  const isMySubmission = submission.userId === currentUserId;
  const isUpvoted = userUpvotes.has(submission.id);
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow h-full flex flex-col">
      {submission.clothingItemId ? (
        <Link href={`/clothing/${submission.clothingItemId}`} className="block flex-1 flex flex-col">
          <SubmissionCardContent submission={submission} rank={rank} isMySubmission={isMySubmission} isUpvoted={isUpvoted} userVoteCount={userVoteCount} handleUpvote={handleUpvote} upvoting={upvoting} challenge={challenge} showRank={showRank} />
        </Link>
      ) : (
        <SubmissionCardContent submission={submission} rank={rank} isMySubmission={isMySubmission} isUpvoted={isUpvoted} userVoteCount={userVoteCount} handleUpvote={handleUpvote} upvoting={upvoting} challenge={challenge} showRank={showRank} />
      )}
    </div>
  );
}

function SubmissionCardContent({ submission, rank, isMySubmission, isUpvoted, userVoteCount, handleUpvote, upvoting, challenge, showRank }) {
  // Check if competition has ended
  const competitionEnded = challenge && challenge.competitionEnd && new Date() > new Date(challenge.competitionEnd);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const description = submission.outfitDescription;
  const maxLength = 100; // Character limit before showing "read more"
  const shouldTruncate = description.length > maxLength;
  const displayText = shouldTruncate && !isExpanded 
    ? description.substring(0, maxLength) + '...' 
    : description;
  
  return (
    <div className="flex flex-col h-full">
      <div className="aspect-square relative bg-gray-50">
        <Image
          src={submission.generatedImageUrl || '/images/placeholder.png'}
          alt={`Submission by ${submission.user.displayName || submission.user.name}`}
          fill
          className="object-contain"
          unoptimized
        />
        
        {/* Rank Badge - only show if competition ended and showRank is true */}
        {competitionEnded && showRank && rank && (
          <div className="absolute top-3 left-3">
            <div className={`rounded-full px-3 py-1 text-xs font-bold shadow-sm ${
              rank === 1 
                ? 'bg-yellow-500 text-white' 
                : rank === 2 
                ? 'bg-gray-400 text-white'
                : rank === 3
                ? 'bg-amber-600 text-white'
                : 'bg-white text-gray-900'
            }`}>
              #{rank}
            </div>
          </div>
        )}

        {/* My Entry Badge */}
        {isMySubmission && (
          <div className="absolute top-3 right-3">
            <div className="bg-blue-600 text-white rounded-full px-2 py-1 text-xs font-semibold shadow-sm">
              You
            </div>
          </div>
        )}

        {/* Vote Count - only show if competition ended */}
        {competitionEnded && submission.upvoteCount > 0 && (
          <div className="absolute bottom-3 right-3">
            <div className="bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 text-xs font-semibold text-red-500 shadow-sm flex items-center border border-red-200">
              <HeartSolid className="w-3 h-3 mr-1" />
              {submission.upvoteCount}
            </div>
          </div>
        )}
      </div>
      
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center space-x-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
            <span className="text-xs font-medium text-gray-600">
              {(submission.user.displayName || submission.user.name)?.charAt(0)?.toUpperCase()}
            </span>
          </div>
          <div className="flex-1">
            <span className="text-sm font-medium text-gray-900">
              {submission.user.displayName || submission.user.name}
            </span>
            {isMySubmission && (
              <span className="text-xs text-blue-600 ml-2">(You)</span>
            )}
          </div>
        </div>
        
        <div className="flex-1 mb-4">
          <p className="text-sm text-gray-700 leading-relaxed">
            {displayText}
          </p>
          {shouldTruncate && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="text-xs text-blue-600 hover:text-blue-800 mt-1 font-medium"
            >
              {isExpanded ? 'Show less' : 'Read more'}
            </button>
          )}
        </div>
        
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            {competitionEnded && (
              <span className="flex items-center">
                <HeartSolid className="w-3 h-3 mr-1" />
                {submission.upvoteCount || 0} votes
              </span>
            )}
            <span>
              {dayjs(submission.submittedAt).format('MMM D, h:mm A')}
            </span>
          </div>
        </div>

        {/* Voting Button - only show if competition is active */}
        {!competitionEnded && !isMySubmission && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleUpvote(submission.id);
            }}
            disabled={upvoting === submission.id}
            className={`w-full py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
              isUpvoted
                ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-md hover:shadow-lg transform hover:scale-105'
                : 'bg-white text-gray-700 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 hover:text-red-600 border border-gray-200 hover:border-red-300 shadow-sm hover:shadow-md'
            } ${upvoting === submission.id ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {upvoting === submission.id ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                {isUpvoted ? 'Removing...' : 'Voting...'}
              </div>
            ) : (
              <div className="flex items-center justify-center">
                {isUpvoted ? (
                  <HeartSolid className="w-4 h-4 mr-2" />
                ) : (
                  <HeartIcon className="w-4 h-4 mr-2" />
                )}
                {isUpvoted ? 'Voted' : 'Vote'}
              </div>
            )}
          </button>
        )}

        {!competitionEnded && isMySubmission && (
          <div className="w-full py-3 px-4 rounded-lg text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200 text-center">
            Your Submission
          </div>
        )}

        {competitionEnded && (
          <div className="w-full py-3 px-4 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 text-center">
            Competition Ended
          </div>
        )}
      </div>
    </div>
  );
} 