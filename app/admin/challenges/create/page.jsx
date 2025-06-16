'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

// Extend dayjs with timezone support
dayjs.extend(utc);
dayjs.extend(timezone);

export default function CreateChallengePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    date: '',
    mainItem: '',
    itemType: '',
    subType: '',
    theme: '',
    description: '',
    submissionDeadline: '',
    competitionStart: '',
    competitionEnd: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const EASTERN_TIMEZONE = 'America/New_York';

  // Check for date parameter in URL and pre-fill the form
  useEffect(() => {
    const dateParam = searchParams.get('date');
    if (dateParam) {
      // Validate the date format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (dateRegex.test(dateParam)) {
        updateDefaultTimes(dateParam);
      }
    }
  }, [searchParams]);

  // Generic clothing categories
  const itemTypes = [
    { value: 'tops', label: 'Tops' },
    { value: 'bottoms', label: 'Bottoms' },
    { value: 'outerwear', label: 'Outerwear' },
    { value: 'dresses', label: 'Dresses' },
    { value: 'shoes', label: 'Shoes' },
    { value: 'accessories', label: 'Accessories' }
  ];

  const subTypes = {
    tops: ['T-shirt', 'Tank top', 'Blouse', 'Shirt', 'Sweater', 'Hoodie', 'Crop top'],
    bottoms: ['Jeans', 'Shorts', 'Skirt', 'Leggings', 'Trousers', 'Sweatpants'],
    outerwear: ['Jacket', 'Coat', 'Blazer', 'Cardigan', 'Vest'],
    dresses: ['Casual dress', 'Formal dress', 'Maxi dress', 'Mini dress'],
    shoes: ['Sneakers', 'Boots', 'Heels', 'Flats', 'Sandals'],
    accessories: ['Hat', 'Bag', 'Jewelry', 'Scarf', 'Belt']
  };

  // Set default times with correct timeline in Eastern timezone
  const updateDefaultTimes = (date) => {
    if (date) {
      // Parse the date components to avoid timezone interpretation
      const [year, month, day] = date.split('-').map(Number);
      
      // Create times in Eastern timezone using explicit date components
      const compStartET = dayjs.tz(new Date(year, month - 1, day, 9, 0, 0), EASTERN_TIMEZONE);  // 9:00 AM
      const deadlineET = dayjs.tz(new Date(year, month - 1, day, 20, 0, 0), EASTERN_TIMEZONE);  // 8:00 PM
      const compEndET = dayjs.tz(new Date(year, month - 1, day, 21, 0, 0), EASTERN_TIMEZONE);   // 9:00 PM
      
      setFormData(prev => ({
        ...prev,
        date,
        competitionStart: compStartET.format('YYYY-MM-DDTHH:mm'),
        submissionDeadline: deadlineET.format('YYYY-MM-DDTHH:mm'),
        competitionEnd: compEndET.format('YYYY-MM-DDTHH:mm')
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Build the main item from type and subtype if provided
      let mainItemText = '';
      if (formData.itemType && formData.subType) {
        mainItemText = formData.subType;
      } else if (formData.mainItem) {
        mainItemText = formData.mainItem;
      }

      const submitData = {
        ...formData,
        mainItem: mainItemText || null,
        // Convert Eastern timezone inputs to UTC for storage
        competitionStart: formData.competitionStart ? 
          dayjs.tz(formData.competitionStart, EASTERN_TIMEZONE).utc().toISOString() : null,
        submissionDeadline: formData.submissionDeadline ? 
          dayjs.tz(formData.submissionDeadline, EASTERN_TIMEZONE).utc().toISOString() : null,
        competitionEnd: formData.competitionEnd ? 
          dayjs.tz(formData.competitionEnd, EASTERN_TIMEZONE).utc().toISOString() : null,
        isActive: true // Automatically set to active for properly scheduled challenges
      };

      const response = await fetch('/api/admin/challenges', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();

      if (data.success) {
        router.push('/admin/challenges');
      } else {
        setError(data.error || 'Failed to create challenge');
      }
    } catch (error) {
      console.error('Error creating challenge:', error);
      setError('Failed to create challenge. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'date') {
      updateDefaultTimes(value);
    } else if (name === 'itemType') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        subType: '' // Reset subtype when main type changes
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  // Pre-defined challenge templates for inspiration
  const challengeTemplates = [
    {
      itemType: 'tops',
      subType: 'Hoodie',
      theme: "Y2K tennis club party",
      description: "Style a hoodie with Y2K vibes for a retro tennis club aesthetic"
    },
    {
      itemType: 'outerwear',
      subType: 'Blazer',
      theme: "Academic dark academia",
      description: "Create a sophisticated academic look with a blazer"
    },
    {
      itemType: 'tops',
      subType: 'T-shirt',
      theme: "90s grunge revival",
      description: "Style a vintage band tee with modern grunge elements"
    },
    {
      itemType: 'dresses',
      subType: 'Casual dress',
      theme: "Ethereal cottagecore",
      description: "Design a dreamy cottagecore outfit featuring a casual dress"
    },
    {
      itemType: 'bottoms',
      subType: 'Jeans',
      theme: "Urban streetwear",
      description: "Create a fresh streetwear look centered around jeans"
    }
  ];

  const applyTemplate = (template) => {
    setFormData(prev => ({
      ...prev,
      itemType: template.itemType,
      subType: template.subType,
      theme: template.theme,
      description: template.description
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/admin/challenges"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to Challenges
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Schedule New Challenge</h1>
          <p className="text-gray-600 mt-2">Create a daily fashion challenge for all groups</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              {/* Date */}
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                  Challenge Date *
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                />
              </div>

              {/* Clothing Item (Optional) */}
              <div className="space-y-4">
                <div className="flex items-center">
                  <h3 className="text-sm font-medium text-gray-700">Clothing Item (Optional)</h3>
                  <span className="ml-2 text-xs text-gray-500">Leave empty for any outfit challenge</span>
                </div>
                
                {/* Item Type */}
                <div>
                  <label htmlFor="itemType" className="block text-sm font-medium text-gray-500 mb-2">
                    Category
                  </label>
                  <select
                    id="itemType"
                    name="itemType"
                    value={formData.itemType}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                  >
                    <option value="">Select category (optional)</option>
                    {itemTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sub Type */}
                {formData.itemType && (
                  <div>
                    <label htmlFor="subType" className="block text-sm font-medium text-gray-500 mb-2">
                      Specific Item
                    </label>
                    <select
                      id="subType"
                      name="subType"
                      value={formData.subType}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                    >
                      <option value="">Select item (optional)</option>
                      {subTypes[formData.itemType]?.map((subType) => (
                        <option key={subType} value={subType}>
                          {subType}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Manual Item Input */}
                <div>
                  <label htmlFor="mainItem" className="block text-sm font-medium text-gray-500 mb-2">
                    Or specify custom item
                  </label>
                  <input
                    type="text"
                    id="mainItem"
                    name="mainItem"
                    value={formData.mainItem}
                    onChange={handleChange}
                    maxLength={100}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-600"
                    placeholder="e.g., vintage band tee, silk scarf"
                  />
                </div>
              </div>

              {/* Theme */}
              <div>
                <label htmlFor="theme" className="block text-sm font-medium text-gray-700 mb-2">
                  Theme *
                </label>
                <input
                  type="text"
                  id="theme"
                  name="theme"
                  value={formData.theme}
                  onChange={handleChange}
                  required
                  maxLength={100}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-600"
                  placeholder="e.g., Y2K tennis club party, dark academia"
                />
                <p className="text-xs text-gray-600 mt-1">
                  The aesthetic or style theme participants should follow
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
                  maxLength={500}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-600"
                  placeholder="Optional: Provide additional context or inspiration for the challenge..."
                />
                <p className="text-xs text-gray-600 mt-1">
                  {formData.description.length}/500 characters
                </p>
              </div>

              {/* Competition Period */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="competitionStart" className="block text-sm font-medium text-gray-700 mb-2">
                    Challenge Reveal Time *
                  </label>
                  <input
                    type="datetime-local"
                    id="competitionStart"
                    name="competitionStart"
                    value={formData.competitionStart}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    When the challenge becomes visible and submissions open
                  </p>
                </div>

                <div>
                  <label htmlFor="competitionEnd" className="block text-sm font-medium text-gray-700 mb-2">
                    Voting Deadline *
                  </label>
                  <input
                    type="datetime-local"
                    id="competitionEnd"
                    name="competitionEnd"
                    value={formData.competitionEnd}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    When voting ends and top 25% are announced
                  </p>
                </div>
              </div>

              {/* Submission Deadline */}
              <div>
                <label htmlFor="submissionDeadline" className="block text-sm font-medium text-gray-700 mb-2">
                  Submission Deadline *
                </label>
                <input
                  type="datetime-local"
                  id="submissionDeadline"
                  name="submissionDeadline"
                  value={formData.submissionDeadline}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                />
                <p className="text-xs text-gray-600 mt-1">
                  When submissions close (voting continues until voting deadline)
                </p>
              </div>

              {/* Timeline Visualization */}
              {formData.competitionStart && formData.submissionDeadline && formData.competitionEnd && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-900 mb-3">Challenge Timeline (Eastern Time)</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                      <div>
                        <span className="font-medium text-blue-900">
                          {dayjs(formData.competitionStart).tz(EASTERN_TIMEZONE).format('dddd, MMMM D, YYYY h:mm A')} ET
                        </span>
                        <span className="text-blue-700 ml-2">— Challenge becomes visible, submissions and voting begin</span>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-orange-500 rounded-full mr-3"></div>
                      <div>
                        <span className="font-medium text-orange-900">
                          {dayjs(formData.submissionDeadline).tz(EASTERN_TIMEZONE).format('dddd, MMMM D, YYYY h:mm A')} ET
                        </span>
                        <span className="text-orange-700 ml-2">— Submissions close, voting continues</span>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                      <div>
                        <span className="font-medium text-green-900">
                          {dayjs(formData.competitionEnd).tz(EASTERN_TIMEZONE).format('dddd, MMMM D, YYYY h:mm A')} ET
                        </span>
                        <span className="text-green-700 ml-2">— Voting ends, top 25% announced</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end space-x-4">
                <Link
                  href="/admin/challenges"
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={loading || !formData.date || !formData.theme}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Creating...' : 'Schedule Challenge'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Templates Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Challenge Templates</h3>
            <p className="text-sm text-gray-600 mb-4">
              Click any template to auto-fill the form with example content:
            </p>
            <div className="space-y-3">
              {challengeTemplates.map((template, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => applyTemplate(template)}
                  className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
                >
                  <div className="font-medium text-sm text-gray-900">{template.mainItem}</div>
                  <div className="text-xs text-indigo-600">{template.theme}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Challenge Timeline Guide (Eastern Time)</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>Before Reveal:</strong> Challenge is completely hidden from users</li>
              <li>• <strong>Reveal → Submission Deadline:</strong> Users can see, submit, and vote</li>
              <li>• <strong>Submission → Voting Deadline:</strong> Only voting allowed</li>
              <li>• <strong>After Voting:</strong> Results announced, top 25% eligible for leaderboard</li>
              <li>• <strong>Default Times:</strong> 9 AM reveal, 8 PM submission deadline, 9 PM voting end (all ET)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 