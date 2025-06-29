'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function AdminVotingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [rounds, setRounds] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)
  const [ending, setEnding] = useState({})
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [applicationViews, setApplicationViews] = useState({})
  const [imageStates, setImageStates] = useState({})
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    durationHours: 72,
    maxApplications: 20,
    approvalPercentage: 30,
    minVotes: 5,
    startImmediately: false
  })

  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      fetchRounds()
    } else if (session?.user && session.user.role !== 'ADMIN') {
      router.push('/')
    }
  }, [session, router])

  const fetchRounds = async () => {
    try {
      const response = await fetch('/api/admin/voting-rounds')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch voting rounds')
      }

      setRounds(data.rounds)
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const createRound = async (e) => {
    e.preventDefault()
    setCreating(true)
    setError('')

    try {
      const response = await fetch('/api/admin/voting-rounds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create voting round')
      }

      setShowCreateForm(false)
      setFormData({
        name: '',
        description: '',
        durationHours: 72,
        maxApplications: 20,
        approvalPercentage: 30,
        minVotes: 5,
        startImmediately: false
      })
      await fetchRounds()

    } catch (error) {
      setError(error.message)
    } finally {
      setCreating(false)
    }
  }

  const endRound = async (roundId) => {
    setEnding(prev => ({ ...prev, [roundId]: true }))
    setError('')

    try {
      const response = await fetch('/api/admin/voting-rounds', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roundId, action: 'end' })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to end voting round')
      }

      await fetchRounds()

    } catch (error) {
      setError(error.message)
    } finally {
      setEnding(prev => ({ ...prev, [roundId]: false }))
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-6 text-gray-600 font-light text-lg">Loading admin panel...</p>
        </div>
      </div>
    )
  }

  if (!session || session.user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="max-w-lg mx-auto px-4 text-center">
          <h1 className="text-4xl font-light text-black mb-6">Access Denied</h1>
          <p className="text-lg text-gray-600">Admin access required</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-light text-gray-900 mb-2">
            Community Voting Management
          </h1>
          <p className="text-gray-600">
            Create and manage community voting rounds for waitlist applications
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Create Round Button */}
        <div className="mb-8">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-900 transition-colors"
          >
            {showCreateForm ? 'Cancel' : 'Create New Voting Round'}
          </button>
        </div>

        {/* Create Round Form */}
        {showCreateForm && (
          <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-medium text-gray-900 mb-6">Create New Voting Round</h2>
            
            <form onSubmit={createRound} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Round Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-gray-900 placeholder-gray-600"
                    placeholder="e.g., Week 1 Community Vote"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Duration (hours)
                  </label>
                  <input
                    type="number"
                    value={formData.durationHours}
                    onChange={(e) => setFormData({ ...formData, durationHours: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-gray-900"
                    min="1"
                    max="168"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Max Applications
                  </label>
                  <input
                    type="number"
                    value={formData.maxApplications}
                    onChange={(e) => setFormData({ ...formData, maxApplications: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-gray-900"
                    min="1"
                    max="50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Approval Percentage (%)
                  </label>
                  <input
                    type="number"
                    value={formData.approvalPercentage}
                    onChange={(e) => setFormData({ ...formData, approvalPercentage: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-gray-900"
                    min="1"
                    max="100"
                  />
                  <p className="text-xs text-gray-700 mt-1">
                    Percentage of applications that make it through
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Minimum Votes
                  </label>
                  <input
                    type="number"
                    value={formData.minVotes}
                    onChange={(e) => setFormData({ ...formData, minVotes: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-gray-900"
                    min="1"
                    max="20"
                  />
                  <p className="text-xs text-gray-700 mt-1">
                    Minimum votes required for consideration
                  </p>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="startImmediately"
                    checked={formData.startImmediately}
                    onChange={(e) => setFormData({ ...formData, startImmediately: e.target.checked })}
                    className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                  />
                  <label htmlFor="startImmediately" className="ml-2 text-sm text-gray-900">
                    Start immediately
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-gray-900 placeholder-gray-600"
                  rows="3"
                  placeholder="Optional description for this voting round"
                />
              </div>

              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={creating}
                  className="bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-900 transition-colors disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create Voting Round'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Quick Schedule Section */}
        <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Schedule</h3>
          <p className="text-sm text-gray-600 mb-4">
            Schedule voting rounds with common configurations
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            <button
              onClick={() => {
                setFormData({
                  name: `Weekly Vote - ${new Date().toLocaleDateString()}`,
                  description: 'Weekly community voting round',
                  durationHours: 72,
                  maxApplications: 15,
                  approvalPercentage: 30,
                  minVotes: 5,
                  startImmediately: true
                })
                setShowCreateForm(true)
              }}
              className="p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <div className="font-medium text-gray-900 mb-1">Weekly Standard</div>
              <div className="text-sm text-gray-600">72h • 15 apps • Top 30%</div>
            </button>
            
            <button
              onClick={() => {
                setFormData({
                  name: `Flash Vote - ${new Date().toLocaleDateString()}`,
                  description: 'Quick 24-hour voting round',
                  durationHours: 24,
                  maxApplications: 10,
                  approvalPercentage: 30,
                  minVotes: 3,
                  startImmediately: true
                })
                setShowCreateForm(true)
              }}
              className="p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <div className="font-medium text-gray-900 mb-1">Flash Round</div>
              <div className="text-sm text-gray-600">24h • 10 apps • Top 30%</div>
            </button>
            
            <button
              onClick={() => {
                setFormData({
                  name: `Monthly Review - ${new Date().toLocaleDateString()}`,
                  description: 'Extended monthly review period',
                  durationHours: 120,
                  maxApplications: 25,
                  approvalPercentage: 30,
                  minVotes: 8,
                  startImmediately: true
                })
                setShowCreateForm(true)
              }}
              className="p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <div className="font-medium text-gray-900 mb-1">Monthly Review</div>
              <div className="text-sm text-gray-600">120h • 25 apps • Top 30%</div>
            </button>
          </div>
        </div>

        {/* Voting Rounds List */}
        <div className="space-y-6">
          {rounds.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <h3 className="text-xl font-medium text-gray-900 mb-2">No Voting Rounds Yet</h3>
              <p className="text-gray-600">Create your first community voting round to get started.</p>
            </div>
          ) : (
            rounds.map((round) => {
              const isActive = round.isActive
              const hasEnded = new Date() > new Date(round.endTime)
              const timeRemaining = new Date(round.endTime) - new Date()
              const hoursRemaining = Math.max(0, Math.floor(timeRemaining / (1000 * 60 * 60)))

              return (
                <div key={round.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-medium text-gray-900">{round.name}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          isActive && !hasEnded
                            ? 'bg-green-100 text-green-800'
                            : hasEnded
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {isActive && !hasEnded ? 'Active' : hasEnded ? 'Ended' : 'Scheduled'}
                        </span>
                      </div>
                      {round.description && (
                        <p className="text-gray-600 mb-2">{round.description}</p>
                      )}
                      <p className="text-sm text-gray-500">
                        Created by {round.createdBy.name} on {new Date(round.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    {isActive && !hasEnded && (
                      <button
                        onClick={() => endRound(round.id)}
                        disabled={ending[round.id]}
                        className="bg-red-600 text-white px-4 py-2 rounded font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                      >
                        {ending[round.id] ? 'Ending...' : 'End Round'}
                      </button>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-gray-900">{round._count.applications}</div>
                      <div className="text-sm text-gray-600">Applications</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-gray-900">{round._count.votes}</div>
                      <div className="text-sm text-gray-600">Total Votes</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-gray-900">{round.applicationsApproved}</div>
                      <div className="text-sm text-gray-600">Approved</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-gray-900">
                        {isActive && !hasEnded ? `${hoursRemaining}h` : hasEnded ? 'Ended' : 'Scheduled'}
                      </div>
                      <div className="text-sm text-gray-600">Time Remaining</div>
                    </div>
                  </div>

                  <div className="text-sm text-gray-500 space-y-1">
                    <p>Started: {new Date(round.startTime).toLocaleString()}</p>
                    <p>Ends: {new Date(round.endTime).toLocaleString()}</p>
                    <p>Settings: Top 30% approval, {round.minVotes} min votes</p>
                  </div>

                  {/* Applications Preview */}
                  {round.applications.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Applications in this round:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {round.applications.slice(0, 6).map((app) => (
                          <div key={app.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <div className="text-sm font-medium text-gray-900 mb-1">
                              {app.application.clothingItem.name}
                            </div>
                            <div className="text-xs text-gray-600 mb-2">
                              by {app.application.applicant.name}
                            </div>
                            <div className="text-xs text-gray-500 space-y-1">
                              <div>Type: {app.application.clothingItem.itemType}</div>
                              <div>Gender: {app.application.clothingItem.gender === 'MASCULINE' ? 'Male' : app.application.clothingItem.gender === 'FEMININE' ? 'Female' : 'Unisex'}</div>
                              {app.application.clothingItem.quality && (
                                <div>Quality: {app.application.clothingItem.quality}</div>
                              )}
                              {app.application.referralCodes.length > 0 && (
                                <div>Referrals: {app.application.referralCodes.length}</div>
                              )}
                            </div>
                          </div>
                        ))}
                        {round.applications.length > 6 && (
                          <div className="bg-gray-100 rounded-lg p-4 border border-gray-200 flex items-center justify-center">
                            <span className="text-gray-500 text-sm">+{round.applications.length - 6} more applications</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
} 