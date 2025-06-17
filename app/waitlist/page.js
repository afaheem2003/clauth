'use client'

import Link from 'next/link'

export default function WaitlistPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,0,0,0.02)_0%,transparent_50%)]"></div>
        
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24">
          <div className="text-center">
            {/* Status Badge */}
            <div className="mb-12">
              <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-black to-gray-800 text-white text-sm font-medium tracking-wider rounded-full shadow-lg">
                <svg className="w-4 h-4 mr-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
                THINK YOU'VE GOT STYLE?
              </div>
            </div>
            
            {/* Main Title */}
            <h1 className="text-7xl md:text-9xl font-extralight text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-black to-gray-700 mb-8 tracking-tighter leading-none">
              CLAUTH
            </h1>
            
            {/* Subtitle */}
            <p className="text-2xl md:text-3xl text-gray-700 mb-6 max-w-4xl mx-auto font-light leading-relaxed">
              A fun and social playground for fashion creativity
            </p>
            
            {/* Description */}
            <p className="text-xl text-gray-500 mb-16 max-w-2xl mx-auto font-light italic">
              — where the best designs rise to the top.
            </p>

            {/* CTA Button */}
            <div className="mb-20">
              <Link
                href="/signup"
                className="group relative inline-flex items-center justify-center px-12 py-5 text-lg font-medium text-white bg-gradient-to-r from-black via-gray-900 to-black hover:from-gray-900 hover:via-black hover:to-gray-900 rounded-2xl shadow-2xl hover:shadow-3xl transform transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-black/20"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity duration-300"></span>
                <span className="relative tracking-wider">SIGN UP FOR WAITLIST</span>
                <svg className="ml-3 w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>

            {/* Quote */}
            <div className="max-w-2xl mx-auto">
              <blockquote className="text-lg text-gray-400 font-light italic tracking-wide">
                "You don't have to be a designer — just bring your taste."
              </blockquote>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="relative bg-gradient-to-b from-gray-50 to-white border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-light text-gray-900 mb-4 tracking-wide">What Awaits You</h2>
            <p className="text-xl text-gray-600 font-light max-w-2xl mx-auto">
              Join a community where creativity meets recognition
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12">
            {/* Feature 1 */}
            <div className="group text-center p-8 bg-white rounded-3xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300">
              <div className="relative w-20 h-20 bg-gradient-to-br from-gray-900 to-black mx-auto mb-8 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl"></div>
                <svg className="w-10 h-10 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                </svg>
              </div>
              <h3 className="text-2xl font-light text-gray-900 mb-6 tracking-wide">DISCOVER & CONNECT</h3>
              <p className="text-gray-600 font-light leading-relaxed text-lg">
                Explore styles, get inspired, and share your perspective with a community that values creativity over credentials.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group text-center p-8 bg-white rounded-3xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300">
              <div className="relative w-20 h-20 bg-gradient-to-br from-gray-900 to-black mx-auto mb-8 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl"></div>
                <svg className="w-10 h-10 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-2xl font-light text-gray-900 mb-6 tracking-wide">COMPETE & WIN</h3>
              <p className="text-gray-600 font-light leading-relaxed text-lg">
                Daily challenges, showcase your creativity, and grow your reputation in the fashion world.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group text-center p-8 bg-white rounded-3xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300">
              <div className="relative w-20 h-20 bg-gradient-to-br from-gray-900 to-black mx-auto mb-8 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl"></div>
                <svg className="w-10 h-10 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976-2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <h3 className="text-2xl font-light text-gray-900 mb-6 tracking-wide">EARN RECOGNITION</h3>
              <p className="text-gray-600 font-light leading-relaxed text-lg">
                Build your status as a style icon. Get featured, earn badges, and join the ranks 
                of fashion's most influential voices.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quote Section */}
      <div className="relative bg-gradient-to-r from-black via-gray-900 to-black text-white py-24 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(255,255,255,0.05)_0%,transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(255,255,255,0.03)_0%,transparent_50%)]"></div>
        
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-8">
            <svg className="w-16 h-16 text-white/20 mx-auto" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4v10h-10z"/>
            </svg>
          </div>
          <blockquote className="text-3xl md:text-4xl font-light italic mb-8 leading-relaxed text-white/90">
            "Fashion is not something that exists in dresses only. Fashion is in the sky, in the street, 
            fashion has to do with ideas, the way we live, what is happening."
          </blockquote>
          <cite className="text-white/60 font-light tracking-widest text-lg">— COCO CHANEL</cite>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gradient-to-t from-gray-100 to-gray-50 border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="mb-8">
              <h3 className="text-2xl font-light text-gray-900 mb-4">Ready to showcase your style?</h3>
              <p className="text-gray-600 font-light">Join thousands of fashion enthusiasts already on the list.</p>
            </div>
            <Link
              href="/signup"
              className="inline-flex items-center px-8 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              Get Started
              <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-300">
            <p className="text-center text-gray-400 text-sm font-light tracking-widest">
              © 2024 CLAUTH — REDEFINING FASHION
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 