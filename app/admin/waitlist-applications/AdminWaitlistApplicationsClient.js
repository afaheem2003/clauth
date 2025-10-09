'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

export default function AdminWaitlistApplicationsClient() {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [updatingApp, setUpdatingApp] = useState('')
  const [selectedApp, setSelectedApp] = useState(null)
  const [adminNotes, setAdminNotes] = useState('')

  useEffect(() => {
    fetchApplications()
  }, [])

  const fetchApplications = async () => {
    try {
      const response = await fetch('/api/admin/waitlist-applications')
      if (response.ok) {
        const data = await response.json()
        setApplications(data.applications)
      }
    } catch (error) {
      console.error('Failed to fetch applications:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateApplicationStatus = async (applicationId, status, notes = '') => {
    setUpdatingApp(applicationId)
    try {
      const response = await fetch('/api/admin/waitlist-applications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          applicationId, 
          status,
          adminNotes: notes 
        }),
      })

      if (response.ok) {
        const data = await response.json()
        // Update the application in the local state
        setApplications(prevApps => 
          prevApps.map(app => 
            app.id === applicationId 
              ? { ...app, status, reviewedAt: new Date().toISOString(), adminNotes: notes }
              : app
          )
        )
        alert(`Application ${status.toLowerCase()} successfully!`)
        setSelectedApp(null)
        setAdminNotes('')
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Failed to update application')
      }
    } catch (err) {
      console.error('Failed to update application:', err)
      alert('Failed to update application')
    } finally {
      setUpdatingApp('')
    }
  }

  const getStatusBadge = (status) => {
    const baseClasses = "px-3 py-1 text-sm font-medium rounded-full"
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

  const pendingCount = applications.filter(app => app.status === 'PENDING').length
  const approvedCount = applications.filter(app => app.status === 'APPROVED').length
  const rejectedCount = applications.filter(app => app.status === 'REJECTED').length

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-6 text-gray-600 font-light text-lg">Loading applications...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">
              Waitlist Design Applications ({applications.length} total)
            </h1>
            <p className="text-gray-600 mt-1">
              Review and approve design submissions for early access
            </p>
            <div className="flex gap-6 mt-3">
              <span className="text-sm text-yellow-600 font-medium">
                Pending: {pendingCount}
              </span>
              <span className="text-sm text-green-600 font-medium">
                Approved: {approvedCount}
              </span>
              <span className="text-sm text-red-600 font-medium">
                Rejected: {rejectedCount}
              </span>
            </div>
          </div>
          
          {applications.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              No applications submitted yet
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
              {applications.map((app) => (
                <div key={app.id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  {/* Design Image */}
                  <div className="aspect-[2/3] relative">
                    <Image
                      src={app.clothingItem.imageUrl}
                      alt={app.clothingItem.name}
                      fill
                      className="object-cover rounded-t-lg"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                    <div className="absolute top-3 right-3">
                      <span className={getStatusBadge(app.status)}>
                        {app.status}
                      </span>
                    </div>
                  </div>

                  {/* Application Details */}
                  <div className="p-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {app.clothingItem.name}
                    </h3>
                    
                    {app.clothingItem.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {app.clothingItem.description}
                      </p>
                    )}

                    <div className="space-y-2 text-sm text-gray-500">
                      <p><strong>Applicant:</strong> {app.applicant.displayName || app.applicant.name}</p>
                      <p><strong>Email:</strong> {app.applicant.email}</p>
                      <p><strong>Type:</strong> {app.clothingItem.itemType}</p>
                      <p><strong>Gender:</strong> {app.clothingItem.gender === 'MASCULINE' ? 'Male' : app.clothingItem.gender === 'FEMININE' ? 'Female' : 'Unisex'}</p>
                      <p><strong>Quality:</strong> {app.clothingItem.quality === 'medium' ? 'Studio' : app.clothingItem.quality === 'high' ? 'Runway' : app.clothingItem.quality}</p>
                      {app.referralCodes.length > 0 && (
                        <p><strong>Referrals:</strong> {app.referralCodes.join(', ')}</p>
                      )}
                      <p><strong>Submitted:</strong> {new Date(app.createdAt).toLocaleDateString()}</p>
                      {app.reviewedAt && (
                        <p><strong>Reviewed:</strong> {new Date(app.reviewedAt).toLocaleDateString()}</p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-4 space-y-2">
                      <button
                        onClick={() => setSelectedApp(app)}
                        className="w-full bg-gray-100 text-gray-700 px-3 py-2 text-sm rounded hover:bg-gray-200 transition-colors"
                      >
                        View Details
                      </button>
                      
                      {app.status === 'PENDING' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => updateApplicationStatus(app.id, 'APPROVED')}
                            disabled={updatingApp === app.id}
                            className="flex-1 bg-green-600 text-white px-3 py-2 text-sm rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
                          >
                            {updatingApp === app.id ? 'Updating...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => updateApplicationStatus(app.id, 'REJECTED')}
                            disabled={updatingApp === app.id}
                            className="flex-1 bg-red-600 text-white px-3 py-2 text-sm rounded hover:bg-red-700 disabled:opacity-50 transition-colors"
                          >
                            {updatingApp === app.id ? 'Updating...' : 'Reject'}
                          </button>
                        </div>
                      )}

                      {app.status !== 'PENDING' && (
                        <button
                          onClick={() => updateApplicationStatus(app.id, 'PENDING')}
                          disabled={updatingApp === app.id}
                          className="w-full bg-gray-600 text-white px-3 py-2 text-sm rounded hover:bg-gray-700 disabled:opacity-50 transition-colors"
                        >
                          {updatingApp === app.id ? 'Updating...' : 'Reset to Pending'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedApp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-900">{selectedApp.clothingItem.name}</h2>
                <button
                  onClick={() => setSelectedApp(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Design Image */}
                <div>
                  <Image
                    src={selectedApp.clothingItem.imageUrl}
                    alt={selectedApp.clothingItem.name}
                    width={400}
                    height={500}
                    className="w-full rounded-lg"
                  />
                </div>

                {/* Details */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Application Details</h3>
                    <div className="space-y-2 text-sm">
                      <p><strong>Status:</strong> <span className={getStatusBadge(selectedApp.status)}>{selectedApp.status}</span></p>
                      <p><strong>Applicant:</strong> {selectedApp.applicant.displayName || selectedApp.applicant.name}</p>
                      <p><strong>Email:</strong> {selectedApp.applicant.email}</p>
                      <p><strong>Type:</strong> {selectedApp.clothingItem.itemType}</p>
                      <p><strong>Gender:</strong> {selectedApp.clothingItem.gender === 'MASCULINE' ? 'Male' : selectedApp.clothingItem.gender === 'FEMININE' ? 'Female' : 'Unisex'}</p>
                      <p><strong>Quality:</strong> {selectedApp.clothingItem.quality === 'medium' ? 'Studio' : selectedApp.clothingItem.quality === 'high' ? 'Runway' : selectedApp.clothingItem.quality}</p>
                      <p><strong>Submitted:</strong> {new Date(selectedApp.createdAt).toLocaleString()}</p>
                      {selectedApp.reviewedAt && (
                        <p><strong>Reviewed:</strong> {new Date(selectedApp.reviewedAt).toLocaleString()}</p>
                      )}
                    </div>
                  </div>

                  {selectedApp.clothingItem.description && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                      <p className="text-sm text-gray-600">{selectedApp.clothingItem.description}</p>
                    </div>
                  )}

                  {selectedApp.clothingItem.promptRaw && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Original Prompt</h4>
                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{selectedApp.clothingItem.promptRaw}</p>
                    </div>
                  )}

                  {selectedApp.referralCodes.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Referral Codes Used</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedApp.referralCodes.map((code, index) => (
                          <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                            {code}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedApp.adminNotes && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Admin Notes</h4>
                      <p className="text-sm text-gray-600 bg-yellow-50 p-3 rounded">{selectedApp.adminNotes}</p>
                    </div>
                  )}

                  {/* Admin Actions */}
                  <div className="pt-4 border-t">
                    <h4 className="font-medium text-gray-900 mb-3">Admin Actions</h4>
                    
                    <textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Add admin notes (optional)"
                      className="w-full p-3 border border-gray-300 rounded mb-3 h-20 resize-none"
                    />

                    <div className="flex space-x-3">
                      {selectedApp.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => updateApplicationStatus(selectedApp.id, 'APPROVED', adminNotes)}
                            disabled={updatingApp === selectedApp.id}
                            className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                          >
                            {updatingApp === selectedApp.id ? 'Approving...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => updateApplicationStatus(selectedApp.id, 'REJECTED', adminNotes)}
                            disabled={updatingApp === selectedApp.id}
                            className="flex-1 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
                          >
                            {updatingApp === selectedApp.id ? 'Rejecting...' : 'Reject'}
                          </button>
                        </>
                      )}

                      {selectedApp.status !== 'PENDING' && (
                        <button
                          onClick={() => updateApplicationStatus(selectedApp.id, 'PENDING', adminNotes)}
                          disabled={updatingApp === selectedApp.id}
                          className="flex-1 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 disabled:opacity-50"
                        >
                          {updatingApp === selectedApp.id ? 'Updating...' : 'Reset to Pending'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 