'use client';
import { useState } from 'react';
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

    try {
      const res = await fetch(`/api/clothing/${id}`, { method: 'DELETE' });

      if (res.ok) {
        setClothingItems(clothingItems.filter(item => item.id !== id));
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Failed to delete item' }));
        alert(`Error: ${errorData.error || 'Failed to delete item'}`);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('An error occurred while deleting the item. Please try again.');
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-light text-gray-900 tracking-tight">Clothing Items</h1>
        <p className="text-sm text-gray-400 mt-1">{clothingItems.length} items total</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <p className="text-3xl font-light text-gray-900">{aiGeneratedCount}</p>
          <p className="text-sm text-gray-400 mt-1">AI Generated</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <p className="text-3xl font-light text-gray-900">{uploadedCount}</p>
          <p className="text-sm text-gray-400 mt-1">Uploaded</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <p className="text-3xl font-light text-gray-900">{publishedCount}</p>
          <p className="text-sm text-gray-400 mt-1">Published</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Search</label>
            <input
              type="text"
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Type</label>
            <select
              value={filterDesignType}
              onChange={(e) => setFilterDesignType(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
            >
              <option value="all">All Types</option>
              <option value="ai-generated">AI Generated</option>
              <option value="uploaded">Uploaded</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
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
      <div className="mb-3 text-xs text-gray-400">
        {filteredItems.length} of {clothingItems.length} items
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Image</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Published</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredItems.map(item => (
              <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="h-10 w-10 object-cover rounded-md" />
                  ) : (
                    <div className="h-10 w-10 bg-gray-100 rounded-md flex items-center justify-center text-gray-300 text-xs">
                      —
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.name}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                    {item.designType === 'ai-generated' ? 'AI' : 'Upload'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    item.isPublished ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {item.isPublished ? 'Live' : 'Draft'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                    {item.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex space-x-3">
                    <Link
                      href={`/admin/clothing/${item.id}`}
                      className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-sm text-gray-300 hover:text-gray-700 font-medium transition-colors"
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
          <div className="px-6 py-12 text-center text-sm text-gray-400">
            No items found matching your filters
          </div>
        )}
      </div>
    </div>
  );
}