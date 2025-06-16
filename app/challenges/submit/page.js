'use client';

import { useState, useEffect, use } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon, PhotoIcon } from '@heroicons/react/24/outline';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

// Extend dayjs with timezone support
dayjs.extend(utc);
dayjs.extend(timezone);

export default function SubmitChallengePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const groupId = searchParams.get('groupId');
  const challengeId = searchParams.get('challengeId');
  
  const [group, setGroup] = useState(null);
  const [challenge, setChallenge] = useState(null);
  const [formData, setFormData] = useState({
    outfitDescription: '',
    designPrompt: '',
    itemName: '',
    itemType: '',
    color: '',
    style: ''
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [stage, setStage] = useState(1); // 1: Description, 2: Generating, 3: Success

  const EASTERN_TIMEZONE = 'America/New_York';

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated' && groupId && challengeId) {
      fetchChallengeDetails();
    }
  }, [status, groupId, challengeId, router]);

  const fetchChallengeDetails = async () => {
    try {
      const [groupResponse, challengeResponse] = await Promise.all([
        fetch(`/api/challenges/groups/${groupId}`),
        fetch(`/api/admin/challenges/${challengeId}`)
      ]);

      if (!groupResponse.ok || !challengeResponse.ok) {
        setError('Failed to load challenge details');
        return;
      }

      const groupData = await groupResponse.json();
      const challengeData = await challengeResponse.json();

      setGroup(groupData.group);
      setChallenge(challengeData.challenge);

      // Pre-fill form with challenge details
      setFormData(prev => ({
        ...prev,
        itemName: challengeData.challenge.mainItem || '',
        itemType: challengeData.challenge.mainItem ? 
          (challengeData.challenge.mainItem.toLowerCase().includes('dress') ? 'dresses' :
           challengeData.challenge.mainItem.toLowerCase().includes('top') || 
           challengeData.challenge.mainItem.toLowerCase().includes('shirt') || 
           challengeData.challenge.mainItem.toLowerCase().includes('hoodie') ? 'tops' :
           challengeData.challenge.mainItem.toLowerCase().includes('bottom') || 
           challengeData.challenge.mainItem.toLowerCase().includes('pants') || 
           challengeData.challenge.mainItem.toLowerCase().includes('jeans') ? 'bottoms' :
           challengeData.challenge.mainItem.toLowerCase().includes('jacket') || 
           challengeData.challenge.mainItem.toLowerCase().includes('coat') ? 'outerwear' : 'tops') : ''
      }));
    } catch (error) {
      console.error('Error fetching challenge details:', error);
      setError('Failed to load challenge details');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setStage(2);

    try {
      // Step 1: Create clothing item
      const clothingResponse = await fetch('/api/challenges/submit-design', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.itemName || `${challenge.theme} Design`,
          itemType: formData.itemType || 'tops',
          description: formData.outfitDescription,
          promptRaw: formData.designPrompt,
          color: formData.color,
          style: formData.style,
          challengeTheme: challenge.theme,
          mainItem: challenge.mainItem
        }),
      });

      if (!clothingResponse.ok) {
        const clothingError = await clothingResponse.json();
        throw new Error(clothingError.error || 'Failed to create design');
      }

      const clothingData = await clothingResponse.json();

      // Step 2: Submit challenge entry
      const submissionResponse = await fetch('/api/challenges/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          challengeId,
          groupId,
          outfitDescription: formData.outfitDescription,
          clothingItemId: clothingData.clothingItem.id,
          generatedImageUrl: clothingData.clothingItem.imageUrl
        }),
      });

      if (!submissionResponse.ok) {
        const submissionError = await submissionResponse.json();
        throw new Error(submissionError.error || 'Failed to submit challenge entry');
      }

      setStage(3);
      
      // Redirect to upvote flow after a brief delay
      setTimeout(() => {
        router.push(`/challenges/upvote?challengeId=${challengeId}&submitted=true`);
      }, 2000);

    } catch (error) {
      console.error('Error submitting challenge:', error);
      setError(error.message || 'Failed to submit challenge entry');
      setStage(1);
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error && stage === 1) {
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

  if (!group || !challenge) {
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

  if (stage === 2) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Creating Your Design</h2>
            <p className="text-gray-600">
              AI is generating your design and submitting it to the challenge...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (stage === 3) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Successfully Submitted!</h2>
            <p className="text-gray-600 mb-4">
              Your design has been submitted to the challenge and is now available on the discover page.
            </p>
            <p className="text-sm text-indigo-600">
              Redirecting to upvote other submissions...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/challenges/groups/@${group.handle}`}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to {group.name}
          </Link>
          
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white mb-6">
            <h1 className="text-2xl font-bold mb-2">Submit Your Design</h1>
            <div className="space-y-1">
              {challenge.mainItem && (
                <p><span className="font-semibold">Item:</span> {challenge.mainItem}</p>
              )}
              <p><span className="font-semibold">Theme:</span> {challenge.theme}</p>
              <p className="text-sm opacity-90">
                Deadline: {dayjs.utc(challenge.submissionDeadline).tz(EASTERN_TIMEZONE).format('dddd, MMMM D, YYYY h:mm A')} ET
              </p>
            </div>
          </div>
        </div>

        {/* Submission Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              {/* Outfit Description */}
              <div>
                <label htmlFor="outfitDescription" className="block text-sm font-medium text-gray-700 mb-2">
                  Outfit Description *
                </label>
                <textarea
                  id="outfitDescription"
                  name="outfitDescription"
                  value={formData.outfitDescription}
                  onChange={handleChange}
                  required
                  maxLength={500}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-600"
                  placeholder="Describe your outfit design in detail. This will be visible to others and used to generate the design..."
                />
                <p className="text-xs text-gray-600 mt-1">
                  {formData.outfitDescription.length}/500 characters
                </p>
              </div>

              {/* Design Prompt */}
              <div>
                <label htmlFor="designPrompt" className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Design Details
                </label>
                <textarea
                  id="designPrompt"
                  name="designPrompt"
                  value={formData.designPrompt}
                  onChange={handleChange}
                  maxLength={300}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-600"
                  placeholder="Additional technical details, materials, styling notes... (optional)"
                />
                <p className="text-xs text-gray-600 mt-1">
                  Optional: {formData.designPrompt.length}/300 characters
                </p>
              </div>

              {/* Design Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Item Name */}
                <div>
                  <label htmlFor="itemName" className="block text-sm font-medium text-gray-700 mb-2">
                    Design Name
                  </label>
                  <input
                    type="text"
                    id="itemName"
                    name="itemName"
                    value={formData.itemName}
                    onChange={handleChange}
                    maxLength={50}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-600"
                    placeholder="Name your design"
                  />
                </div>

                {/* Color */}
                <div>
                  <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-2">
                    Primary Color/Pattern
                  </label>
                  <input
                    type="text"
                    id="color"
                    name="color"
                    value={formData.color}
                    onChange={handleChange}
                    maxLength={30}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-600"
                    placeholder="e.g., Navy blue, Floral print"
                  />
                </div>

                {/* Style */}
                <div className="md:col-span-2">
                  <label htmlFor="style" className="block text-sm font-medium text-gray-700 mb-2">
                    Style Notes
                  </label>
                  <input
                    type="text"
                    id="style"
                    name="style"
                    value={formData.style}
                    onChange={handleChange}
                    maxLength={50}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-600"
                    placeholder="e.g., Oversized fit, Vintage inspired, Minimalist"
                  />
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• AI will generate your design based on your description</li>
                  <li>• Your design will be added to the discover page</li>
                  <li>• You&apos;ll be prompted to upvote 3 other submissions to be eligible for rankings</li>
                  <li>• Competition rankings will be determined by community upvotes</li>
                </ul>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting || !formData.outfitDescription.trim()}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {submitting ? 'Creating Design...' : 'Submit Design'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 