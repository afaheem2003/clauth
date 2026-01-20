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
        return `Welcome to CLAUTH! You're officially part of our exclusive community.`
      case 'IN_VOTING':
        return `Your design is being reviewed by our community. Members are voting on your application right now.`
      case 'WAITLISTED':
        return `Your design will be included in an upcoming community voting round. Stay tuned.`
      case 'REJECTED':
        return `Keep creating! Your design wasn't selected this time, but we'd love to see more of your work.`
      case 'PENDING':
      default:
        return `Thanks for joining our community. We're carefully curating our early access group and will be in touch soon. Your creativity is exactly what we're looking for.`
    }
  }

  const getStatusDetails = (status) => {
    switch (status) {
      case 'APPROVED':
        return {
          title: "You're In!",
          description: "Congratulations! You now have full access to CLAUTH's design platform.",
          nextStep: "Start creating unlimited designs",
          timeframe: "Active now"
        }
      case 'IN_VOTING':
        return {
          title: "Under Review",
          description: "Community members are currently voting on your design submission.",
          nextStep: "Results typically available within 48 hours",
          timeframe: "Voting in progress"
        }
      case 'WAITLISTED':
        return {
          title: "In Queue",
          description: "Your design is queued for the next community voting round.",
          nextStep: "We'll notify you when voting begins",
          timeframe: "Next round starts soon"
        }
      case 'REJECTED':
        return {
          title: "Try Again",
          description: "Your design wasn't selected this time, but we encourage you to keep creating.",
          nextStep: "Submit a new design anytime",
          timeframe: "No waiting period"
        }
      case 'PENDING':
      default:
        return {
          title: "Application Received",
          description: "Your application is being reviewed by our team.",
          nextStep: "You'll hear from us within 5-7 business days",
          timeframe: "Review in progress"
        }
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
                {`Don't have an account?`}{' '}
                <Link href="/waitlist" className="font-medium text-black hover:text-gray-700">
                  Join the community
                </Link>
              </p>
            </div>
          </div>
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
            
            {/* Status Overview */}
            <div className="max-w-4xl mx-auto mb-16">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-8 py-12 text-center">
                  <div className="mb-8">
                    <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${getStatusBadge(session.user.waitlistStatus)}`}>
                      {getStatusDetails(session.user.waitlistStatus).title}
                    </div>
                  </div>
                  
                  <h2 className="text-3xl font-light text-gray-900 mb-4">
                    {getStatusDetails(session.user.waitlistStatus).title}
                  </h2>
                  
                  <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto font-light leading-relaxed">
                    {getStatusDetails(session.user.waitlistStatus).description}
                  </p>
                  
                  <div className="max-w-md mx-auto">
                    <div className="bg-gray-50 rounded-xl p-6 text-center">
                      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Next Step</h3>
                      <p className="text-gray-900 font-medium">{getStatusDetails(session.user.waitlistStatus).nextStep}</p>
                    </div>
                  </div>
                  
                  {session.user.waitlistStatus === 'APPROVED' && (
                    <div className="mt-8">
                      <Link
                        href="/"
                        className="inline-block bg-black text-white px-8 py-4 text-lg font-medium hover:bg-gray-900 transition-colors rounded-xl"
                      >
                        Enter CLAUTH
                      </Link>
                    </div>
                  )}
                  
                  {session.user.waitlistStatus === 'APPROVED' && (
                    <div className="mt-6">
                      <Link
                        href="/community-vote"
                        className="inline-block bg-purple-600 text-white px-6 py-3 text-base font-medium hover:bg-purple-700 transition-colors rounded-lg"
                      >
                        Participate in Community Vote
                      </Link>
                    </div>
                  )}
                  
                  {applications.length === 0 && !loadingApplications && (
                    <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
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
                </div>
              </div>
            </div>

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
        <div className="border-t border-gray-200 bg-gradient-to-b from-gray-50 to-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-light text-black mb-4 tracking-wide">YOUR DESIGN</h2>
              <p className="text-lg text-gray-600 font-light max-w-2xl mx-auto leading-relaxed">
                Here's the amazing design you've shared with us
              </p>
            </div>

            {applications.map((app) => (
              <div key={app.id} className="grid lg:grid-cols-3 gap-12 max-w-7xl mx-auto">
                <div className="lg:col-span-2">
                  {/* Design Showcase */}
                  <div className="bg-white rounded-3xl shadow-lg border border-gray-200 overflow-hidden">
                    <div className="aspect-[2/3] relative bg-gradient-to-br from-gray-50 to-gray-100">
                      <Image
                        src={currentView === 'front' ? (app.designItem?.imageUrl || app.designItem?.frontImage || '/images/placeholder-front.png') : (app.designItem?.backImage || app.designItem?.imageUrl || app.designItem?.frontImage || '/images/placeholder-back.png')}
                        alt={`${currentView} view`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 600px"
                      />
                      
                      {/* Navigation arrows */}
                      <div className="absolute inset-y-0 left-0 flex items-center">
                        <button
                          type="button"
                          onClick={() => setCurrentView(currentView === 'front' ? 'back' : 'front')}
                          className="bg-black/70 hover:bg-black/90 rounded-full p-3 shadow-lg transition-all duration-200 ml-4"
                        >
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                      </div>
                      
                      <div className="absolute inset-y-0 right-0 flex items-center">
                        <button
                          type="button"
                          onClick={() => setCurrentView(currentView === 'front' ? 'back' : 'front')}
                          className="bg-black/70 hover:bg-black/90 rounded-full p-3 shadow-lg transition-all duration-200 mr-4"
                        >
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                      
                      {/* View indicator */}
                      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
                        <div className="flex space-x-2">
                          <div className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${currentView === 'front' ? 'bg-white' : 'bg-white/50'}`}></div>
                          <div className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${currentView === 'back' ? 'bg-white' : 'bg-white/50'}`}></div>
                        </div>
                      </div>
                      
                      {/* Quality Badge - Only show for AI-generated designs */}
                      {app.designType === 'ai-generated' && app.designItem?.quality && (
                        <div className="absolute top-4 right-4">
                          <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1.5 rounded-full text-xs font-medium">
                            {app.designItem.quality === 'high' ? 'Runway Quality' : 'Studio Quality'}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-8">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-2xl font-light text-gray-900">{app.designItem?.name}</h3>
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(app.status)}`}>
                          {app.status}
                        </div>
                      </div>
                      
                      {app.designItem?.description && (
                        <p className="text-gray-600 mb-6 leading-relaxed">{app.designItem.description}</p>
                      )}
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="bg-gray-50 rounded-xl p-4">
                          <p className="text-gray-500 font-medium mb-1">Type</p>
                          <p className="text-gray-900">{app.designItem?.itemType}</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4">
                          <p className="text-gray-500 font-medium mb-1">Gender</p>
                          <p className="text-gray-900">{app.designItem?.gender === 'MASCULINE' ? 'Male' : app.designItem?.gender === 'FEMININE' ? 'Female' : 'Unisex'}</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4">
                          <p className="text-gray-500 font-medium mb-1">Category</p>
                          <p className="text-gray-900">{app.designItem?.category || 'Fashion'}</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4">
                          <p className="text-gray-500 font-medium mb-1">Submitted</p>
                          <p className="text-gray-900">{new Date(app.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-6">
                  {/* Application Stats */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Application Details</h4>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Application ID</span>
                        <span className="text-sm font-mono text-gray-900">#{app.id.slice(-6)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Status</span>
                        <span className="text-sm font-medium text-gray-900">{app.status}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Submitted</span>
                        <span className="text-sm text-gray-900">{new Date(app.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* What's Next */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 p-6">
                    <h4 className="text-lg font-medium text-blue-900 mb-4">What's Next?</h4>
                    <div className="space-y-3 text-sm text-blue-800">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                        <p>Our team reviews all submissions personally</p>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                        <p>Community members vote on promising designs</p>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                        <p>We'll notify you of any status changes</p>
                      </div>
                    </div>
                  </div>
                  

                </div>
              </div>
            ))}
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
    </div>
  )
} 