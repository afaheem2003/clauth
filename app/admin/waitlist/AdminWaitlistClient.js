'use client'

import { useState } from 'react'
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
        let errorMessage = 'Failed to update application'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError)
        }
        alert(errorMessage)
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
        let errorMessage = 'Failed to move applications to voting'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError)
        }
        alert(errorMessage)
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
        let errorMessage = 'Failed to master accept applications'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError)
        }
        alert(errorMessage)
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
        let errorMessage = 'Failed to delete application'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError)
        }
        alert(errorMessage)
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
    const baseClasses = "px-2 py-0.5 text-xs font-medium rounded"
    switch (status) {
      case 'APPROVED':
        return `${baseClasses} bg-gray-900 text-white`
      case 'REJECTED':
        return `${baseClasses} bg-gray-100 text-gray-500`
      case 'IN_VOTING':
        return `${baseClasses} bg-gray-100 text-gray-700`
      case 'PENDING':
      default:
        return `${baseClasses} bg-gray-50 text-gray-500 border border-gray-200`
    }
  }

  const pendingCount = entries.filter(entry => entry.status === 'PENDING').length
  const approvedCount = entries.filter(entry => entry.status === 'APPROVED').length
  const rejectedCount = entries.filter(entry => entry.status === 'REJECTED').length
  const votingCount = entries.filter(entry => entry.status === 'IN_VOTING').length
  const aiGeneratedCount = entries.filter(entry => entry.designType === 'ai-generated').length
  const uploadedCount = entries.filter(entry => entry.designType === 'uploaded').length

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-light text-gray-900 tracking-tight">Waitlist</h1>
            <p className="text-sm text-gray-400 mt-1">Review and manage design submissions</p>
          </div>
          <button
            onClick={copyAllEmails}
            className="border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm hover:border-gray-400 transition-colors"
          >
            Copy All Emails
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-6 gap-3 mt-6">
          {[
            { value: pendingCount, label: "Pending" },
            { value: votingCount, label: "In Voting" },
            { value: approvedCount, label: "Approved" },
            { value: rejectedCount, label: "Rejected" },
            { value: aiGeneratedCount, label: "AI Generated" },
            { value: uploadedCount, label: "Uploaded" },
          ].map(({ value, label }) => (
            <div key={label} className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-2xl font-light text-gray-900">{value}</p>
              <p className="text-xs text-gray-400 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">Search</label>
              <input
                type="text"
                placeholder="Search by email, name, or design..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-64 px-3 py-2 border border-gray-200 rounded-md text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="block px-3 py-2 border border-gray-200 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
              >
                <option value="all">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="IN_VOTING">In Voting</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">Type</label>
              <select
                value={filterDesignType}
                onChange={(e) => setFilterDesignType(e.target.value)}
                className="block px-3 py-2 border border-gray-200 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
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
              <span className="text-xs text-gray-400">{selectedEntries.size} selected</span>
              <button
                onClick={() => moveToVote(selectedEntries)}
                disabled={isLoading}
                className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                Move to Vote
              </button>
              <button
                onClick={() => masterAccept(selectedEntries)}
                disabled={isLoading}
                className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:border-gray-500 disabled:opacity-50 transition-colors"
              >
                Master Accept
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filter note */}
      {(searchQuery || filterStatus !== 'all' || filterDesignType !== 'all') && (
        <div className="bg-gray-50 border border-gray-200 p-3 mb-6 rounded-lg">
          <p className="text-xs text-gray-500">
            Filters apply to the current page only ({entries.length} items).
            {filteredEntries.length !== entries.length && ` Showing ${filteredEntries.length} of ${entries.length}.`}
          </p>
        </div>
      )}

      {/* Applications */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">{filteredEntries.length} applications</p>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedEntries.size === filteredEntries.length && filteredEntries.length > 0}
                onChange={toggleSelectAll}
                className="h-3.5 w-3.5 border-gray-300 rounded"
              />
              <label className="text-xs text-gray-500">Select all</label>
            </div>
          </div>
        </div>

        {filteredEntries.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-gray-400">
            No applications found
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredEntries.map((entry) => (
              <div key={entry.id} className="px-6 py-5 hover:bg-gray-50 transition-colors">
                <div className="flex items-start space-x-4">
                  <input
                    type="checkbox"
                    checked={selectedEntries.has(entry.id)}
                    onChange={() => toggleEntrySelection(entry.id)}
                    className="mt-1 h-3.5 w-3.5 border-gray-300 rounded"
                  />

                  {/* Design Image */}
                  <div className="flex-shrink-0">
                    {entry.clothingItem?.imageUrl ? (
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                        <Image
                          src={entry.clothingItem.imageUrl}
                          alt={entry.clothingItem.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                        <span className="text-gray-300 text-xs">—</span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">
                          {entry.clothingItem?.name || 'Untitled Design'}
                        </h4>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {entry.clothingItem?.itemType} · {entry.clothingItem?.gender}
                        </p>
                        <div className="flex items-center space-x-3 mt-1.5">
                          <span className="text-xs text-gray-500">
                            {entry.applicant.displayName || entry.applicant.name}
                          </span>
                          <button
                            onClick={() => copyEmail(entry.email)}
                            className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
                          >
                            {copiedEmail === entry.email ? 'Copied' : entry.email}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
                        <span className={getStatusBadge(entry.status)}>
                          {entry.status.replace('_', ' ')}
                        </span>
                        <span className="px-2 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-600">
                          {entry.designType === 'ai-generated' ? 'AI' : 'Upload'}
                        </span>

                        <div className="flex items-center space-x-2 ml-1">
                          {entry.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => moveToVote(new Set([entry.id]))}
                                disabled={isLoading}
                                className="bg-black text-white px-3 py-1 rounded text-xs hover:bg-gray-800 disabled:opacity-50 transition-colors"
                              >
                                Vote
                              </button>
                              <button
                                onClick={() => masterAccept(new Set([entry.id]))}
                                disabled={isLoading}
                                className="border border-gray-300 text-gray-600 px-3 py-1 rounded text-xs hover:border-gray-500 disabled:opacity-50 transition-colors"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => updateEntryStatus(entry.id, 'REJECTED')}
                                disabled={updatingEntry === entry.id}
                                className="text-gray-300 hover:text-gray-700 px-2 py-1 text-xs disabled:opacity-50 transition-colors"
                              >
                                {updatingEntry === entry.id ? '...' : 'Reject'}
                              </button>
                            </>
                          )}

                          {entry.status !== 'PENDING' && (
                            <button
                              onClick={() => updateEntryStatus(entry.id, 'PENDING')}
                              disabled={updatingEntry === entry.id}
                              className="border border-gray-200 text-gray-500 px-3 py-1 rounded text-xs hover:border-gray-400 disabled:opacity-50 transition-colors"
                            >
                              {updatingEntry === entry.id ? '...' : 'Reset'}
                            </button>
                          )}

                          <button
                            onClick={() => deleteEntry(entry.id, entry.email)}
                            disabled={deletingEntry === entry.id}
                            className="text-gray-300 hover:text-gray-700 text-xs disabled:opacity-50 transition-colors"
                          >
                            {deletingEntry === entry.id ? '...' : 'Delete'}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="mt-2 flex items-center space-x-4 text-xs text-gray-400">
                      <span>
                        {new Date(entry.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric', month: 'short', day: 'numeric',
                        })}
                      </span>
                      {entry.reviewedAt && (
                        <span>
                          Reviewed {new Date(entry.reviewedAt).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric',
                          })}
                        </span>
                      )}
                      {entry.clothingItem?.description && (
                        <span className="max-w-xs truncate">"{entry.clothingItem.description}"</span>
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
          <div className="px-6 py-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400">
                {((currentPageState - 1) * pageSize) + 1}–{Math.min(currentPageState * pageSize, totalCount)} of {totalCount}
              </p>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => loadPage(currentPageState - 1)}
                  disabled={currentPageState === 1 || isLoading}
                  className="px-3 py-1 border border-gray-200 rounded text-xs hover:bg-gray-50 disabled:opacity-40 transition-colors"
                >
                  Prev
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => loadPage(page)}
                    disabled={isLoading}
                    className={`px-3 py-1 border rounded text-xs transition-colors ${
                      page === currentPageState
                        ? 'bg-black text-white border-black'
                        : 'border-gray-200 hover:bg-gray-50'
                    } disabled:opacity-40`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => loadPage(currentPageState + 1)}
                  disabled={currentPageState === totalPages || isLoading}
                  className="px-3 py-1 border border-gray-200 rounded text-xs hover:bg-gray-50 disabled:opacity-40 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 