'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon, CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

export default function PastChallengesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [challenges, setChallenges] = useState({});
  const [selectedDaySubmissions, setSelectedDaySubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      fetchChallenges();
    }
  }, [status, router, currentMonth]);

  const fetchChallenges = async () => {
    try {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;
      
      const response = await fetch(`/api/challenges/past?year=${year}&month=${month}`);
      if (response.ok) {
        const data = await response.json();
        setChallenges(data.challenges || {});
      }
    } catch (error) {
      console.error('Error fetching challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDaySubmissions = async (date) => {
    setLoadingSubmissions(true);
    try {
      const response = await fetch(`/api/challenges/past/${date}/submissions`);
      if (response.ok) {
        const data = await response.json();
        setSelectedDaySubmissions(data.submissions || []);
      }
    } catch (error) {
      console.error('Error fetching day submissions:', error);
      setSelectedDaySubmissions([]);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const handleDateClick = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    if (challenges[dateStr]) {
      setSelectedDate(date);
      fetchDaySubmissions(dateStr);
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const navigateMonth = (direction) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
    setSelectedDate(null);
    setSelectedDaySubmissions([]);
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const days = getDaysInMonth(currentMonth);
  const monthYear = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/challenges"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to Challenges
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Past Challenges</h1>
          <p className="text-gray-600 mt-2">
            Browse previous daily challenges and discover top submissions
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Calendar */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">{monthYear}</h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => navigateMonth(-1)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <ChevronLeftIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => navigateMonth(1)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <ChevronRightIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {days.map((date, index) => {
                if (!date) {
                  return <div key={index} className="p-2"></div>;
                }

                const dateStr = date.toISOString().split('T')[0];
                const hasChallenge = challenges[dateStr];
                const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
                const isToday = date.toDateString() === new Date().toDateString();

                return (
                  <button
                    key={date.toISOString()}
                    onClick={() => handleDateClick(date)}
                    disabled={!hasChallenge}
                    className={`p-2 text-sm rounded-lg transition-colors relative ${
                      isSelected
                        ? 'bg-indigo-600 text-white'
                        : hasChallenge
                        ? 'hover:bg-indigo-50 text-gray-900'
                        : 'text-gray-400 cursor-not-allowed'
                    } ${isToday ? 'ring-2 ring-indigo-200' : ''}`}
                  >
                    {date.getDate()}
                    {hasChallenge && (
                      <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                        <div className={`w-1 h-1 rounded-full ${
                          isSelected ? 'bg-white' : 'bg-indigo-600'
                        }`}></div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-4 text-xs text-gray-500">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                  <span>Has challenge</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 border-2 border-indigo-200 rounded-full"></div>
                  <span>Today</span>
                </div>
              </div>
            </div>
          </div>

          {/* Selected Day Details */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {selectedDate ? (
              <>
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {formatDate(selectedDate)}
                  </h3>
                  {challenges[selectedDate.toISOString().split('T')[0]] && (
                    <div className="bg-indigo-50 rounded-lg p-4">
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm font-medium text-indigo-900">Theme:</span>
                          <p className="text-indigo-800">
                            {challenges[selectedDate.toISOString().split('T')[0]].theme}
                          </p>
                        </div>
                        {challenges[selectedDate.toISOString().split('T')[0]].mainItem && (
                          <div>
                            <span className="text-sm font-medium text-indigo-900">Main Item:</span>
                            <p className="text-indigo-800">
                              {challenges[selectedDate.toISOString().split('T')[0]].mainItem}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Top Submissions</h4>
                  {loadingSubmissions ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                    </div>
                  ) : selectedDaySubmissions.length > 0 ? (
                    <div className="space-y-4">
                      {selectedDaySubmissions.slice(0, 5).map((submission, index) => (
                        <div key={submission.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0">
                              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                                <span className="text-sm font-medium text-indigo-600">
                                  #{index + 1}
                                </span>
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="text-sm font-medium text-gray-900">
                                  {submission.user.displayName || submission.user.name}
                                </span>
                                <span className="text-xs text-gray-500">
                                  ❤️ {submission.upvoteCount || 0}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 italic">
                                "{submission.outfitDescription}"
                              </p>
                            </div>
                            {submission.generatedImageUrl && (
                              <div className="flex-shrink-0">
                                <img
                                  src={submission.generatedImageUrl}
                                  alt="Submission"
                                  className="w-12 h-12 object-cover rounded-lg border border-gray-200"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">
                      No submissions found for this day
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Date</h3>
                <p className="text-gray-600">
                  Click on a highlighted date in the calendar to view that day's challenge and top submissions
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 