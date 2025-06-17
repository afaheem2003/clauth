'use client'

import { useState } from 'react'

export default function AdminWaitlistClient({ entries: initialEntries }) {
  const [entries, setEntries] = useState(initialEntries)
  const [copiedEmail, setCopiedEmail] = useState('')
  const [updatingEntry, setUpdatingEntry] = useState('')
  const [deletingEntry, setDeletingEntry] = useState('')

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
      const response = await fetch('/api/waitlist', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, status }),
      })

      if (response.ok) {
        const data = await response.json()
        // Update the entry in the local state
        setEntries(prevEntries => 
          prevEntries.map(entry => 
            entry.id === id 
              ? { ...entry, status, approvedAt: data.entry.approvedAt }
              : entry
          )
        )
        alert(`Entry ${status.toLowerCase()} successfully!`)
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Failed to update entry')
      }
    } catch (err) {
      console.error('Failed to update entry:', err)
      alert('Failed to update entry')
    } finally {
      setUpdatingEntry('')
    }
  }

  const deleteEntry = async (id, email) => {
    if (!confirm(`Are you sure you want to delete ${email} from the waitlist? This action cannot be undone.`)) {
      return
    }

    setDeletingEntry(id)
    try {
      const response = await fetch('/api/waitlist', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      })

      if (response.ok) {
        // Remove the entry from local state
        setEntries(prevEntries => prevEntries.filter(entry => entry.id !== id))
        alert('Entry deleted successfully!')
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Failed to delete entry')
      }
    } catch (err) {
      console.error('Failed to delete entry:', err)
      alert('Failed to delete entry')
    } finally {
      setDeletingEntry('')
    }
  }

  const getStatusBadge = (status) => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full"
    switch (status) {
      case 'APPROVED':
        return `${baseClasses} bg-green-100 text-green-800`
      case 'REJECTED':
        return `${baseClasses} bg-red-100 text-red-800`
      case 'PENDING':
      default:
        return `${baseClasses} bg-yellow-100 text-yellow-800`
    }
  }

  const pendingCount = entries.filter(entry => entry.status === 'PENDING').length
  const approvedCount = entries.filter(entry => entry.status === 'APPROVED').length
  const rejectedCount = entries.filter(entry => entry.status === 'REJECTED').length

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">
              Waitlist Management ({entries.length} total)
            </h1>
            <p className="text-gray-600 mt-1">
              Manage and approve waitlist submissions
            </p>
            <div className="flex gap-4 mt-3">
              <span className="text-sm text-yellow-600">
                Pending: {pendingCount}
              </span>
              <span className="text-sm text-green-600">
                Approved: {approvedCount}
              </span>
              <span className="text-sm text-red-600">
                Rejected: {rejectedCount}
              </span>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {entries.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                      No waitlist entries yet
                    </td>
                  </tr>
                ) : (
                  entries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {entry.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={getStatusBadge(entry.status)}>
                          {entry.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {new Date(entry.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                        {entry.approvedAt && (
                          <div className="text-xs text-gray-400">
                            Approved: {new Date(entry.approvedAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => copyEmail(entry.email)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            {copiedEmail === entry.email ? 'Copied!' : 'Copy'}
                          </button>
                          
                          {entry.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => updateEntryStatus(entry.id, 'APPROVED')}
                                disabled={updatingEntry === entry.id}
                                className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 disabled:opacity-50"
                              >
                                {updatingEntry === entry.id ? 'Updating...' : 'Approve'}
                              </button>
                              <button
                                onClick={() => updateEntryStatus(entry.id, 'REJECTED')}
                                disabled={updatingEntry === entry.id}
                                className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700 disabled:opacity-50"
                              >
                                {updatingEntry === entry.id ? 'Updating...' : 'Reject'}
                              </button>
                            </>
                          )}
                          
                          {entry.status !== 'PENDING' && (
                            <button
                              onClick={() => updateEntryStatus(entry.id, 'PENDING')}
                              disabled={updatingEntry === entry.id}
                              className="bg-gray-600 text-white px-3 py-1 rounded text-xs hover:bg-gray-700 disabled:opacity-50"
                            >
                              {updatingEntry === entry.id ? 'Updating...' : 'Reset'}
                            </button>
                          )}

                          <button
                            onClick={() => deleteEntry(entry.id, entry.email)}
                            disabled={deletingEntry === entry.id}
                            className="bg-red-800 text-white px-3 py-1 rounded text-xs hover:bg-red-900 disabled:opacity-50"
                          >
                            {deletingEntry === entry.id ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {entries.length > 0 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-700">
                  Total entries: <span className="font-medium">{entries.length}</span>
                </p>
                <button
                  onClick={copyAllEmails}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
                >
                  Copy All Emails
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 