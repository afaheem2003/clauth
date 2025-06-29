'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'

export default function CommunityVotePage() {
  const { data: session, status } = useSession()
  const [votingData, setVotingData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [currentView, setCurrentView] = useState('front')
  const [voting, setVoting] = useState(false)
  const [swipeOffset, setSwipeOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [reviewMode, setReviewMode] = useState(false)
  const [reviewPage, setReviewPage] = useState(1)
  const [itemsPerPage] = useState(9) // Show 9 items per page in review mode
  const cardRef = useRef(null)
  const startPosRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    if (session?.user) {
      fetchVotingRound()
    }
  }, [session])

  const fetchVotingRound = async () => {
    try {
      const response = await fetch('/api/voting')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch voting round')
      }

      setVotingData(data)
      
      // Find the first unvoted application
      if (data.applications) {
        const firstUnvoted = data.applications.findIndex(app => app.userVote === null)
        if (firstUnvoted >= 0) {
          setCurrentIndex(firstUnvoted)
        } else {
          // All items voted - check if deadline passed
          const timeRemaining = new Date(data.round.endTime) - new Date()
          if (timeRemaining > 0) {
            // Deadline hasn't passed, enter review mode
            setReviewMode(true)
            setCurrentIndex(0)
          } else {
            setCurrentIndex(0)
          }
        }
      }
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const submitVote = async (isUpvote) => {
    if (!votingData?.applications[currentIndex]) return
    
    const currentApp = votingData.applications[currentIndex]
    setVoting(true)
    
    try {
      const response = await fetch('/api/voting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roundApplicationId: currentApp.id, isUpvote })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit vote')
      }

      // Update local state with new vote
      setVotingData(prev => ({
        ...prev,
        applications: prev.applications.map(app => 
          app.id === currentApp.id 
            ? { 
                ...app, 
                userVote: isUpvote,
                upvotes: data.vote.updatedCounts.upvotes,
                totalVotes: data.vote.updatedCounts.totalVotes
              }
            : app
        ),
        userProgress: {
          ...prev.userProgress,
          votesCount: prev.userProgress.votesCount + (currentApp.userVote === null ? 1 : 0),
          isComplete: prev.userProgress.votesCount + 1 === prev.userProgress.totalApplications
        }
      }))

      // Only auto-navigate to next unvoted item if not in review mode
      if (!reviewMode) {
        // Move to next unvoted application
        const nextUnvoted = votingData.applications.findIndex((app, idx) => 
          idx > currentIndex && app.userVote === null
        )
        
        if (nextUnvoted >= 0) {
          setCurrentIndex(nextUnvoted)
          setCurrentView('front') // Reset to front view for next item
        } else {
          // Find any remaining unvoted from the beginning
          const anyUnvoted = votingData.applications.findIndex(app => app.userVote === null)
          if (anyUnvoted >= 0) {
            setCurrentIndex(anyUnvoted)
            setCurrentView('front')
          }
        }
      }

    } catch (error) {
      setError(error.message)
    } finally {
      setVoting(false)
    }
  }

  const handleSwipeVote = (isUpvote) => {
    // Animate card off screen
    const direction = isUpvote ? 1 : -1
    setSwipeOffset(direction * 400)
    
    setTimeout(() => {
      submitVote(isUpvote)
      setSwipeOffset(0)
      setIsDragging(false)
    }, 200)
  }

  // Touch/Mouse handlers for swipe
  const handleStart = (clientX, clientY) => {
    if (voting) return
    setIsDragging(true)
    startPosRef.current = { x: clientX, y: clientY }
  }

  const handleMove = (clientX, clientY) => {
    if (!isDragging || voting) return
    
    const deltaX = clientX - startPosRef.current.x
    const deltaY = clientY - startPosRef.current.y
    
    // Only allow horizontal swipes
    if (Math.abs(deltaY) > Math.abs(deltaX)) return
    
    setSwipeOffset(Math.max(-150, Math.min(150, deltaX)))
  }

  const handleEnd = () => {
    if (!isDragging || voting) return
    
    const threshold = 80
    
    if (swipeOffset > threshold) {
      // Swipe right = Love
      handleSwipeVote(true)
    } else if (swipeOffset < -threshold) {
      // Swipe left = Pass
      handleSwipeVote(false)
    } else {
      // Snap back
      setSwipeOffset(0)
      setIsDragging(false)
    }
  }

  // Mouse events
  const handleMouseDown = (e) => handleStart(e.clientX, e.clientY)
  const handleMouseMove = (e) => handleMove(e.clientX, e.clientY)
  const handleMouseUp = () => handleEnd()

  // Touch events
  const handleTouchStart = (e) => {
    const touch = e.touches[0]
    handleStart(touch.clientX, touch.clientY)
  }
  const handleTouchMove = (e) => {
    const touch = e.touches[0]
    handleMove(touch.clientX, touch.clientY)
  }
  const handleTouchEnd = () => handleEnd()

  const goToNext = () => {
    if (currentIndex < votingData.applications.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setCurrentView('front')
    }
  }

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setCurrentView('front')
    }
  }

  const toggleView = () => {
    setCurrentView(prev => prev === 'front' ? 'back' : 'front')
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-6 text-gray-600 font-light text-lg">Loading community vote...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="max-w-lg mx-auto px-4 text-center">
          <h1 className="text-4xl font-light text-black mb-6">Community Vote</h1>
          <p className="text-lg text-gray-600 mb-8">
            Sign in to participate in community voting
          </p>
          <Link
            href="/login"
            className="inline-block bg-black text-white px-8 py-3 font-medium hover:bg-gray-900 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  if (session.user.waitlistStatus !== 'APPROVED') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-light text-black mb-6">Community Vote</h1>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-8">
            <p className="text-lg text-blue-900 mb-4">
              Community voting is for approved members only
            </p>
            <p className="text-blue-800">
              Once you're approved to join CLAUTH, you'll be able to help shape our community by voting on new applicants' designs.
            </p>
          </div>
          <Link
            href="/waitlist-status"
            className="inline-block mt-6 text-gray-600 hover:text-gray-900 underline"
          >
            Check your application status
          </Link>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="max-w-lg mx-auto px-4 text-center">
          <h1 className="text-4xl font-light text-black mb-6">Oops!</h1>
          <p className="text-lg text-gray-600 mb-8">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-black text-white px-8 py-3 font-medium hover:bg-gray-900 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!votingData?.hasActiveRound) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-5xl font-extralight text-black mb-8 tracking-tight">
              Community Vote
            </h1>
            <div className="bg-gray-50 rounded-xl p-12">
              <h2 className="text-2xl font-light text-gray-900 mb-4">
                No Active Voting Round
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                There's no community voting happening right now. Check back soon for the next round of designs to review.
              </p>
              <Link
                href="/"
                className="inline-block bg-black text-white px-8 py-3 font-medium hover:bg-gray-900 transition-colors"
              >
                Back to CLAUTH
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const { round, applications, userProgress } = votingData
  const timeRemaining = new Date(round.endTime) - new Date()
  const hoursRemaining = Math.max(0, Math.floor(timeRemaining / (1000 * 60 * 60)))
  const currentApp = applications[currentIndex]

  if (!currentApp && !reviewMode) {
    // Check if deadline has passed
    if (timeRemaining > 0) {
      // Deadline hasn't passed, offer review mode
      return (
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="max-w-lg mx-auto px-4 text-center">
            <h1 className="text-4xl font-light text-black mb-6">All Done!</h1>
            <p className="text-lg text-gray-600 mb-6">
              You've voted on all available applications.
            </p>
            <p className="text-base text-gray-500 mb-8">
              The deadline hasn't passed yet. Would you like to review and change any of your votes?
            </p>
            <div className="space-y-4">
              <button
                onClick={() => {
                  setReviewMode(true)
                  setCurrentIndex(0)
                }}
                className="block w-full bg-black text-white px-8 py-3 font-medium hover:bg-gray-900 transition-colors"
              >
                Review My Votes
              </button>
              <Link
                href="/"
                className="block text-gray-600 hover:text-gray-900 underline"
              >
                Back to CLAUTH
              </Link>
            </div>
          </div>
        </div>
      )
    } else {
      // Deadline has passed
      return (
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="max-w-lg mx-auto px-4 text-center">
            <h1 className="text-4xl font-light text-black mb-6">All Done!</h1>
            <p className="text-lg text-gray-600 mb-8">
              You've voted on all available applications. Thank you for participating!
            </p>
            <Link
              href="/"
              className="bg-black text-white px-8 py-3 font-medium hover:bg-gray-900 transition-colors"
            >
              Back to CLAUTH
            </Link>
          </div>
        </div>
      )
    }
  }

  const imageUrl = currentView === 'front' 
    ? currentApp.application.clothingItem.imageUrl 
    : (currentApp.application.clothingItem.backImage || currentApp.application.clothingItem.imageUrl)

  const swipeOpacity = Math.abs(swipeOffset) / 100
  const swipeColor = swipeOffset > 0 ? 'text-red-500' : 'text-gray-500'

  return (
    <div className="min-h-screen bg-gray-50">
      <div className={`mx-auto px-4 py-6 ${reviewMode ? 'max-w-4xl' : 'max-w-xs'}`}>
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-black mb-2">
            {reviewMode ? 'Review Your Votes' : 'Vote on New Members'}
          </h1>
          <p className="text-sm text-gray-600 mb-3">
            {reviewMode ? 'Change your mind on any designs' : 'Help decide who joins our creative community'}
          </p>
          <div className="text-xs text-gray-500 space-x-4">
            <span>{hoursRemaining}h remaining</span>
            <span>{userProgress.votesCount}/{userProgress.totalApplications} voted</span>
          </div>
          {reviewMode && (
            <button
              onClick={() => {
                setReviewMode(false)
                // Find first unvoted item or stay at current
                const firstUnvoted = applications.findIndex(app => app.userVote === null)
                if (firstUnvoted >= 0) {
                  setCurrentIndex(firstUnvoted)
                }
              }}
              className="mt-4 inline-flex items-center px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Exit Review Mode
            </button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="w-full bg-gray-200 rounded-full h-1">
            <div 
              className="bg-black h-1 rounded-full transition-all duration-300"
              style={{ width: `${(userProgress.votesCount / userProgress.totalApplications) * 100}%` }}
            ></div>
          </div>
        </div>

        {reviewMode ? (
          // Review Mode - Grid Layout
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {applications
                .slice((reviewPage - 1) * itemsPerPage, reviewPage * itemsPerPage)
                .map((app, index) => {
                  const actualIndex = (reviewPage - 1) * itemsPerPage + index
                  return (
                    <div key={app.id} className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                      {/* Image */}
                      <div className="relative bg-gray-100" style={{ aspectRatio: '683/1024' }}>
                        <Image
                          src={app.application.clothingItem.imageUrl}
                          alt={app.application.clothingItem.name}
                          fill
                          className="object-cover"
                          sizes="200px"
                        />
                        
                        {/* Vote Status Badge */}
                        {app.userVote !== null && (
                          <div className="absolute top-2 left-2">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              app.userVote ? 'bg-red-500 text-white' : 'bg-gray-500 text-white'
                            }`}>
                              {app.userVote ? '♥' : '✕'}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-3">
                        <h3 className="text-sm font-bold text-black mb-1 text-center">
                          {app.application.clothingItem.name}
                        </h3>
                        
                        <div className="text-xs text-gray-500 mb-3 text-center">
                          <p>{app.application.applicant.name}</p>
                          <p>{app.application.clothingItem.itemType}</p>
                        </div>

                        {/* Vote Buttons */}
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setCurrentIndex(actualIndex)
                              submitVote(false)
                            }}
                            disabled={voting}
                            className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                          >
                            Pass
                          </button>
                          <button
                            onClick={() => {
                              setCurrentIndex(actualIndex)
                              submitVote(true)
                            }}
                            disabled={voting}
                            className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                          >
                            ♥ Love
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
            </div>

            {/* Pagination */}
            {Math.ceil(applications.length / itemsPerPage) > 1 && (
              <div className="flex justify-center items-center space-x-2 mb-4">
                <button
                  onClick={() => setReviewPage(prev => Math.max(1, prev - 1))}
                  disabled={reviewPage === 1}
                  className="w-8 h-8 rounded-full bg-white shadow-md hover:shadow-lg disabled:opacity-30 disabled:hover:shadow-md flex items-center justify-center transition-all border border-gray-200"
                >
                  ←
                </button>
                
                {Array.from({ length: Math.ceil(applications.length / itemsPerPage) }, (_, i) => i + 1).map(pageNum => (
                  <button
                    key={pageNum}
                    onClick={() => setReviewPage(pageNum)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                      reviewPage === pageNum
                        ? 'bg-black text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
                
                <button
                  onClick={() => setReviewPage(prev => Math.min(Math.ceil(applications.length / itemsPerPage), prev + 1))}
                  disabled={reviewPage === Math.ceil(applications.length / itemsPerPage)}
                  className="w-8 h-8 rounded-full bg-white shadow-md hover:shadow-lg disabled:opacity-30 disabled:hover:shadow-md flex items-center justify-center transition-all border border-gray-200"
                >
                  →
                </button>
              </div>
            )}
          </div>
        ) : (
          // Normal Voting Mode - Tinder Style
          <>
            {/* Swipe Instructions */}
            <div className="text-center mb-4">
              <p className="text-xs text-gray-400">
                Swipe left to pass • Swipe right to love
              </p>
            </div>

            {/* Main Voting Interface */}
            <div className="relative">
              {/* Design Card */}
              <div 
                ref={cardRef}
                className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden cursor-grab active:cursor-grabbing select-none"
                style={{ 
                  transform: `translateX(${swipeOffset}px) rotate(${swipeOffset * 0.1}deg)`,
                  transition: isDragging ? 'none' : 'transform 0.2s ease-out'
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                {/* Swipe Indicators */}
                {Math.abs(swipeOffset) > 20 && (
                  <>
                    <div 
                      className={`absolute top-6 left-6 z-10 px-3 py-1 rounded-full border-2 font-bold text-sm ${
                        swipeOffset < 0 ? 'border-gray-500 text-gray-500 bg-white' : 'border-transparent text-transparent'
                      }`}
                      style={{ opacity: swipeOffset < 0 ? swipeOpacity : 0 }}
                    >
                      PASS
                    </div>
                    <div 
                      className={`absolute top-6 right-6 z-10 px-3 py-1 rounded-full border-2 font-bold text-sm ${
                        swipeOffset > 0 ? 'border-red-500 text-red-500 bg-white' : 'border-transparent text-transparent'
                      }`}
                      style={{ opacity: swipeOffset > 0 ? swipeOpacity : 0 }}
                    >
                      LOVE
                    </div>
                  </>
                )}

                {/* Image */}
                <div className="relative bg-gray-100" style={{ aspectRatio: '683/1024' }}>
                  <Image
                    src={imageUrl}
                    alt={currentApp.application.clothingItem.name}
                    fill
                    className="object-cover"
                    sizes="300px"
                    draggable={false}
                  />
                  
                  {/* Front/Back Navigation */}
                  {currentApp.application.clothingItem.backImage && (
                    <>
                      <div className="absolute inset-y-0 left-0 flex items-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setCurrentView(currentView === 'front' ? 'back' : 'front')
                          }}
                          className="bg-black/70 hover:bg-black/90 rounded-full p-2 shadow-lg transition-all duration-200 ml-2"
                        >
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                      </div>
                      
                      <div className="absolute inset-y-0 right-0 flex items-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setCurrentView(currentView === 'front' ? 'back' : 'front')
                          }}
                          className="bg-black/70 hover:bg-black/90 rounded-full p-2 shadow-lg transition-all duration-200 mr-2"
                        >
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                      
                      {/* View indicator */}
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                        <div className="flex space-x-2">
                          <div className={`w-2 h-2 rounded-full transition-all duration-200 ${currentView === 'front' ? 'bg-white' : 'bg-white/50'}`}></div>
                          <div className={`w-2 h-2 rounded-full transition-all duration-200 ${currentView === 'back' ? 'bg-white' : 'bg-white/50'}`}></div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Vote Status */}
                  {currentApp.userVote !== null && (
                    <div className="absolute top-3 left-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        currentApp.userVote ? 'bg-red-500 text-white' : 'bg-gray-500 text-white'
                      }`}>
                        {currentApp.userVote ? '♥' : '✕'}
                      </div>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <h2 className="text-lg font-bold text-black mb-2 text-center">
                    {currentApp.application.clothingItem.name}
                  </h2>
                  
                  {currentApp.application.clothingItem.description && (
                    <p className="text-sm text-gray-600 mb-4 text-center">
                      {currentApp.application.clothingItem.description}
                    </p>
                  )}

                  <div className="text-xs text-gray-500 space-y-1 mb-4 text-center">
                    <p><span className="font-medium">Designer:</span> {currentApp.application.applicant.name}</p>
                    <p><span className="font-medium">Type:</span> {currentApp.application.clothingItem.itemType}</p>
                    <p><span className="font-medium">Gender:</span> {currentApp.application.clothingItem.gender === 'MASCULINE' ? 'Male' : currentApp.application.clothingItem.gender === 'FEMININE' ? 'Female' : 'Unisex'}</p>
                  </div>

                  {/* Vote Buttons */}
                  {reviewMode && currentApp.userVote !== null && (
                    <div className="text-center mb-3">
                      <p className="text-xs text-gray-500">
                        Currently: <span className={`font-medium ${currentApp.userVote ? 'text-red-600' : 'text-gray-600'}`}>
                          {currentApp.userVote ? '♥ Loved' : 'Passed'}
                        </span>
                      </p>
                    </div>
                  )}
                  {currentApp.userVote === null || reviewMode ? (
                    <div className="flex space-x-3">
                      <button
                        onClick={() => submitVote(false)}
                        disabled={voting}
                        className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-xl font-bold transition-colors disabled:opacity-50"
                      >
                        {voting ? '...' : 'Pass'}
                      </button>
                      <button
                        onClick={() => submitVote(true)}
                        disabled={voting}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center justify-center space-x-1"
                      >
                        <span>♥</span>
                        <span>{voting ? '...' : 'Love'}</span>
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-3">
                      <span className={`inline-flex items-center px-4 py-2 rounded-xl font-bold ${
                        currentApp.userVote 
                          ? 'bg-red-50 text-red-700' 
                          : 'bg-gray-50 text-gray-700'
                      }`}>
                        {currentApp.userVote ? '♥ Loved' : 'Passed'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between mt-4">
                <button
                  onClick={goToPrevious}
                  disabled={currentIndex === 0}
                  className="w-10 h-10 rounded-full bg-white shadow-md hover:shadow-lg disabled:opacity-30 disabled:hover:shadow-md flex items-center justify-center transition-all border border-gray-200"
                >
                  ←
                </button>
                
                <div className="text-center">
                  <span className="text-xs font-medium text-gray-700">
                    {currentIndex + 1} of {applications.length}
                  </span>
                  <p className="text-xs text-gray-400">
                    Applicants
                  </p>
                </div>
                
                <button
                  onClick={goToNext}
                  disabled={currentIndex === applications.length - 1}
                  className="w-10 h-10 rounded-full bg-white shadow-md hover:shadow-lg disabled:opacity-30 disabled:hover:shadow-md flex items-center justify-center transition-all border border-gray-200"
                >
                  →
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
} 