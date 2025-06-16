'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PlusIcon, CalendarIcon, TrashIcon, PencilIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

// Extend dayjs with timezone support
dayjs.extend(utc);
dayjs.extend(timezone);

export default function AdminChallengesPage() {
  const router = useRouter();
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const EASTERN_TIMEZONE = 'America/New_York';

  useEffect(() => {
    fetchChallenges();
  }, [selectedMonth]);

  const fetchChallenges = async () => {
    try {
      const startDate = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
      const endDate = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0);
      
      const response = await fetch(`/api/admin/challenges?start=${startDate.toISOString()}&end=${endDate.toISOString()}`);
      
      if (response.ok) {
        const data = await response.json();
        setChallenges(data.challenges || []);
      }
    } catch (error) {
      console.error('Error fetching challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteChallenge = async (challengeId) => {
    if (!confirm('Are you sure you want to delete this challenge? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/challenges/${challengeId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setChallenges(prev => prev.filter(c => c.id !== challengeId));
      } else {
        alert('Failed to delete challenge');
      }
    } catch (error) {
      console.error('Error deleting challenge:', error);
      alert('Failed to delete challenge');
    }
  };

  const navigateMonth = (direction) => {
    const newMonth = new Date(selectedMonth);
    newMonth.setMonth(newMonth.getMonth() + direction);
    setSelectedMonth(newMonth);
  };

  const handleDateClick = (date) => {
    // Format date as YYYY-MM-DD for the URL parameter
    const formattedDate = dayjs(date).format('YYYY-MM-DD');
    router.push(`/admin/challenges/create?date=${formattedDate}`);
  };

  const getDaysInMonth = () => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      // Create calendar date in Eastern timezone
      const calendarDateET = dayjs.tz(new Date(year, month, day), EASTERN_TIMEZONE);
      
      // Find challenge for this date by comparing in Eastern timezone
      const challenge = challenges.find(c => {
        const challengeDateET = dayjs.tz(c.date, EASTERN_TIMEZONE);
        return calendarDateET.format('YYYY-MM-DD') === challengeDateET.format('YYYY-MM-DD');
      });
      
      days.push({ day, date: new Date(year, month, day), challenge });
    }
    
    return days;
  };

  // Function to determine challenge status dynamically
  const getChallengeStatus = (challenge) => {
    const now = dayjs().tz(EASTERN_TIMEZONE);
    
    // Convert all stored UTC times to Eastern timezone for comparison
    const competitionStart = challenge.competitionStart ? 
      dayjs.utc(challenge.competitionStart).tz(EASTERN_TIMEZONE) : 
      // For legacy challenges without competitionStart, use challenge date at start of day
      dayjs.tz(challenge.date, EASTERN_TIMEZONE).startOf('day');
    const submissionDeadline = dayjs.utc(challenge.submissionDeadline).tz(EASTERN_TIMEZONE);
    const competitionEnd = challenge.competitionEnd ? 
      dayjs.utc(challenge.competitionEnd).tz(EASTERN_TIMEZONE) : submissionDeadline;

    if (now < competitionStart) {
      return { 
        status: 'scheduled', 
        color: 'text-blue-800', 
        bg: 'bg-blue-100 border border-blue-200' 
      };
    } else if (now < submissionDeadline) {
      return { 
        status: 'accepting submissions', 
        color: 'text-green-800', 
        bg: 'bg-green-100 border border-green-200' 
      };
    } else if (now < competitionEnd) {
      return { 
        status: 'voting only', 
        color: 'text-orange-800', 
        bg: 'bg-orange-100 border border-orange-200' 
      };
    } else {
      return { 
        status: 'completed', 
        color: 'text-gray-800', 
        bg: 'bg-gray-100 border border-gray-200' 
      };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const monthYear = selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const days = getDaysInMonth();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Challenge Management</h1>
          <p className="text-gray-600 mt-2">Schedule and manage daily fashion challenges</p>
        </div>
        <Link
          href="/admin/challenges/create"
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Schedule Challenge
        </Link>
      </div>

      {/* Calendar Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigateMonth(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ←
          </button>
          <h2 className="text-xl font-semibold text-gray-900">{monthYear}</h2>
          <button
            onClick={() => navigateMonth(1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            →
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Day headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-3 text-center text-sm font-medium text-gray-500 border-b">
              {day}
            </div>
          ))}
          
          {/* Calendar days */}
          {days.map((dayData, index) => (
            <div 
              key={index} 
              className={`min-h-24 p-2 border border-gray-100 ${
                dayData && !dayData.challenge 
                  ? 'hover:bg-indigo-50 cursor-pointer transition-colors' 
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => {
                if (dayData && !dayData.challenge) {
                  handleDateClick(dayData.date);
                }
              }}
            >
              {dayData ? (
                <>
                  <div className="text-sm text-gray-900 font-medium mb-1">
                    {dayData.day}
                  </div>
                  {dayData.challenge ? (
                    <div className={`text-xs p-2 rounded-md ${getChallengeStatus(dayData.challenge).bg}`}>
                      <div className="font-semibold truncate text-gray-900">
                        {dayData.challenge.mainItem || 'General Challenge'}
                      </div>
                      <div className="truncate text-gray-800 mb-1">{dayData.challenge.theme}</div>
                      <div className="flex items-center justify-between mt-1">
                        <div className={`text-xs px-2 py-1 rounded font-medium ${getChallengeStatus(dayData.challenge).color} bg-white bg-opacity-70`}>
                          {getChallengeStatus(dayData.challenge).status}
                        </div>
                        <div className="flex space-x-1">
                          <Link
                            href={`/admin/challenges/edit/${dayData.challenge.id}`}
                            className="text-blue-700 hover:text-blue-900"
                          >
                            <PencilIcon className="w-3 h-3" />
                          </Link>
                          <button
                            onClick={() => deleteChallenge(dayData.challenge.id)}
                            className="text-red-700 hover:text-red-900"
                          >
                            <TrashIcon className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400 text-center py-4 border-2 border-dashed border-gray-200 rounded-md hover:border-indigo-300 hover:text-indigo-600 transition-colors">
                      Click to schedule
                    </div>
                  )}
                </>
              ) : (
                <div className="text-sm text-gray-300">&nbsp;</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <CalendarIcon className="w-8 h-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Challenges</p>
              <p className="text-2xl font-bold text-gray-900">{challenges.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 bg-green-600 rounded-full"></div>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Currently Active</p>
              <p className="text-2xl font-bold text-gray-900">
                {challenges.filter(c => {
                  const status = getChallengeStatus(c);
                  return status.status === 'accepting submissions' || status.status === 'voting only';
                }).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 bg-gray-600 rounded-full"></div>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Completed Challenges</p>
              <p className="text-2xl font-bold text-gray-900">
                {challenges.filter(c => {
                  const status = getChallengeStatus(c);
                  return status.status === 'completed';
                }).length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 