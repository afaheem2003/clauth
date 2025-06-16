'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

export default function CreateGroupPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    handle: '',
    description: '',
    maxMembers: 20,
    isPrivate: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [handleManuallyEdited, setHandleManuallyEdited] = useState(false);
  
  // Handle availability checking state
  const [handleStatus, setHandleStatus] = useState({
    checking: false,
    available: null,
    message: '',
    lastChecked: ''
  });

  // Debounced handle availability check
  const checkHandleAvailability = useCallback(async (handle) => {
    if (!handle || handle.length < 3) {
      setHandleStatus({
        checking: false,
        available: false,
        message: handle.length > 0 ? 'Handle must be at least 3 characters' : '',
        lastChecked: handle
      });
      return;
    }

    setHandleStatus(prev => ({ ...prev, checking: true, lastChecked: handle }));

    try {
      const response = await fetch('/api/challenges/groups/check-handle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ handle }),
      });

      const data = await response.json();
      
      // Only update if this is still the latest check
      if (handle === formData.handle.trim().toLowerCase()) {
        setHandleStatus({
          checking: false,
          available: data.available,
          message: data.message || data.reason || '',
          lastChecked: handle
        });
      }
    } catch (error) {
      console.error('Error checking handle:', error);
      setHandleStatus({
        checking: false,
        available: false,
        message: 'Error checking availability',
        lastChecked: handle
      });
    }
  }, [formData.handle]);

  // Debounce handle checking
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const trimmedHandle = formData.handle.trim().toLowerCase();
      if (trimmedHandle && trimmedHandle !== handleStatus.lastChecked) {
        checkHandleAvailability(trimmedHandle);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.handle, checkHandleAvailability, handleStatus.lastChecked]);

  // Auto-generate handle from name
  useEffect(() => {
    if (formData.name && !formData.handle && !handleManuallyEdited) {
      const autoHandle = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '_')
        .slice(0, 20);
      
      setFormData(prev => ({ ...prev, handle: autoHandle }));
    }
  }, [formData.name, formData.handle, handleManuallyEdited]);

  // Handle authentication redirect
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!handleStatus.available) {
      setError('Please choose an available handle before creating the group');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/challenges/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          handle: formData.handle.trim().toLowerCase()
        }),
      });

      const data = await response.json();

      if (data.success) {
        router.push(`/challenges/groups/@${data.group.handle}`);
      } else {
        setError(data.error || 'Failed to create group');
      }
    } catch (error) {
      console.error('Error creating group:', error);
      setError('Failed to create group. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'handle') {
      // Mark handle as manually edited when user types in it
      setHandleManuallyEdited(true);
      // Clean handle input in real-time
      const cleanedHandle = value.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20);
      setFormData(prev => ({ ...prev, [name]: cleanedHandle }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: name === 'maxMembers' ? parseInt(value) || 20 : value
      }));
    }
  };

  const getHandleStatusIcon = () => {
    if (handleStatus.checking) {
      return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>;
    }
    if (handleStatus.available === true) {
      return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
    }
    if (handleStatus.available === false && formData.handle.length >= 3) {
      return <XCircleIcon className="w-5 h-5 text-red-500" />;
    }
    return null;
  };

  const getHandleStatusColor = () => {
    if (handleStatus.available === true) return 'text-green-600';
    if (handleStatus.available === false && formData.handle.length >= 3) return 'text-red-600';
    return 'text-gray-600';
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
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
          <h1 className="text-3xl font-bold text-gray-900">Create Challenge Group</h1>
          <p className="text-gray-600 mt-2">
            Start a new group to share daily fashion challenges with friends
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

            {/* Group Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Group Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                maxLength={50}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-600 text-gray-900"
                placeholder="Enter a creative group name"
              />
              <p className="text-xs text-gray-600 mt-1">
                {formData.name.length}/50 characters
              </p>
            </div>

            {/* Handle */}
            <div>
              <label htmlFor="handle" className="block text-sm font-medium text-gray-700 mb-2">
                Group Handle *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">@</span>
                </div>
                <input
                  type="text"
                  id="handle"
                  name="handle"
                  value={formData.handle}
                  onChange={handleChange}
                  required
                  maxLength={20}
                  className={`w-full pl-8 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-600 text-gray-900 ${
                    handleStatus.available === true ? 'border-green-300' :
                    handleStatus.available === false && formData.handle.length >= 3 ? 'border-red-300' :
                    'border-gray-300'
                  }`}
                  placeholder="your_group_handle"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  {getHandleStatusIcon()}
                </div>
              </div>
              <div className="flex justify-between items-center mt-1">
                <p className={`text-xs ${getHandleStatusColor()}`}>
                  {handleStatus.message || 'Your unique group identifier'}
                </p>
                <p className="text-xs text-gray-600">
                  {formData.handle.length}/20 characters
                </p>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Only letters, numbers, and underscores.
              </p>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                maxLength={200}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-600 text-gray-900"
                placeholder="What's your group about? What style are you going for?"
              />
              <p className="text-xs text-gray-600 mt-1">
                {formData.description.length}/200 characters
              </p>
            </div>

            {/* Max Members */}
            <div>
              <label htmlFor="maxMembers" className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Members
              </label>
              <select
                id="maxMembers"
                name="maxMembers"
                value={formData.maxMembers}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
              >
                <option value={5}>5 members</option>
                <option value={10}>10 members</option>
                <option value={15}>15 members</option>
                <option value={20}>20 members</option>
                <option value={30}>30 members</option>
                <option value={50}>50 members</option>
              </select>
              <p className="text-xs text-gray-600 mt-1">
                You can change this later if needed
              </p>
            </div>

            {/* Info Box */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">What happens next?</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• You&apos;ll get a shareable invite code for your group</li>
                <li>• Invite friends to join your fashion challenge group</li>
                <li>• Share and get inspired by each other&apos;s outfits</li>
                <li>• Compete in daily challenges together</li>
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
                disabled={loading || !formData.name.trim() || !handleStatus.available}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Creating...' : 'Create Group'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 