"use client";

import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AuthForm({ mode = 'login' }) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const router = useRouter()
  const isSignup = mode === 'signup'

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSocialAuth = async (provider) => {
    setError('')
    setIsLoading(true)
    try {
      const result = await signIn(provider, {
        redirect: false,
        callbackUrl: isSignup ? '/waitlist-status' : '/'
      })

      if (result?.error) {
        setError(result.error)
      } else if (result?.url) {
        const session = await getSession()
        redirectAfterAuth(session, isSignup)
      }
    } catch (err) {
      setError(`Google ${isSignup ? 'signup' : 'login'} failed. Please try again.`)
    } finally {
      setIsLoading(false)
    }
  }

  const redirectAfterAuth = (session, isNewSignup = false) => {
    if (session?.user?.role === 'ADMIN') {
      router.push('/admin')
    } else if (session?.user?.waitlistStatus === 'APPROVED') {
      router.push('/')
    } else {
      router.push(isNewSignup ? '/waitlist-status?new=true' : '/waitlist-status')
    }
  }

  const handleEmailAuth = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      if (isSignup) {
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Passwords do not match')
        }
        if (formData.password.length < 8) {
          throw new Error('Password must be at least 8 characters')
        }

        const response = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            password: formData.password,
          })
        })

        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Signup failed')

        // Auto sign in after signup
        const result = await signIn('credentials', {
          email: formData.email,
          password: formData.password,
          redirect: false
        })

        if (result?.error) throw new Error('Account created but sign in failed. Please sign in manually.')

        const session = await getSession()
        redirectAfterAuth(session, true)

      } else {
        const result = await signIn('credentials', {
          email: formData.email,
          password: formData.password,
          redirect: false
        })

        if (result?.error) {
          setError('Invalid email or password.')
        } else if (result?.url) {
          const session = await getSession()
          redirectAfterAuth(session)
        }
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-extralight text-black mb-4 tracking-tight">CLAUTH</h1>
          <p className="text-lg text-gray-800 font-light">
            {isSignup ? 'Join the community' : 'Welcome back'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-light text-black mb-2">
              {isSignup ? 'Create Account' : 'Sign In'}
            </h2>
            <p className="text-gray-600 text-sm">
              {isSignup ? 'Apply for early access' : 'Continue to your account'}
            </p>
          </div>

          <div className="space-y-6">
            {/* Google */}
            <button
              onClick={() => handleSocialAuth('google')}
              disabled={isLoading}
              className="w-full bg-white border border-gray-300 text-gray-900 font-medium py-4 px-6 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center justify-center space-x-3">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Continue with Google</span>
              </div>
            </button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or</span>
              </div>
            </div>

            {/* Email toggle */}
            <button
              onClick={() => setShowEmailForm(!showEmailForm)}
              className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="text-gray-900 font-medium">
                  {isSignup ? 'Sign up with Email' : 'Sign in with Email'}
                </span>
              </div>
              <svg
                className={`w-5 h-5 text-gray-600 transition-transform duration-200 ${showEmailForm ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Email form */}
            {showEmailForm && (
              <form onSubmit={handleEmailAuth} className="space-y-4">
                {isSignup && (
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Full Name</label>
                    <input
                      type="text" name="name" value={formData.name} onChange={handleInputChange} required
                      placeholder="Enter your full name"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Email Address</label>
                  <input
                    type="email" name="email" value={formData.email} onChange={handleInputChange} required
                    placeholder="Enter your email"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleInputChange} required
                      placeholder={isSignup ? "Create a password (8+ characters)" : "Enter your password"}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.464 8.464M14.121 14.121l1.414 1.414M14.121 14.121L17.657 17.657M3 3l18 18" /></svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      )}
                    </button>
                  </div>
                </div>

                {isSignup && (
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Confirm Password</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"} name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} required
                        placeholder="Confirm your password"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                      />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
                      >
                        {showConfirmPassword ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.464 8.464M14.121 14.121l1.414 1.414M14.121 14.121L17.657 17.657M3 3l18 18" /></svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                <button
                  type="submit" disabled={isLoading}
                  className="w-full bg-black text-white font-medium py-4 px-6 rounded-lg hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
                      <span>{isSignup ? 'Creating Account...' : 'Signing in...'}</span>
                    </div>
                  ) : (
                    isSignup ? 'Create Account' : 'Sign In'
                  )}
                </button>
              </form>
            )}
          </div>

          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm text-center">{error}</p>
            </div>
          )}

          <div className="mt-8 text-center">
            <p className="text-gray-600 text-sm">
              {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
              <Link href={isSignup ? '/login' : '/signup'} className="text-black hover:text-gray-700 font-medium underline">
                {isSignup ? 'Sign in' : 'Sign up'}
              </Link>
            </p>
          </div>

          <div className="mt-4 text-center">
            <p className="text-gray-400 text-xs">
              By continuing, you agree to our terms and will be added to our waitlist.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
