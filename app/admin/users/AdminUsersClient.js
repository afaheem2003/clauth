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
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full"
    
    if (role === 'ADMIN') {
      return `${baseClasses} bg-blue-100 text-blue-800`
    }
    
    switch (status) {
      case 'APPROVED':
        return `${baseClasses} bg-green-100 text-green-800`
      case 'WAITLISTED':
      default:
        return `${baseClasses} bg-yellow-100 text-yellow-800`
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
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">
              User Management ({users.length} total)
            </h1>
            <p className="text-gray-600 mt-1">
              Manage users and their waitlist status
            </p>
            <div className="flex gap-4 mt-3">
              <span className="text-sm text-blue-600">
                Admins: {adminCount}
              </span>
              <span className="text-sm text-green-600">
                Approved: {approvedCount}
              </span>
              <span className="text-sm text-yellow-600">
                Waitlisted: {waitlistedCount}
              </span>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Signup Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                      No users yet
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {user.image ? (
                              <img className="h-10 w-10 rounded-full" src={user.image} alt="" />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                <span className="text-sm font-medium text-gray-700">
                                  {user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.name || 'No name'}
                            </div>
                            <div className="text-sm text-gray-500">
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
                        <div className="text-sm text-gray-500">
                          {user.waitlistInfo?.signupDate ? 
                            new Date(user.waitlistInfo.signupDate).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) :
                            new Date(user.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          }
                        </div>
                        {user.waitlistInfo?.approvedAt && (
                          <div className="text-xs text-gray-400">
                            Approved: {new Date(user.waitlistInfo.approvedAt).toLocaleDateString('en-US', {
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
                          {user.role !== 'ADMIN' && (
                            <>
                              {user.waitlistStatus === 'WAITLISTED' && (
                                <button
                                  onClick={() => updateUserStatus(user.id, 'APPROVED')}
                                  disabled={updatingUser === user.id}
                                  className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 disabled:opacity-50"
                                >
                                  {updatingUser === user.id ? 'Updating...' : 'Approve'}
                                </button>
                              )}
                              
                              {user.waitlistStatus === 'APPROVED' && (
                                <button
                                  onClick={() => updateUserStatus(user.id, 'WAITLISTED')}
                                  disabled={updatingUser === user.id}
                                  className="bg-yellow-600 text-white px-3 py-1 rounded text-xs hover:bg-yellow-700 disabled:opacity-50"
                                >
                                  {updatingUser === user.id ? 'Updating...' : 'Waitlist'}
                                </button>
                              )}
                            </>
                          )}

                          <button
                            onClick={() => deleteUser(user.id, user.email)}
                            disabled={deletingUser === user.id}
                            className="bg-red-800 text-white px-3 py-1 rounded text-xs hover:bg-red-900 disabled:opacity-50"
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
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-700">
                  Total users: <span className="font-medium">{users.length}</span>
                </p>
                <div className="text-sm text-gray-500">
                  Ordered by signup date (earliest first)
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 