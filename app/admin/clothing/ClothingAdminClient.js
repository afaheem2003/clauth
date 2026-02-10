'use client';
import React, { useState } from 'react';
import Link from 'next/link';

export default function ClothingAdminClient({ initialClothingItems }) {
  const [clothingItems, setClothingItems] = useState(initialClothingItems);
  const [filterDesignType, setFilterDesignType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter items
  const filteredItems = clothingItems.filter(item => {
    const matchesSearch = item.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDesignType = filterDesignType === 'all' || item.designType === filterDesignType;
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    return matchesSearch && matchesDesignType && matchesStatus;
  });

  // Calculate stats
  const aiGeneratedCount = clothingItems.filter(item => item.designType === 'ai-generated').length;
  const uploadedCount = clothingItems.filter(item => item.designType === 'uploaded').length;
  const publishedCount = clothingItems.filter(item => item.isPublished).length;

  const handleDelete = async (id) => {
    if (!confirm('Delete this clothing item?')) return;
    const res = await fetch(`/api/clothing/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setClothingItems(clothingItems.filter(item => item.id !== id));
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Manage Clothing Items</h1>
          <p className="text-gray-600 mt-1">Total: {clothingItems.length} items</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="text-2xl font-bold text-purple-600">{aiGeneratedCount}</div>
            <div className="text-sm text-purple-600">🤖 AI Generated</div>
          </div>
          <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
            <div className="text-2xl font-bold text-indigo-600">{uploadedCount}</div>
            <div className="text-sm text-indigo-600">📤 Uploaded</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="text-2xl font-bold text-green-600">{publishedCount}</div>
            <div className="text-sm text-green-600">✓ Published</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Design Type</label>
              <select
                value={filterDesignType}
                onChange={(e) => setFilterDesignType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                <option value="ai-generated">AI Generated</option>
                <option value="uploaded">Uploaded</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="CONCEPT">Concept</option>
                <option value="SELECTED">Selected</option>
                <option value="PRODUCING">Producing</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results count */}
        <div className="mb-4 text-sm text-gray-600">
          Showing {filteredItems.length} of {clothingItems.length} items
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left font-medium text-gray-700">Image</th>
                <th className="p-3 text-left font-medium text-gray-700">Name</th>
                <th className="p-3 text-left font-medium text-gray-700">Type</th>
                <th className="p-3 text-left font-medium text-gray-700">Published</th>
                <th className="p-3 text-left font-medium text-gray-700">Status</th>
                <th className="p-3 text-left font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map(item => (
                <tr key={item.id} className="border-t hover:bg-gray-50">
                  <td className="p-3">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="h-12 w-12 object-cover rounded" />
                    ) : (
                      <div className="h-12 w-12 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs">
                        No Image
                      </div>
                    )}
                  </td>
                  <td className="p-3 text-gray-800 font-medium">{item.name}</td>
                  <td className="p-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      item.designType === 'ai-generated'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-indigo-100 text-indigo-800'
                    }`}>
                      {item.designType === 'ai-generated' ? '🤖 AI' : '📤 Upload'}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      item.isPublished
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {item.isPublished ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {item.status}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex space-x-3">
                      <Link 
                        href={`/admin/clothing/${item.id}`} 
                        className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                      >
                        Edit
                      </Link>
                      <button 
                        onClick={() => handleDelete(item.id)} 
                        className="text-red-600 hover:text-red-800 font-medium text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredItems.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              No items found matching your filters
            </div>
          )}
        </div>
      </div>
    </div>
  );
}