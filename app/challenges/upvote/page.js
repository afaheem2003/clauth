'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon, HeartIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';

export default function UpvotePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const challengeId = searchParams.get('challengeId');
  const justSubmitted = searchParams.get('submitted') === 'true';
  
  const [challenge, setChallenge] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [userUpvotes, setUserUpvotes] = useState(new Set());
  const [userSubmission, setUserSubmission] = useState(null);
  const [roomInfo, setRoomInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [upvoting, setUpvoting] = useState(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated' && challengeId) {
      fetchChallengeSubmissions();
    }
  }, [status, challengeId, router]);

  const fetchChallengeSubmissions = async () => {
    try {
      const response = await fetch(`/api/challenges/${challengeId}/submissions`);
      
      if (!response.ok) {
        setError('Failed to load challenge submissions');
        return;
      }

      const data = await response.json();
      setChallenge(data.challenge);
      setSubmissions(data.submissions);
      setUserUpvotes(new Set(data.userUpvotes));
      setUserSubmission(data.userSubmission);
      setRoomInfo(data.roomInfo);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      setError('Failed to load challenge submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleUpvote = async (submissionId) => {
    if (upvoting === submissionId) return;
    
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

      // Update local state
      const newUpvotes = new Set(userUpvotes);
      if (isUpvoted) {
        newUpvotes.delete(submissionId);
      } else {
        newUpvotes.add(submissionId);
      }
      setUserUpvotes(newUpvotes);

      // Update submission upvote count
      setSubmissions(prev => prev.map(sub => 
        sub.id === submissionId 
          ? { 
              ...sub, 
              _count: { 
                upvotes: sub._count.upvotes + (isUpvoted ? -1 : 1) 
              } 
            }
          : sub
      ));

      // Check if user is now eligible and update user submission
      if (!isUpvoted && newUpvotes.size >= 3 && userSubmission && !userSubmission.isEligibleForCompetition) {
        setUserSubmission(prev => ({ ...prev, isEligibleForCompetition: true }));
      }

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

  if (!challenge) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Challenge Not Found</h1>
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

  const upvotesNeeded = Math.max(0, 3 - userUpvotes.size);
  const isEligible = userUpvotes.size >= 3;

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
            <h1 className="text-2xl font-bold mb-2">
              {justSubmitted ? "Great! Now Help Others" : "Vote for Designs"}
            </h1>
            <div className="space-y-1">
              {challenge.mainItem && (
                <p><span className="font-semibold">Item:</span> {challenge.mainItem}</p>
              )}
              <p><span className="font-semibold">Theme:</span> {challenge.theme}</p>
              {roomInfo && (
                <p><span className="font-semibold">Competition Room:</span> Room {roomInfo.roomNumber} ({roomInfo.participantCount} participants)</p>
              )}
            </div>
          </div>

          {/* Eligibility Status */}
          <div className={`rounded-lg p-4 mb-6 ${
            isEligible 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-yellow-50 border border-yellow-200'
          }`}>
            <div className="flex items-start">
              {isEligible ? (
                <CheckCircleIcon className="w-6 h-6 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
              ) : (
                <div className="w-6 h-6 rounded-full border-2 border-yellow-500 flex items-center justify-center mt-0.5 mr-3 flex-shrink-0">
                  <span className="text-xs font-bold text-yellow-600">{upvotesNeeded}</span>
                </div>
              )}
              <div>
                <h3 className={`font-semibold ${
                  isEligible ? 'text-green-900' : 'text-yellow-900'
                }`}>
                  {isEligible ? 'You\'re Eligible for Rankings!' : 'Upvote to Compete'}
                </h3>
                <p className={`text-sm ${
                  isEligible ? 'text-green-700' : 'text-yellow-700'
                }`}>
                  {isEligible 
                    ? 'Your submission is now eligible for room competition rankings.' 
                    : `Upvote ${upvotesNeeded} more design${upvotesNeeded !== 1 ? 's' : ''} in your room to be eligible for competition rankings.`
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Submissions Grid */}
        {submissions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {submissions.map((submission) => (
              <SubmissionCard
                key={submission.id}
                submission={submission}
                onUpvote={handleUpvote}
                isUpvoted={userUpvotes.has(submission.id)}
                isUpvoting={upvoting === submission.id}
                isCurrentUser={userSubmission && submission.id === userSubmission.id}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Submissions Yet</h3>
            <p className="text-gray-600">Be the first to submit a design for this challenge!</p>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 flex justify-center">
          <Link
            href={`/challenges/leaderboard?challengeId=${challengeId}`}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            View Room Leaderboard
          </Link>
        </div>
      </div>
    </div>
  );
}

function SubmissionCard({ submission, onUpvote, isUpvoted, isUpvoting, isCurrentUser }) {
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden ${
      isCurrentUser ? 'ring-2 ring-indigo-500 ring-opacity-50' : ''
    }`}>
      {/* Image */}
      {submission.generatedImageUrl && (
        <div className="aspect-square bg-gray-100">
          <img
            src={submission.generatedImageUrl}
            alt="Design submission"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900">
              {isCurrentUser ? 'Your Submission' : submission.user.displayName || submission.user.name}
            </h3>
            <p className="text-sm text-gray-600">
              {submission.group.name}
            </p>
          </div>
          
          {!isCurrentUser && (
            <button
              onClick={() => onUpvote(submission.id)}
              disabled={isUpvoting}
              className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                isUpvoted
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } ${isUpvoting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isUpvoted ? (
                <HeartIconSolid className="w-4 h-4" />
              ) : (
                <HeartIcon className="w-4 h-4" />
              )}
              <span>{submission._count.upvotes}</span>
            </button>
          )}
        </div>

        <p className="text-sm text-gray-600 italic">
          &quot;{submission.outfitDescription}&quot;
        </p>

        <div className="text-xs text-gray-500">
          {new Date(submission.submittedAt).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
} 