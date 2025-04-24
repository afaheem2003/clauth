// app/admin/users/UsersAdminClient.js
'use client';
import React from 'react';
import Link from 'next/link';

export default function UsersAdminClient({
  initialUsers,
  currentPage,
  pageSize,
  totalCount,
  searchQuery,
}) {
  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="p-8 bg-gray-50">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">Manage Users</h1>

      {/* GET form triggers full SSR fetch with the new query */}
      <form action="/admin/users" method="get" className="mb-4 flex">
        <input
          name="q"
          defaultValue={searchQuery}
          type="text"
          placeholder="Search by email"
          className="border p-2 rounded text-gray-900 bg-white placeholder-gray-500 flex-grow"
        />
        <input type="hidden" name="page" value="1" />
        <button
          type="submit"
          className="ml-2 px-4 py-2 bg-blue-600 text-white rounded"
        >
          Search
        </button>
      </form>

      {/* Users table */}
      <table className="w-full bg-white rounded shadow">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-3 text-left font-medium text-gray-900">Email</th>
            <th className="p-3 text-left font-medium text-gray-900">Role</th>
            <th className="p-3 text-left font-medium text-gray-900">Joined</th>
            <th className="p-3 text-left font-medium text-gray-900">Actions</th>
          </tr>
        </thead>
        <tbody>
          {initialUsers.map((u) => (
            <tr key={u.id} className="border-t hover:bg-gray-50">
              <td className="p-3 text-gray-900">{u.email}</td>
              <td className="p-3 text-gray-900">{u.role}</td>
              <td className="p-3 text-gray-900">
                {new Date(u.createdAt).toLocaleDateString()}
              </td>
              <td className="p-3 flex space-x-2">
                {u.role === 'ADMIN' ? (
                  <Link href={`/admin/users?demote=${u.id}&q=${encodeURIComponent(searchQuery)}&page=${currentPage}`}>
                    <button className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600">
                      Demote
                    </button>
                  </Link>
                ) : (
                  <Link href={`/admin/users?promote=${u.id}&q=${encodeURIComponent(searchQuery)}&page=${currentPage}`}>
                    <button className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700">
                      Promote
                    </button>
                  </Link>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="mt-4 flex justify-center space-x-2">
        {Array.from({ length: totalPages }, (_, i) => (
          <Link
            key={i}
            href={`/admin/users?q=${encodeURIComponent(searchQuery)}&page=${i + 1}`}
          >
            <button
              className={`px-3 py-1 rounded ${
                i + 1 === currentPage
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-900'
              }`}
            >
              {i + 1}
            </button>
          </Link>
        ))}
      </div>
    </div>
  );
}
