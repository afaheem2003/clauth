'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
// import { CANCELLATION_QUOTES } from '@/utils/cancellationQuotes'; // This seems unused here, remove

export default function ClothingEditClient({ initialClothingItem }) { // Renamed component and prop
  const [formData, setFormData] = useState({
    ...initialClothingItem,
    // Ensure expiresAt is formatted for date input, or empty string if null/undefined
    expiresAt: initialClothingItem.expiresAt ? new Date(initialClothingItem.expiresAt).toISOString().split('T')[0] : '' 
  });
  // const [showDeleteConfirm, setShowDeleteConfirm] = useState(false); // Seems unused
  // const [deleteQuote, setDeleteQuote] = useState(''); // Seems unused

  const router = useRouter();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) || 0 : value)
    }));
  };
  // const handleInitiateDelete = () => { // Seems unused
  //   const q = CANCELLATION_QUOTES[Math.floor(Math.random() * CANCELLATION_QUOTES.length)];
  //   setDeleteQuote(q);
  //   setShowDeleteConfirm(true);
  // };
  
  const handleDelete = async () => {
    // Consider adding a confirmation dialog here if showDeleteConfirm was intended for it
    if (!confirm('Are you sure you want to delete this clothing item?')) return;
    await fetch(`/api/clothing/${formData.id}`, { method: 'DELETE' }); // Updated API path
    router.push('/admin/clothing'); // Updated redirect path
    router.refresh(); // Refresh data on the page
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      // Convert empty string to null for optional date, otherwise format it
      expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : null,
      // Ensure numeric fields are numbers
      goal: parseFloat(formData.goal) || 0,
      minimumGoal: parseFloat(formData.minimumGoal) || 0,
    };
    // Remove id from payload for update, as it's in the URL
    delete payload.id;
    // Remove fields that might not be directly updatable or are relations
    delete payload.creator;
    delete payload.likes;
    delete payload.comments;
    delete payload.preorders;
    delete payload.votes;
    delete payload.createdAt; // Should not be updatable by admin directly
    delete payload.updatedAt; // Prisma handles this automatically

    const res = await fetch(`/api/clothing/${formData.id}`, { // Updated API path
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      router.push('/admin/clothing'); // Updated redirect path
      router.refresh(); // Refresh data on the page
    } else {
      // Handle error, e.g., show a message to the user
      const errorData = await res.json().catch(() => ({}));
      alert(`Failed to update: ${errorData.error || res.statusText}`);
    }
  };


  return (
    <div className="p-8 bg-gray-50">
      <h1 className="text-2xl font-bold mb-4 text-gray-800">Edit Clothing Item</h1> {/* Updated title */}
      <div className="mb-6">
        <img src={formData.imageUrl} alt={formData.name} className="h-48 w-48 object-cover rounded shadow" />
      </div>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Name Input */}
        <label className="flex flex-col">
          Name
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="mt-1 border p-2 rounded text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
            required
          />
        </label>

        {/* Item Type Input - ADDED */}
        <label className="flex flex-col">
          Item Type
          <input
            type="text"
            name="itemType" // Corresponds to Prisma schema field
            value={formData.itemType || ''} // Initialize with empty string if not present
            onChange={handleChange}
            className="mt-1 border p-2 rounded text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
            required
          />
        </label>

        {/* Description Textarea - ADDED */}
        <label className="flex flex-col md:col-span-2">
          Description
          <textarea
            name="description" // Corresponds to Prisma schema field
            value={formData.description || ''} // Initialize with empty string if not present
            onChange={handleChange}
            className="mt-1 border p-2 rounded text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
            rows={3}
          />
        </label>

        {/* Image URL Input */}
        <label className="flex flex-col md:col-span-2">
          Image URL
          <input
            type="text"
            name="imageUrl"
            value={formData.imageUrl}
            onChange={handleChange}
            className="mt-1 border p-2 rounded text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
            required
          />
        </label>

        {/* Raw Prompt Textarea */}
        <label className="flex flex-col md:col-span-2">
          Raw Prompt
          <textarea
            name="promptRaw"
            value={formData.promptRaw}
            onChange={handleChange}
            className="mt-1 border p-2 rounded text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
            rows={3}
          />
        </label>
        {/* Sanitized Prompt - Assuming this is auto-generated or for display only, not directly editable by admin */}
        {/* <label className="flex flex-col">
          Sanitized Prompt
          <textarea
            name="promptSanitized"
            value={formData.promptSanitized}
            readOnly // Or remove if not needed in admin edit
            className="mt-1 border p-2 rounded text-gray-800 bg-gray-100"
            rows={3}
          />
        </label> */}

        {/* Texture, Size, Emotion, Color, Outfit, Accessories, Pose - Kept as per previous decision */}
        <label className="flex flex-col">
          Texture
          <input type="text" name="texture" value={formData.texture || ''} onChange={handleChange} className="mt-1 border p-2 rounded text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none" />
        </label>
        <label className="flex flex-col">
          Size
          <input type="text" name="size" value={formData.size || ''} onChange={handleChange} className="mt-1 border p-2 rounded text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none" />
        </label>
        <label className="flex flex-col">
          Color
          <input type="text" name="color" value={formData.color || ''} onChange={handleChange} className="mt-1 border p-2 rounded text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none" />
        </label>

        {/* isPublished Checkbox */}
        <label className="flex items-center mt-4 md:col-span-2">
          <input
            type="checkbox"
            name="isPublished"
            checked={!!formData.isPublished}
            onChange={handleChange}
            className="form-checkbox h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
          />
          <span className="ml-2 text-gray-700">Published</span>
        </label>

        {/* isFeatured Checkbox - ADDED */}
        <label className="flex items-center mt-4 md:col-span-2">
          <input
            type="checkbox"
            name="isFeatured" // Corresponds to Prisma schema field
            checked={!!formData.isFeatured}
            onChange={handleChange}
            className="form-checkbox h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
          />
          <span className="ml-2 text-gray-700">Featured</span>
        </label>

        {/* Expires At Date Input */}
        <label className="flex flex-col">
          Expires At (Optional)
          <input
            type="date"
            name="expiresAt"
            value={formData.expiresAt}
            onChange={handleChange}
            className="mt-1 border p-2 rounded text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </label>
        
        {/* Goal Number Input */}
        <label className="flex flex-col">
          Funding Goal (units)
          <input
            type="number"
            name="goal"
            value={formData.goal}
            onChange={handleChange}
            min="0"
            className="mt-1 border p-2 rounded text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </label>
        
        {/* Minimum Goal Number Input */}
        <label className="flex flex-col">
          Minimum Goal (units)
          <input
            type="number"
            name="minimumGoal"
            value={formData.minimumGoal}
            onChange={handleChange}
            min="0"
            className="mt-1 border p-2 rounded text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </label>
        
        {/* Pledged (Display Only) - ADDED */}
        <label className="flex flex-col">
          Pledged (units)
          <input
            type="number"
            name="pledged"
            value={formData.pledged}
            readOnly
            className="mt-1 border p-2 rounded text-gray-800 bg-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </label>

        {/* Status Select */}
        <label className="flex flex-col">
          Status
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="mt-1 border p-2 rounded text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
          >
            {/* Assuming ClothingItemStatus enum has these values from Prisma schema */}
            <option value="PENDING">Pending</option>
            <option value="IN_PRODUCTION">In Production</option>
            <option value="SHIPPED">Shipped</option>
            <option value="CANCELED">Canceled</option>
            <option value="DELIVERED">Delivered</option> {/* Added from common statuses */}
            <option value="FAILED">Failed</option>      {/* Added from common statuses */}
          </select>
        </label>

        <div className="col-span-1 md:col-span-2 flex justify-end space-x-4 mt-6">
          <button
            type="button"
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Delete Clothing Item
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
