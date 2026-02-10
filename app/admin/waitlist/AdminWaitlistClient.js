'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

export default function AdminWaitlistClient({ entries: initialEntries, totalCount, currentPage, pageSize }) {
  const [entries, setEntries] = useState(initialEntries)
  const [selectedEntries, setSelectedEntries] = useState(new Set())
  const [currentPageState, setCurrentPageState] = useState(currentPage)
  const [isLoading, setIsLoading] = useState(false)
  const [copiedEmail, setCopiedEmail] = useState('')
  const [updatingEntry, setUpdatingEntry] = useState('')
  const [deletingEntry, setDeletingEntry] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterDesignType, setFilterDesignType] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const totalPages = Math.ceil(totalCount / pageSize)

  // Filter entries based on search, status, and design type
  const filteredEntries = entries.filter(entry => {
    const matchesSearch = entry.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         entry.applicant.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         entry.clothingItem?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = filterStatus === 'all' || entry.status === filterStatus
    const matchesDesignType = filterDesignType === 'all' || entry.designType === filterDesignType
    return matchesSearch && matchesStatus && matchesDesignType
  })

  const copyEmail = async (email) => {
    try {
      await navigator.clipboard.writeText(email)
      setCopiedEmail(email)
      setTimeout(() => setCopiedEmail(''), 2000)
    } catch (err) {
      console.error('Failed to copy email:', err)
    }
  }

  const copyAllEmails = async () => {
    try {
      const emails = entries.map(entry => entry.email).join('\n')
      await navigator.clipboard.writeText(emails)
      alert('All emails copied to clipboard!')
    } catch (err) {
      console.error('Failed to copy emails:', err)
    }
  }

  const updateEntryStatus = async (id, status) => {
    setUpdatingEntry(id)
    try {
      const response = await fetch('/api/admin/waitlist-applications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, status }),
      })

      if (response.ok) {
        const data = await response.json()
        setEntries(prevEntries => 
          prevEntries.map(entry => 
            entry.id === id 
              ? { ...entry, status, reviewedAt: data.entry.reviewedAt }
              : entry
          )
        )
        alert(`Application ${status.toLowerCase()} successfully!`)
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Failed to update application')
      }
    } catch (err) {
      console.error('Failed to update application:', err)
      alert('Failed to update application')
    } finally {
      setUpdatingEntry('')
    }
  }

  const moveToVote = async (ids) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/waitlist-applications/move-to-vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ applicationIds: Array.from(ids) }),
      })

      if (response.ok) {
        const data = await response.json()
        setEntries(prevEntries => 
          prevEntries.map(entry => 
            ids.has(entry.id) 
              ? { ...entry, status: 'IN_VOTING' }
              : entry
          )
        )
        setSelectedEntries(new Set())
        alert(`${ids.size} applications moved to voting successfully!`)
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Failed to move applications to voting')
      }
    } catch (err) {
      console.error('Failed to move to vote:', err)
      alert('Failed to move applications to voting')
    } finally {
      setIsLoading(false)
    }
  }

  const masterAccept = async (ids) => {
    if (!confirm(`Are you sure you want to master accept ${ids.size} applications? This will bypass community voting.`)) {
      return
    }
    
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/waitlist-applications/master-accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ applicationIds: Array.from(ids) }),
      })

      if (response.ok) {
        const data = await response.json()
        setEntries(prevEntries => 
          prevEntries.map(entry => 
            ids.has(entry.id) 
              ? { ...entry, status: 'APPROVED', reviewedAt: new Date().toISOString() }
              : entry
          )
        )
        setSelectedEntries(new Set())
        alert(`${ids.size} applications master accepted successfully!`)
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Failed to master accept applications')
      }
    } catch (err) {
      console.error('Failed to master accept:', err)
      alert('Failed to master accept applications')
    } finally {
      setIsLoading(false)
    }
  }

  const deleteEntry = async (id, email) => {
    if (!confirm(`Are you sure you want to delete the application from ${email}? This action cannot be undone.`)) {
      return
    }

    setDeletingEntry(id)
    try {
      const response = await fetch('/api/admin/waitlist-applications', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      })

      if (response.ok) {
        setEntries(prevEntries => prevEntries.filter(entry => entry.id !== id))
        alert('Application deleted successfully!')
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Failed to delete application')
      }
    } catch (err) {
      console.error('Failed to delete application:', err)
      alert('Failed to delete application')
    } finally {
      setDeletingEntry('')
    }
  }

  const loadPage = async (page) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/waitlist-applications?page=${page}&pageSize=${pageSize}`)
      if (response.ok) {
        const data = await response.json()
        setEntries(data.entries)
        setCurrentPageState(page)
      }
    } catch (err) {
      console.error('Failed to load page:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleEntrySelection = (id) => {
    setSelectedEntries(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const toggleSelectAll = () => {
    if (selectedEntries.size === filteredEntries.length) {
      setSelectedEntries(new Set())
    } else {
      setSelectedEntries(new Set(filteredEntries.map(entry => entry.id)))
    }
  }

  const getStatusBadge = (status) => {
    const baseClasses = "px-3 py-1 text-xs font-semibold rounded-full"
    switch (status) {
      case 'APPROVED':
        return `${baseClasses} bg-green-100 text-green-800`
      case 'REJECTED':
        return `${baseClasses} bg-red-100 text-red-800`
      case 'IN_VOTING':
        return `${baseClasses} bg-blue-100 text-blue-800`
      case 'PENDING':
      default:
        return `${baseClasses} bg-yellow-100 text-yellow-800`
    }
  }

  const pendingCount = entries.filter(entry => entry.status === 'PENDING').length
  const approvedCount = entries.filter(entry => entry.status === 'APPROVED').length
  const rejectedCount = entries.filter(entry => entry.status === 'REJECTED').length
  const votingCount = entries.filter(entry => entry.status === 'IN_VOTING').length
  const aiGeneratedCount = entries.filter(entry => entry.designType === 'ai-generated').length
  const uploadedCount = entries.filter(entry => entry.designType === 'uploaded').length

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white shadow-sm rounded-lg mb-6">
          <div className="px-6 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Waitlist Management
                </h1>
                <p className="text-gray-600 mt-1">
                  Review and manage design submissions from waitlisted users
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={copyAllEmails}
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  Copy All Emails
                </button>
              </div>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-6 gap-4 mt-6">
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
                <div className="text-sm text-yellow-600">Pending</div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{votingCount}</div>
                <div className="text-sm text-blue-600">In Voting</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
                <div className="text-sm text-green-600">Approved</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{rejectedCount}</div>
                <div className="text-sm text-red-600">Rejected</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{aiGeneratedCount}</div>
                <div className="text-sm text-purple-600">AI Generated</div>
              </div>
              <div className="bg-indigo-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-indigo-600">{uploadedCount}</div>
                <div className="text-sm text-indigo-600">Uploaded</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white shadow-sm rounded-lg mb-6">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">Search</label>
                  <input
                    type="text"
                    placeholder="Search by email, name, or design..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-64 px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="block px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="PENDING">Pending</option>
                    <option value="IN_VOTING">In Voting</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">Design Type</label>
                  <select
                    value={filterDesignType}
                    onChange={(e) => setFilterDesignType(e.target.value)}
                    className="block px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Types</option>
                    <option value="ai-generated">AI Generated</option>
                    <option value="uploaded">Uploaded</option>
                  </select>
                </div>
              </div>
              
              {/* Bulk Actions */}
              {selectedEntries.size > 0 && (
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-500">
                    {selectedEntries.size} selected
                  </span>
                  <button
                    onClick={() => moveToVote(selectedEntries)}
                    disabled={isLoading}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    Move to Vote
                  </button>
                  <button
                    onClick={() => masterAccept(selectedEntries)}
                    disabled={isLoading}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    Master Accept
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Applications Grid */}
        <div className="bg-white shadow-sm rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                Applications ({filteredEntries.length})
              </h3>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedEntries.size === filteredEntries.length && filteredEntries.length > 0}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="text-sm text-gray-900 font-medium">Select All</label>
              </div>
            </div>
          </div>
          
          {filteredEntries.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              No applications found
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredEntries.map((entry) => (
                <div key={entry.id} className="px-6 py-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start space-x-4">
                    <input
                      type="checkbox"
                      checked={selectedEntries.has(entry.id)}
                      onChange={() => toggleEntrySelection(entry.id)}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    
                    {/* Design Image */}
                    <div className="flex-shrink-0">
                      {entry.clothingItem?.imageUrl ? (
                        <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
                          <Image
                            src={entry.clothingItem.imageUrl}
                            alt={entry.clothingItem.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                          <span className="text-gray-400 text-xs">No Image</span>
                        </div>
                      )}
                          </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">
                            {entry.clothingItem?.name || 'Untitled Design'}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {entry.clothingItem?.itemType} • {entry.clothingItem?.gender}
                          </p>
                          <div className="flex items-center space-x-4 mt-2">
                            <span className="text-sm text-gray-500">
                              By {entry.applicant.displayName || entry.applicant.name}
                            </span>
                          <button
                            onClick={() => copyEmail(entry.email)}
                              className="text-sm text-blue-600 hover:text-blue-800"
                          >
                              {copiedEmail === entry.email ? '✓ Copied' : entry.email}
                          </button>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <span className={getStatusBadge(entry.status)}>
                            {entry.status.replace('_', ' ')}
                          </span>
                          
                          {/* Design Type Badge */}
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                            entry.designType === 'ai-generated' 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-indigo-100 text-indigo-800'
                          }`}>
                            {entry.designType === 'ai-generated' ? '🤖 AI Generated' : '📤 Uploaded'}
                          </span>
                          
                          <div className="flex items-center space-x-2">
                          {entry.status === 'PENDING' && (
                            <>
                              <button
                                  onClick={() => moveToVote(new Set([entry.id]))}
                                  disabled={isLoading}
                                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                >
                                  Move to Vote
                                </button>
                                <button
                                  onClick={() => masterAccept(new Set([entry.id]))}
                                  disabled={isLoading}
                                  className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50 transition-colors"
                              >
                                  Master Accept
                              </button>
                              <button
                                onClick={() => updateEntryStatus(entry.id, 'REJECTED')}
                                disabled={updatingEntry === entry.id}
                                  className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 disabled:opacity-50 transition-colors"
                              >
                                {updatingEntry === entry.id ? 'Updating...' : 'Reject'}
                              </button>
                            </>
                          )}
                          
                          {entry.status !== 'PENDING' && (
                            <button
                              onClick={() => updateEntryStatus(entry.id, 'PENDING')}
                              disabled={updatingEntry === entry.id}
                                className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700 disabled:opacity-50 transition-colors"
                            >
                              {updatingEntry === entry.id ? 'Updating...' : 'Reset'}
                            </button>
                          )}

                          <button
                            onClick={() => deleteEntry(entry.id, entry.email)}
                            disabled={deletingEntry === entry.id}
                              className="bg-red-800 text-white px-3 py-1 rounded text-sm hover:bg-red-900 disabled:opacity-50 transition-colors"
                          >
                            {deletingEntry === entry.id ? 'Deleting...' : 'Delete'}
                          </button>
                          </div>
                        </div>
                      </div>
                      
                      {/* Additional Info */}
                      <div className="mt-3 flex items-center space-x-6 text-sm text-gray-500">
                        <span>
                          Submitted: {new Date(entry.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        {entry.reviewedAt && (
                          <span>
                            Reviewed: {new Date(entry.reviewedAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        )}
                        {entry.clothingItem?.description && (
                          <span className="max-w-md truncate">
                            "{entry.clothingItem.description}"
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
          )}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-900 font-medium">
                  Showing {((currentPageState - 1) * pageSize) + 1} to {Math.min(currentPageState * pageSize, totalCount)} of {totalCount} applications
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => loadPage(currentPageState - 1)}
                    disabled={currentPageState === 1 || isLoading}
                    className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => loadPage(page)}
                      disabled={isLoading}
                      className={`px-3 py-1 border rounded text-sm ${
                        page === currentPageState
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-300 hover:bg-gray-50'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {page}
                    </button>
                  ))}
                  
                <button
                    onClick={() => loadPage(currentPageState + 1)}
                    disabled={currentPageState === totalPages || isLoading}
                    className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Next
                </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 