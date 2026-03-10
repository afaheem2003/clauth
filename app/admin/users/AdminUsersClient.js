'use client'

import { useState } from 'react'

export default function AdminUsersClient({ users: initialUsers }) {
  const [users, setUsers] = useState(initialUsers)
  const [updatingUser, setUpdatingUser] = useState('')
  const [deletingUser, setDeletingUser] = useState('')

  const updateUserStatus = async (userId, status) => {
    setUpdatingUser(userId)
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, status }),
      })

      if (response.ok) {
        const data = await response.json()
        // Update the user in the local state
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user.id === userId 
              ? { ...user, waitlistStatus: status, waitlistInfo: data.waitlistInfo }
              : user
          )
        )
        alert(`User ${status.toLowerCase()} successfully!`)
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Failed to update user')
      }
    } catch (err) {
      console.error('Failed to update user:', err)
      alert('Failed to update user')
    } finally {
      setUpdatingUser('')
    }
  }

  const deleteUser = async (userId, email) => {
    if (!confirm(`Are you sure you want to delete ${email}? This will permanently delete their account and all associated data. This action cannot be undone.`)) {
      return
    }

    setDeletingUser(userId)
    try {
      const response = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      })

      if (response.ok) {
        // Remove the user from local state
        setUsers(prevUsers => prevUsers.filter(user => user.id !== userId))
        alert('User deleted successfully!')
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Failed to delete user')
      }
    } catch (err) {
      console.error('Failed to delete user:', err)
      alert('Failed to delete user')
    } finally {
      setDeletingUser('')
    }
  }

  const getStatusBadge = (status, role) => {
    const baseClasses = "px-2 py-0.5 text-xs font-medium rounded"

    if (role === 'ADMIN') {
      return `${baseClasses} bg-gray-900 text-white`
    }

    switch (status) {
      case 'APPROVED':
        return `${baseClasses} bg-gray-100 text-gray-700`
      case 'WAITLISTED':
      default:
        return `${baseClasses} bg-gray-50 text-gray-500 border border-gray-200`
    }
  }

  const getStatusText = (status, role) => {
    if (role === 'ADMIN') return 'ADMIN'
    return status
  }

  const waitlistedCount = users.filter(user => user.waitlistStatus === 'WAITLISTED' && user.role !== 'ADMIN').length
  const approvedCount = users.filter(user => user.waitlistStatus === 'APPROVED' || user.role === 'ADMIN').length
  const adminCount = users.filter(user => user.role === 'ADMIN').length

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-light text-gray-900 tracking-tight">Users</h1>
        <div className="flex gap-5 mt-2">
          <span className="text-sm text-gray-400">{users.length} total</span>
          <span className="text-sm text-gray-400">{adminCount} admins</span>
          <span className="text-sm text-gray-400">{approvedCount} approved</span>
          <span className="text-sm text-gray-400">{waitlistedCount} waitlisted</span>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Joined</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-sm text-gray-400">
                    No users yet
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          {user.image ? (
                            <img className="h-8 w-8 rounded-full object-cover" src={user.image} alt="" />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                              <span className="text-xs font-medium text-gray-500">
                                {user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {user.name || 'No name'}
                          </div>
                          <div className="text-xs text-gray-400">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getStatusBadge(user.waitlistStatus, user.role)}>
                        {getStatusText(user.waitlistStatus, user.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs text-gray-500">
                        {user.waitlistInfo?.signupDate ?
                          new Date(user.waitlistInfo.signupDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          }) :
                          new Date(user.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        }
                      </div>
                      {user.waitlistInfo?.approvedAt && (
                        <div className="text-xs text-gray-400">
                          Approved {new Date(user.waitlistInfo.approvedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center space-x-3">
                        {user.role !== 'ADMIN' && (
                          <>
                            {user.waitlistStatus === 'WAITLISTED' && (
                              <button
                                onClick={() => updateUserStatus(user.id, 'APPROVED')}
                                disabled={updatingUser === user.id}
                                className="bg-black text-white px-3 py-1 rounded text-xs hover:bg-gray-800 disabled:opacity-50 transition-colors"
                              >
                                {updatingUser === user.id ? 'Updating...' : 'Approve'}
                              </button>
                            )}

                            {user.waitlistStatus === 'APPROVED' && (
                              <button
                                onClick={() => updateUserStatus(user.id, 'WAITLISTED')}
                                disabled={updatingUser === user.id}
                                className="border border-gray-300 text-gray-600 px-3 py-1 rounded text-xs hover:border-gray-500 hover:text-gray-900 disabled:opacity-50 transition-colors"
                              >
                                {updatingUser === user.id ? 'Updating...' : 'Waitlist'}
                              </button>
                            )}
                          </>
                        )}

                        <button
                          onClick={() => deleteUser(user.id, user.email)}
                          disabled={deletingUser === user.id}
                          className="text-gray-300 hover:text-gray-700 text-xs disabled:opacity-50 transition-colors"
                        >
                          {deletingUser === user.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {users.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              {users.length} users · ordered by signup date
            </p>
          </div>
        )}
      </div>
    </div>
  )
} 