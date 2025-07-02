'use client'

import { useSession, signOut } from 'next-auth/react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

export default function WaitlistStatusPage() {
  const { data: session, status } = useSession()
  const [isNewUser, setIsNewUser] = useState(false)
  const [applications, setApplications] = useState([])
  const [loadingApplications, setLoadingApplications] = useState(true)
  const [currentView, setCurrentView] = useState('front')

  useEffect(() => {
    // Check if this is a new user (just signed up)
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('new') === 'true') {
      setIsNewUser(true)
      // Clean up the URL
      window.history.replaceState({}, document.title, '/waitlist-status')
    }
  }, [])

  useEffect(() => {
    if (session?.user) {
      fetchApplications()
    }
  }, [session])

  const fetchApplications = async () => {
    try {
      const response = await fetch('/api/waitlist/apply')
      if (response.ok) {
        const data = await response.json()
        setApplications(data.applications)
      }
    } catch (error) {
      console.error('Failed to fetch applications:', error)
    } finally {
      setLoadingApplications(false)
    }
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/waitlist' })
  }

  const getStatusBadge = (status) => {
    const baseClasses = "px-3 py-1 text-sm font-medium rounded-full"
    switch (status) {
      case 'APPROVED':
        return `${baseClasses} bg-green-100 text-green-800`
      case 'IN_VOTING':
        return `${baseClasses} bg-purple-100 text-purple-800`
      case 'WAITLISTED':
        return `${baseClasses} bg-yellow-100 text-yellow-800`
      case 'REJECTED':
        return `${baseClasses} bg-red-100 text-red-800`
      case 'PENDING':
      default:
        return `${baseClasses} bg-blue-100 text-blue-800`
    }
  }

  const getStatusMessage = (status) => {
    switch (status) {
      case 'APPROVED':
        return 'Welcome to CLAUTH! You\'re officially part of our exclusive community.'
      case 'IN_VOTING':
        return 'Your design is being reviewed by our community. Members are voting on your application right now.'
      case 'WAITLISTED':
        return 'Your design will be included in an upcoming community voting round. Stay tuned.'
      case 'REJECTED':
        return 'Keep creating! Your design wasn\'t selected this time, but we\'d love to see more of your work.'
      case 'PENDING':
      default:
        return 'Thanks for joining our community. We\'re carefully curating our early access group and will be in touch soon. Your creativity is exactly what we\'re looking for.'
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-6 text-gray-600 font-light text-lg">Loading your status...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex flex-col">
        {/* Header with subtle navigation */}
        <div className="w-full py-6 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <Link href="/waitlist" className="text-2xl font-bold text-black hover:text-gray-700 transition-colors">
              Clauth
            </Link>
            <Link
              href="/waitlist"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              ← Back to Waitlist
            </Link>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="max-w-lg w-full">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-extralight text-black mb-6 tracking-wide">
                Check Your Status
              </h1>
              <p className="text-lg text-gray-600 font-light leading-relaxed">
                Sign in to view your early access status
              </p>
            </div>

            {/* Sign In Button */}
            <div className="space-y-6">
              <Link
                href="/login"
                className="group relative w-full flex justify-center py-4 px-6 border border-transparent text-base font-medium rounded-xl text-white bg-black hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-all duration-200 transform hover:scale-105"
              >
                <span className="absolute left-0 inset-y-0 flex items-center pl-4">
                  <svg className="h-5 w-5 text-gray-300 group-hover:text-gray-200" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                </span>
                Sign In to Continue
              </Link>
              
              <p className="text-sm text-gray-500">
                Don\'t have an account?{' '}
                <Link href="/waitlist" className="font-medium text-black hover:text-gray-700">
                  Join the community
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="py-6 text-center">
          <p className="text-xs text-gray-400 tracking-widest">
            © 2024 CLAUTH — REDEFINING FASHION
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <div className="mb-12">
              <div className="inline-flex items-center px-6 py-2 bg-black text-white text-sm font-light tracking-widest">
                {session.user.waitlistStatus === 'APPROVED' ? "WELCOME" : "EARLY ACCESS"}
              </div>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-thin text-black mb-8 tracking-tight">
              CLAUTH
            </h1>
            
            {session.user.waitlistStatus === 'APPROVED' ? (
              <>
                <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto font-light leading-relaxed">
                  {getStatusMessage('APPROVED')}
                </p>
                
                <Link
                  href="/"
                  className="inline-block bg-black text-white px-8 py-3 text-lg font-medium hover:bg-gray-900 transition-colors"
                >
                  Enter CLAUTH
                </Link>
              </>
            ) : (
              <>
                <p className="text-xl md:text-2xl text-gray-800 mb-4 max-w-4xl mx-auto font-light leading-relaxed">
                  {getStatusMessage(session.user.waitlistStatus)}
                </p>
                
                {/* Show community voting link for approved users */}
                {session.user.waitlistStatus === 'APPROVED' && (
                  <div className="mb-8">
                    <Link
                      href="/community-vote"
                      className="inline-block bg-purple-600 text-white px-6 py-3 text-base font-medium hover:bg-purple-700 transition-colors rounded-lg mr-4"
                    >
                      Participate in Community Vote
                    </Link>
                  </div>
                )}
                
                {/* Show different messages based on application status */}
                {applications.length > 0 ? (
                  <p className="text-lg text-gray-600 mb-8 max-w-3xl mx-auto font-light leading-relaxed">
                    Thank you for sharing your creativity with us. We\'re carefully reviewing all submissions.
                  </p>
                ) : (
                  <p className="text-lg text-gray-600 mb-8 max-w-3xl mx-auto font-light leading-relaxed">
                    We\'re carefully curating our early access group and will be in touch soon. Your creativity is exactly what we\'re looking for.
                  </p>
                )}
                
                {applications.length === 0 && !loadingApplications && (
                  <div className="mb-8 bg-blue-50 border border-blue-200 rounded-xl p-6 max-w-2xl mx-auto">
                    <p className="text-lg text-blue-900 mb-4 font-medium">
                      Ready to show us your style?
                    </p>
                    <p className="text-blue-800 mb-6 font-light">
                      Submit your first design to join the community voting process. We love seeing fresh creativity.
                    </p>
                    <Link
                      href="/waitlist"
                      className="inline-block bg-black text-white px-6 py-3 text-base font-medium hover:bg-gray-900 transition-colors rounded-lg"
                    >
                      Create Your Design
                    </Link>
                  </div>
                )}
              </>
            )}

            {/* User Info */}
            <div className="max-w-lg mx-auto mb-12 p-6 border border-gray-200 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-4 font-light">
                Signed in as: <span className="font-medium">{session.user.email}</span>
              </p>
              <button
                onClick={handleSignOut}
                className="text-sm text-gray-500 hover:text-gray-700 underline font-light"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Applications Section */}
      {applications.length > 0 && (
      <div className="border-t border-gray-200 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-light text-black mb-6 tracking-wide">YOUR DESIGN</h2>
            <p className="text-gray-600 font-light max-w-2xl mx-auto">
                Here\'s the amazing design you\'ve shared with us
              </p>
            </div>

            <div className="flex justify-center">
              {applications.map((app) => (
                <div key={app.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden w-80">
                  <div className="aspect-[3/4] relative">
                    <Image
                      src={currentView === 'front' ? (app.clothingItem.imageUrl || '/images/placeholder-front.png') : (app.clothingItem.backImage || app.clothingItem.imageUrl || '/images/placeholder-back.png')}
                      alt={`${currentView} view`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 320px"
                    />
                    
                    {/* Navigation arrows */}
                    <div className="absolute inset-y-0 left-0 flex items-center">
                      <button
                        type="button"
                        onClick={() => setCurrentView(currentView === 'front' ? 'back' : 'front')}
                        className="bg-black/70 hover:bg-black/90 rounded-full p-2 shadow-lg transition-all duration-200 ml-3"
                      >
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                    </div>
                    
                    <div className="absolute inset-y-0 right-0 flex items-center">
                      <button
                        type="button"
                        onClick={() => setCurrentView(currentView === 'front' ? 'back' : 'front')}
                        className="bg-black/70 hover:bg-black/90 rounded-full p-2 shadow-lg transition-all duration-200 mr-3"
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
                  </div>
                  
                  <div className="p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">{app.clothingItem.name}</h3>
                    {app.clothingItem.description && (
                      <p className="text-sm text-gray-600 mb-4">{app.clothingItem.description}</p>
                    )}
                    <div className="text-sm text-gray-500 space-y-1">
                      <p>Type: {app.clothingItem.itemType}</p>
                      <p>Gender: {app.clothingItem.gender === 'MASCULINE' ? 'Male' : app.clothingItem.gender === 'FEMININE' ? 'Female' : 'Unisex'}</p>
                    </div>
                  </div>
              </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Loading Applications */}
      {loadingApplications && (
        <div className="border-t border-gray-200 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your designs...</p>
      </div>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center text-gray-400 text-sm font-light tracking-widest">
            © 2024 CLAUTH. ALL RIGHTS RESERVED.
          </div>
        </div>
      </div>
    </div>
  )
} 