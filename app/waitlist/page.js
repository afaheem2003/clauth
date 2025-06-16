'use client'

import { useState } from 'react'
import { CheckIcon } from '@heroicons/react/24/outline'

export default function WaitlistPage() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) return

    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      if (response.ok) {
        setIsSubmitted(true)
        setEmail('')
      } else {
        const data = await response.json()
        setError(data.error || 'Something went wrong. Please try again.')
      }
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-none border border-black p-12">
            <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-8">
              <CheckIcon className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-light text-black mb-6 tracking-wide">
              You're In The Game
            </h1>
            <p className="text-gray-600 mb-8 font-light">
              Welcome to the fashion playground. Get ready to show off your style 
              and climb the ranks with the best designers.
            </p>
            <div className="border-t border-gray-200 pt-6">
              <p className="text-sm text-gray-500 font-light">
                New theme drops at 9am. Your friends are already voting.
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          <div className="text-center">
            <div className="mb-12">
              <div className="inline-flex items-center px-6 py-2 bg-black text-white text-sm font-light tracking-widest">
                THINK YOU'VE GOT STYLE?
              </div>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-thin text-black mb-8 tracking-tight">
              CLAUTH
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto font-light leading-relaxed">
              A fun and social playground for fashion creativity
            </p>
            
            <p className="text-lg text-gray-500 mb-16 max-w-3xl mx-auto font-light">
              — where the best designs rise to the top.
            </p>

            {/* Email Signup */}
            <div className="max-w-lg mx-auto mb-20">
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="px-6 py-4 border border-black bg-white text-black placeholder-gray-400 font-light focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  required
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-4 bg-black text-white font-light tracking-widest hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      JOINING...
                    </div>
                  ) : (
                    'SHOW IT OFF'
                  )}
                </button>
              </form>
              {error && (
                <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 p-4">
                  {error}
                </p>
              )}
            </div>

            <p className="text-sm text-gray-400 font-light tracking-wide">
              "You don't have to be a designer — just bring your taste."
            </p>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="border-t border-gray-200 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="grid md:grid-cols-3 gap-16">
            <div className="text-center">
              <div className="w-16 h-16 bg-black mx-auto mb-8 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                </svg>
              </div>
              <h3 className="text-xl font-light text-black mb-6 tracking-wide">DISCOVER & CONNECT</h3>
              <p className="text-gray-600 font-light leading-relaxed">
                Explore fresh styles, get inspired by others, and share your unique fashion perspective 
                with a community that gets it.
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
                Take on daily style challenges, showcase your creativity, and watch your reputation 
                grow as you outshine the competition.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-black mx-auto mb-8 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
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
            "Fashion is not something that exists in dresses only. Fashion is in the sky, in the street, 
            fashion has to do with ideas, the way we live, what is happening."
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