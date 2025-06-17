'use client'

import { useSession, signOut } from 'next-auth/react'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function WaitlistStatusPage() {
  const { data: session, status } = useSession()
  const [isNewUser, setIsNewUser] = useState(false)

  useEffect(() => {
    // Check if this is a new user (just signed up)
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('new') === 'true') {
      setIsNewUser(true)
      // Clean up the URL
      window.history.replaceState({}, document.title, '/waitlist-status')
    }
  }, [])

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/waitlist' })
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
          <div className="max-w-md w-full space-y-12 text-center">
            {/* Status Badge */}
            <div className="space-y-8">
              <div className="inline-flex items-center px-4 py-2 bg-amber-100 text-amber-800 text-sm font-medium rounded-full border border-amber-200">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Authentication Required
              </div>
              
              <h1 className="text-4xl font-light text-gray-900 tracking-tight">
                Check Your Status
              </h1>
              
              <p className="text-xl text-gray-600 font-light max-w-sm mx-auto leading-relaxed">
                Sign in to view your current position on the Clauth waitlist
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
                Don't have an account?{' '}
                <Link href="/waitlist" className="font-medium text-black hover:text-gray-700">
                  Join the waitlist
                </Link>
              </p>
            </div>

            {/* Features Preview */}
            <div className="pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-400 font-medium tracking-wide mb-4">
                WHAT AWAITS YOU
              </p>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="w-8 h-8 bg-gray-900 rounded-lg mx-auto mb-2 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <p className="text-xs text-gray-600 font-medium">Compete</p>
                </div>
                <div>
                  <div className="w-8 h-8 bg-gray-900 rounded-lg mx-auto mb-2 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                    </svg>
                  </div>
                  <p className="text-xs text-gray-600 font-medium">Connect</p>
                </div>
                <div>
                  <div className="w-8 h-8 bg-gray-900 rounded-lg mx-auto mb-2 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976-2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </div>
                  <p className="text-xs text-gray-600 font-medium">Create</p>
                </div>
              </div>
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          <div className="text-center">
            <div className="mb-12">
              <div className="inline-flex items-center px-6 py-2 bg-black text-white text-sm font-light tracking-widest">
                {isNewUser ? "WELCOME TO THE WAITLIST" : "YOU'RE ON THE LIST"}
              </div>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-thin text-black mb-8 tracking-tight">
              CLAUTH
            </h1>
            
            {isNewUser ? (
              <>
                <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto font-light leading-relaxed">
                  Thank you for joining our waitlist! We're building something special.
                </p>
                
                <p className="text-lg text-gray-500 mb-16 max-w-3xl mx-auto font-light">
                  — You'll be notified when we're ready to welcome you.
                </p>
              </>
            ) : (
              <>
                <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto font-light leading-relaxed">
                  Thanks for checking in! You're still on our waitlist.
                </p>
                
                <p className="text-lg text-gray-500 mb-16 max-w-3xl mx-auto font-light">
                  — We're working hard to make this amazing for everyone.
                </p>
              </>
            )}

            {/* User Info */}
            <div className="max-w-lg mx-auto mb-20 p-8 border border-gray-200 bg-gray-50">
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

            <p className="text-sm text-gray-400 font-light tracking-wide">
              &quot;Patience is bitter, but its fruit is sweet.&quot; — Aristotle
            </p>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="border-t border-gray-200 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-light text-black mb-6 tracking-wide">WHAT TO EXPECT</h2>
            <p className="text-gray-600 font-light max-w-2xl mx-auto">
              While you wait, here's what we're building for you
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-16">
            <div className="text-center">
              <div className="w-16 h-16 bg-black mx-auto mb-8 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                </svg>
              </div>
              <h3 className="text-xl font-light text-black mb-6 tracking-wide">DISCOVER & CONNECT</h3>
              <p className="text-gray-600 font-light leading-relaxed">
                Explore styles, get inspired, and share your perspective with a community that values creativity over credentials.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-black mx-auto mb-8 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-xl font-light text-black mb-6 tracking-wide">COMPETE & WIN</h3>
              <p className="text-gray-600 font-light leading-relaxed">
                Daily challenges, showcase your creativity, and grow your reputation in the fashion world.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-black mx-auto mb-8 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976-2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <h3 className="text-xl font-light text-black mb-6 tracking-wide">EARN RECOGNITION</h3>
              <p className="text-gray-600 font-light leading-relaxed">
                Build your status as a style icon. Get featured, earn badges, and join the ranks 
                of fashion's most influential voices.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quote Section */}
      <div className="bg-black text-white py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <blockquote className="text-2xl md:text-3xl font-light italic mb-8 leading-relaxed">
            &quot;Fashion is not something that exists in dresses only. Fashion is in the sky, in the street, 
            fashion has to do with ideas, the way we live, what is happening.&quot;
          </blockquote>
          <cite className="text-gray-400 font-light tracking-widest">— COCO CHANEL</cite>
        </div>
      </div>

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