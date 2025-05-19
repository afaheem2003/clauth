'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const PAGE_SIZE = 5;

export default function PreordersAdminClient({ initialOrders }) {
  const [orders, setOrders] = useState(initialOrders);
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  const handleDelete = async (id) => {
    if (!confirm('Cancel this preorder?')) return;
    const res = await fetch(`/api/preorders/${id}`, { method: 'DELETE' });
    if (res.ok) setOrders(prev => prev.filter(o => o.id !== id));
    else alert('Failed to cancel preorder.');
  };

  const handleRefund = async (id) => {
    if (!confirm('Issue a refund for this preorder?')) return;
    const res = await fetch(`/api/preorders/${id}/refund`, { method: 'POST' });
    if (res.ok) {
      const updated = await res.json();
      alert('Refund issued successfully.');
      setOrders(prev => prev.map(o => (o.id === id ? updated : o)));
    } else {
      alert('Refund failed.');
    }
  };

  const groupedByClothingItem = useMemo(() => {
    return orders.reduce((acc, order) => {
      const key = order.clothingItem.id;
      if (!acc[key]) {
        acc[key] = { clothingItem: order.clothingItem, orders: [] };
      }
      acc[key].orders.push(order);
      return acc;
    }, {});
  }, [orders]);

  const filteredClothingItemKeys = useMemo(() => {
    const keys = Object.keys(groupedByClothingItem);
    if (!searchTerm) return keys;
    return keys.filter(key => {
      const item = groupedByClothingItem[key].clothingItem;
      const customerQuery = groupedByClothingItem[key].orders.some(o => 
        o.user.email?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        o.user.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      return item.name.toLowerCase().includes(searchTerm.toLowerCase()) || customerQuery;
    });
  }, [groupedByClothingItem, searchTerm]);

  const totalPages = Math.ceil(filteredClothingItemKeys.length / PAGE_SIZE);
  const paginatedClothingItemKeys = filteredClothingItemKeys.slice(
    page * PAGE_SIZE,
    (page + 1) * PAGE_SIZE
  );

  const updateOrderStatus = (orderId, newStatus) => {
    setOrders(prevOrders => prevOrders.map(o => o.id === orderId ? {...o, status: newStatus} : o));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Manage Preorders</h1>
      
      <div className="mb-6">
        <input 
          type="text"
          placeholder="Search by item name or customer..."
          className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-purple-500 focus:border-purple-500"
          value={searchTerm}
          onChange={(e) => {setSearchTerm(e.target.value); setPage(0);}}
        />
      </div>

      {filteredClothingItemKeys.length === 0 ? (
        <p className="text-gray-600 text-center py-10">No preorders found{searchTerm ? ' matching your search' : ''}.</p>
      ) : (
        <div className="space-y-8">
          {paginatedClothingItemKeys.map(key => {
            const { clothingItem, orders: itemOrders } = groupedByClothingItem[key];
            const totalQuantity = itemOrders.reduce((sum, o) => sum + o.quantity, 0);
            return (
              <div key={key} className="bg-white shadow-lg rounded-xl overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white flex items-center space-x-4">
                  {clothingItem.imageUrl && (
                    <Image src={clothingItem.imageUrl} alt={clothingItem.name} width={64} height={64} className="rounded-lg object-cover shadow-md" />
                  )}
                  <div>
                    <h2 className="text-2xl font-bold truncate" title={clothingItem.name}>{clothingItem.name}</h2>
                    <p className="text-sm opacity-90">Total Preordered: {totalQuantity}</p>
                  </div>
                  <Link href={`/admin/preorders?clothingItemId=${clothingItem.id}`} className="ml-auto px-4 py-2 bg-white text-purple-600 rounded-md text-sm font-semibold hover:bg-purple-50 transition">
                    View All for this Item
                  </Link>
                </div>
                
                <div className="p-2">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {itemOrders.slice(0, 5).map(order => (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{order.id.substring(0,8)}...</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{order.user.name || order.user.email}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{order.quantity}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${order.status === 'CONFIRMED' || order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : order.status === 'SHIPPED' || order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                            <Link href={`/admin/preorders/${order.id}`} className="text-purple-600 hover:text-purple-800">
                              Edit
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {itemOrders.length > 5 && (
                     <div className="text-center p-2">
                        <Link href={`/admin/preorders?clothingItemId=${clothingItem.id}`} className="text-sm text-purple-600 hover:text-purple-800">
                            View all {itemOrders.length} orders for this item...
                        </Link>
                     </div>
                    )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-8 flex justify-center items-center space-x-2">
          <button 
            onClick={() => setPage(p => Math.max(0, p - 1))} 
            disabled={page === 0}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">Page {page + 1} of {totalPages}</span>
          <button 
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} 
            disabled={page === totalPages - 1}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
