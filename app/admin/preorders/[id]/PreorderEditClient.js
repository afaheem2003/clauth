'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function PreorderEditClient({ order: initialOrder }) {
  const router = useRouter();
  const [order, setOrder] = useState(initialOrder);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [clothingItemStatus, setClothingItemStatus] = useState(order.clothingItem.status);

  const updateOrderField = (field, value) => {
    setOrder(prev => ({ ...prev, [field]: value }));
  };

  const updateClothingItemStatusField = (value) => {
    setClothingItemStatus(value);
  };

  const handleStatusUpdate = async (newStatus, endpoint, bodyFields = {}) => {
    setLoading(true);
    setError(null);
    if (!confirm(`Are you sure you want to set status to ${newStatus}?`)) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clothingItemId: order.clothingItem.id, preorderId: order.id, status: newStatus, ...bodyFields }),
      });
      const data = await res.json();
      if (res.ok) {
        if (endpoint.includes('clothing/status')) {
          setClothingItemStatus(newStatus);
          setOrder(prev => ({...prev, clothingItem: {...prev.clothingItem, status: newStatus}}));
        }
        alert(`Status updated to ${newStatus}`);
      } else {
        throw new Error(data.error || `Failed to update status to ${newStatus}`);
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveProduction = () => handleStatusUpdate('IN_PRODUCTION', '/api/clothing/approve');
  const handleMarkShipped = () => handleStatusUpdate('SHIPPED', '/api/clothing/status');
  const handleMarkDelivered = () => handleStatusUpdate('DELIVERED', '/api/clothing/status');
  const handleRefund = async () => {
    setLoading(true);
    setError(null);
    if (!confirm('Are you sure you want to refund this preorder? This is irreversible.')) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`/api/preorders/${order.id}/refund`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        alert('Preorder refunded successfully.');
        setOrder(prev => ({ ...prev, status: 'REFUNDED' }));
        router.refresh();
      } else {
        throw new Error(data.error || 'Failed to refund preorder.');
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!order) return <p>Loading order details...</p>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-6">Edit Preorder #{order.id.substring(0, 8)}</h1>
      {error && <p className="text-red-500 bg-red-100 p-3 rounded mb-4">Error: {error}</p>}
      
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h2 className="text-xl font-semibold mb-3">Customer Details</h2>
            <p><strong>User:</strong> {order.user.name || order.user.email}</p>
            <p><strong>Email:</strong> {order.user.email}</p>
            <p><strong>Address:</strong> {order.shippingAddress?.street}, {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.zip} {order.shippingAddress?.country}</p>
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-3">Clothing Item Details</h2>
            <div className="flex items-center">
              {order.clothingItem.imageUrl && (
                <Image 
                  src={order.clothingItem.imageUrl} 
                  alt={order.clothingItem.name} 
                  width={80} 
                  height={80} 
                  className="rounded mr-4 object-cover" 
                />
              )}
              <div>
                <p><strong>Item Name:</strong> {order.clothingItem.name}</p>
                <p><strong>Current Production Status:</strong> {clothingItemStatus}</p>
                <p><strong>Pledged/Goal:</strong> {order.clothingItem.pledged || 0} / {order.clothingItem.minimumGoal}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3">Order Status & Actions</h2>
          <p className="mb-1"><strong>Order Status:</strong> {order.status}</p>
          
          <div className="flex flex-wrap gap-2 mt-2">
            {clothingItemStatus === 'PENDING' && order.clothingItem.pledged >= order.clothingItem.minimumGoal && (
              <button onClick={handleApproveProduction} disabled={loading} className="btn-primary">Approve for Production</button>
            )}
            {clothingItemStatus === 'IN_PRODUCTION' && (
              <button onClick={handleMarkShipped} disabled={loading} className="btn-success">Mark Shipped</button>
            )}
            {clothingItemStatus === 'SHIPPED' && (
              <button onClick={handleMarkDelivered} disabled={loading} className="btn-success">Mark Delivered</button>
            )}
            {order.status !== 'REFUNDED' && order.status !== 'CANCELED' && (
              <button onClick={handleRefund} disabled={loading} className="btn-danger">Refund Preorder</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
