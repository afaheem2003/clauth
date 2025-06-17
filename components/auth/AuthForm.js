"use client";

import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AuthForm({ mode = 'login' }) {
  const [step, setStep] = useState(1) // 1: Form, 2: Phone Verification (only for email signup)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [userId, setUserId] = useState(null)
  const [countdown, setCountdown] = useState(0)
  const [showEmailForm, setShowEmailForm] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: ''
  })
  
  const [verificationData, setVerificationData] = useState({
    code: '',
    expiresAt: null
  })
  
  const router = useRouter()
  const isSignup = mode === 'signup'

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
        if (isSignup) {
          router.push('/waitlist-status?new=true')
        } else {
          // Login flow
          const session = await getSession()
          
          if (session?.user?.role === 'ADMIN') {
            router.push('/admin')
          } else if (session?.user?.waitlistStatus === 'APPROVED') {
            router.push('/')
          } else if (session?.user?.waitlistStatus === 'WAITLISTED') {
            const response = await fetch('/api/user/check-new')
            const { isNew } = await response.json()
            
            if (isNew) {
              router.push('/waitlist-status?new=true')
            } else {
              router.push('/waitlist-status')
            }
          } else {
            router.push('/waitlist-status')
          }
        }
      }
    } catch (err) {
      console.error('Auth error:', err)
      setError(`Google ${isSignup ? 'signup' : 'login'} failed. Please try again.`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleVerificationChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6)
    setVerificationData({
      ...verificationData,
      code: value
    })
  }

  const formatPhoneNumber = (phone) => {
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length === 10) {
      return `+1${cleaned}`
    }
    return phone.startsWith('+') ? phone : `+${cleaned}`
  }

  const handleEmailAuth = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    
    try {
      if (isSignup) {
        // Signup validation
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Passwords do not match')
        }
        
        if (formData.password.length < 8) {
          throw new Error('Password must be at least 8 characters long')
        }
        
        if (!formData.phone) {
          throw new Error('Phone number is required')
        }

        const formattedPhone = formatPhoneNumber(formData.phone)

        const response = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            password: formData.password,
            phone: formattedPhone
          })
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Signup failed')
        }

        if (data.requiresPhoneVerification) {
          setUserId(data.userId)
          await sendVerificationCode(data.userId, formattedPhone)
          setStep(2)
          setSuccess('Account created! Please verify your phone number.')
        }
      } else {
        // Login flow
        const result = await signIn('credentials', {
          email: formData.email,
          password: formData.password,
          redirect: false
        })

        if (result?.error) {
          if (result.error === 'Phone verification required') {
            setError('Please verify your phone number before signing in.')
          } else {
            setError('Invalid email or password.')
          }
        } else if (result?.url) {
          const session = await getSession()
          
          if (session?.user?.role === 'ADMIN') {
            router.push('/admin')
          } else if (session?.user?.waitlistStatus === 'APPROVED') {
            router.push('/')
          } else {
            router.push('/waitlist-status')
          }
        }
      }
    } catch (err) {
      console.error('Email auth error:', err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const sendVerificationCode = async (userIdParam, phone) => {
    try {
      const response = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: userIdParam || userId,
          phone: phone || formatPhoneNumber(formData.phone)
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send verification code')
      }

      setVerificationData({
        ...verificationData,
        expiresAt: data.expiresAt
      })

      setCountdown(600)
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)

      setSuccess('Verification code sent to your phone!')
      
      if (data.code && process.env.NODE_ENV === 'development') {
        console.log('Development verification code:', data.code)
      }

    } catch (err) {
      console.error('Send verification error:', err)
      setError(err.message)
    }
  }

  const handleVerifyPhone = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      if (!verificationData.code || verificationData.code.length !== 6) {
        throw new Error('Please enter a valid 6-digit code')
      }

      const response = await fetch('/api/auth/verify-phone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          code: verificationData.code
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Verification failed')
      }

      setSuccess('Phone verified successfully! You can now sign in.')
      
      setTimeout(() => {
        router.push('/login')
      }, 2000)

    } catch (err) {
      console.error('Verification error:', err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const resendCode = async () => {
    setError('')
    await sendVerificationCode()
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center px-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-indigo-600/10 to-cyan-600/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-thin text-white mb-2 tracking-wider">
            CLAUTH
          </h1>
          <p className="text-gray-400 text-sm font-light tracking-wide">
            WHERE STYLE MEETS COMMUNITY
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/20">
          {/* Show progress indicator only for phone verification step */}
          {isSignup && step === 2 && (
            <div className="flex items-center justify-center mb-8">
              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium bg-white text-gray-900">
                  1
                </div>
                <div className="w-12 h-0.5 bg-white"></div>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium bg-white text-gray-900">
                  2
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Authentication */}
          {step === 1 && (
            <>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-light text-white mb-2">
                  {isSignup ? 'Join the Waitlist' : 'Welcome Back'}
                </h2>
                <p className="text-gray-300 text-sm">
                  {isSignup 
                    ? 'Create your account to get exclusive access'
                    : 'Sign in to continue your fashion journey'
                  }
                </p>
              </div>

              <div className="space-y-6">
                {/* Google Button */}
                <button
                  onClick={() => handleSocialAuth('google')}
                  disabled={isLoading}
                  className="w-full group relative overflow-hidden bg-white hover:bg-gray-50 text-gray-900 font-medium py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  <div className="flex items-center justify-center space-x-3">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span className="text-base">Continue with Google</span>
                  </div>
                </button>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/20"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-transparent text-gray-400">or</span>
                  </div>
                </div>

                {/* Email Section Header - Collapsible */}
                <button
                  onClick={() => setShowEmailForm(!showEmailForm)}
                  className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-lg transition-all duration-200"
                >
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="text-gray-300 font-medium">
                      {isSignup ? 'Sign up with Email' : 'Sign in with Email'}
                    </span>
                  </div>
                  <svg 
                    className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${showEmailForm ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Collapsible Email Form */}
                {showEmailForm && (
                  <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                    <form onSubmit={handleEmailAuth} className="space-y-4">
                      {isSignup && (
                        <div>
                          <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                            Full Name
                          </label>
                          <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all duration-200"
                            placeholder="Enter your full name"
                          />
                        </div>
                      )}

                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                          Email Address
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all duration-200"
                          placeholder="Enter your email"
                        />
                      </div>

                      {isSignup && (
                        <div>
                          <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-2">
                            Phone Number
                          </label>
                          <input
                            type="tel"
                            id="phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all duration-200"
                            placeholder="Enter your phone number"
                          />
                          <p className="text-gray-400 text-xs mt-1">Required for account verification</p>
                        </div>
                      )}

                      <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                          Password
                        </label>
                        <input
                          type="password"
                          id="password"
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all duration-200"
                          placeholder={isSignup ? "Create a password" : "Enter your password"}
                        />
                        {isSignup && (
                          <p className="text-gray-400 text-xs mt-1">At least 8 characters</p>
                        )}
                      </div>

                      {isSignup && (
                        <div>
                          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                            Confirm Password
                          </label>
                          <input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all duration-200"
                            placeholder="Confirm your password"
                          />
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-white hover:bg-gray-100 text-gray-900 font-medium py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      >
                        {isLoading ? (
                          <div className="flex items-center justify-center space-x-2">
                            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                            <span>{isSignup ? 'Creating Account...' : 'Signing in...'}</span>
                          </div>
                        ) : (
                          isSignup ? 'Create Account' : 'Sign In'
                        )}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Step 2: Phone Verification (only for signup) */}
          {isSignup && step === 2 && (
            <>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-light text-white mb-2">
                  Verify Phone
                </h2>
                <p className="text-gray-300 text-sm">
                  Enter the 6-digit code sent to your phone
                </p>
                <p className="text-gray-400 text-xs mt-2">
                  {formatPhoneNumber(formData.phone)}
                </p>
              </div>

              <form onSubmit={handleVerifyPhone} className="space-y-6">
                <div>
                  <label htmlFor="code" className="block text-sm font-medium text-gray-300 mb-2">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    id="code"
                    value={verificationData.code}
                    onChange={handleVerificationChange}
                    maxLength={6}
                    required
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white text-center text-2xl font-mono tracking-widest placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all duration-200"
                    placeholder="000000"
                  />
                  {countdown > 0 && (
                    <p className="text-gray-400 text-xs mt-1 text-center">
                      Code expires in {formatTime(countdown)}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading || verificationData.code.length !== 6}
                  className="w-full bg-white hover:bg-gray-100 text-gray-900 font-medium py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                      <span>Verifying...</span>
                    </div>
                  ) : (
                    'Verify Phone'
                  )}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={resendCode}
                    disabled={countdown > 0 || isLoading}
                    className="text-gray-300 hover:text-white text-sm underline disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {countdown > 0 ? `Resend in ${formatTime(countdown)}` : 'Resend Code'}
                  </button>
                </div>
              </form>
            </>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
              <p className="text-red-200 text-sm text-center">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mt-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
              <p className="text-green-200 text-sm text-center">{success}</p>
            </div>
          )}

          {/* Navigation Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
              <Link 
                href={isSignup ? '/login' : '/signup'} 
                className="text-white hover:text-gray-200 font-medium underline"
              >
                {isSignup ? 'Sign in here' : 'Sign up here'}
              </Link>
            </p>
          </div>

          {/* Info Text */}
          <div className="mt-6 text-center">
            <p className="text-gray-400 text-xs leading-relaxed">
              By {isSignup ? 'creating an account' : 'signing in'}, you agree to our terms and will be added to our waitlist{isSignup ? '' : ' if you\'re a new user'}.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-gray-500 text-xs">
            © 2024 Clauth. All rights reserved.
          </p>
        </div>
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute top-20 left-20 w-2 h-2 bg-white/30 rounded-full animate-ping"></div>
      )}
      <div className="absolute bottom-32 right-32 w-1 h-1 bg-blue-400/50 rounded-full animate-ping delay-700"></div>
      <div className="absolute top-1/3 right-20 w-1.5 h-1.5 bg-purple-400/40 rounded-full animate-ping delay-1000"></div>
    </div>
  )
} 