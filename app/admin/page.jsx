import React from 'react';
import { prisma } from '@/lib/prisma';
import StatusBarChart from './StatusBarChart';
import TrendLineChart from './TrendLineChart';
import { ChartBarIcon, UsersIcon, CurrencyDollarIcon, ShoppingCartIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import StatCard from '@/components/admin/StatCard';
import ChartCard from '@/components/admin/ChartCard';
import { RecentPreordersTable, PreorderColumns } from '@/components/admin/RecentPreordersTable';

export const dynamic = 'force-dynamic';

async function getAdminDashboardData() {
  // 1) Totals
  const [clothingItemCount, userCount, preorderCount] = await Promise.all([
    prisma.clothingItem.count(),
    prisma.user.count(),
    prisma.preorder.count(),
  ]);

  // 2) Status breakdown
  const clothingItemStatusRaw = await prisma.clothingItem.groupBy({
    by: ['status'],
    _count: { status: true },
  });
  const preorderStatusRaw = await prisma.preorder.groupBy({
    by: ['status'],
    _count: { status: true },
  });
  const clothingItemStatus = clothingItemStatusRaw.map((d) => ({ status: d.status, count: d._count.status }));
  const preorderStatus = preorderStatusRaw.map((d) => ({ status: d.status, count: d._count.status }));

  // 3) Top clothing items
  const topClothingItems = await prisma.clothingItem.findMany({
    orderBy: { pledged: 'desc' },
    take: 5,
    select: {
      id: true,
      name: true,
      pledged: true,
      goal: true,
      texture: true,
      size: true,
      status: true,
      creator: {
        select: {
          displayName: true,
        },
      },
    },
  });

  // 4) User signup trends
  const startOfMonth = new Date(); startOfMonth.setDate(1);
  const newUsersThisMonth = await prisma.user.count({
    where: { createdAt: { gte: startOfMonth } },
  });

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentUsers = await prisma.user.findMany({
    where: { createdAt: { gte: thirtyDaysAgo } },
    select: { createdAt: true },
  });

  const userMap = {};
  recentUsers.forEach((u) => {
    const day = u.createdAt.toISOString().slice(0, 10);
    userMap[day] = (userMap[day] || 0) + 1;
  });

  const userTrend = Array.from({ length: 30 }).map((_, i) => {
    const d = new Date(thirtyDaysAgo); d.setDate(d.getDate() + i);
    const date = d.toISOString().slice(0, 10);
    return { date, count: userMap[date] || 0 };
  });

  // 5) Recent preorders
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentPreorders = await prisma.preorder.findMany({
    where: { createdAt: { gte: sevenDaysAgo } },
    include: { user: true, clothingItem: true },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  const preorderMap = {};
  recentPreorders.forEach((o) => {
    const day = o.createdAt.toISOString().slice(0, 10);
    preorderMap[day] = (preorderMap[day] || 0) + 1;
  });

  const preorderTrend = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(sevenDaysAgo); d.setDate(d.getDate() + i);
    const date = d.toISOString().slice(0, 10);
    return { date, count: preorderMap[date] || 0 };
  });

  return {
    clothingItemCount,
    userCount,
    preorderCount,
    newUsersThisMonth,
    clothingItemStatus,
    preorderStatus,
    topClothingItems,
    userTrend,
    recentPreorders,
    preorderTrend,
  };
}

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'ADMIN') {
    return <p className="p-6">Access Denied. You must be an admin to view this page.</p>;
  }

  const data = await getAdminDashboardData();

  return (
    <div className="p-8 bg-gray-50 space-y-12">
      <h1 className="text-4xl font-bold text-gray-900">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Clothing Items" value={data.clothingItemCount} />
        <StatCard title="Total Users" value={data.userCount} subtitle={`${data.newUsersThisMonth} new this month`} />
        <StatCard title="Total Pre-orders" value={data.preorderCount} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Clothing Items by Status">
          <StatusBarChart data={data.clothingItemStatus} dataKey="status" />
        </ChartCard>
        <ChartCard title="Pre-orders by Status">
          <StatusBarChart data={data.preorderStatus} dataKey="status" />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="User Signups (Last 30 Days)">
          <TrendLineChart data={data.userTrend} />
        </ChartCard>
        <ChartCard title="Pre-orders (Last 7 Days)">
          <TrendLineChart data={data.preorderTrend} />
        </ChartCard>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900">Top 5 Clothing Items by Pledges</h2>
        <table className="w-full bg-white rounded-lg shadow overflow-hidden">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-800">Name</th>
              <th className="px-4 py-3 text-left font-medium text-gray-800">Artist</th>
              <th className="px-4 py-3 text-left font-medium text-gray-800">Pledged</th>
              <th className="px-4 py-3 text-left font-medium text-gray-800">Goal</th>
              <th className="px-4 py-3 text-left font-medium text-gray-800">Texture</th>
              <th className="px-4 py-3 text-left font-medium text-gray-800">Size</th>
              <th className="px-4 py-3 text-left font-medium text-gray-800">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.topClothingItems.map((item, i) => (
              <tr key={item.id} className="border-t last:border-b">
                <td className="px-4 py-3 text-gray-900">
                  <Link href={`/admin/clothing/${item.id}`} legacyBehavior>
                    <a className="hover:underline">{item.name}</a>
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-900">{item.creator?.displayName ?? 'Unknown Artist'}</td>
                <td className="px-4 py-3 text-gray-900">{item.pledged}</td>
                <td className="px-4 py-3 text-gray-900">{item.goal}</td>
                <td className="px-4 py-3 text-gray-900">{item.texture}</td>
                <td className="px-4 py-3 text-gray-900">{item.size}</td>
                <td className="px-4 py-3 text-gray-900">{item.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900">Recent Pre-orders</h2>
        <table className="w-full bg-white rounded-lg shadow overflow-hidden">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-800">When</th>
              <th className="px-4 py-3 text-left font-medium text-gray-800">User</th>
              <th className="px-4 py-3 text-left font-medium text-gray-800">Clothing Item</th>
              <th className="px-4 py-3 text-left font-medium text-gray-800">Qty</th>
            </tr>
          </thead>
          <tbody>
            {data.recentPreorders.map((o) => (
              <tr key={o.id} className="border-t last:border-b">
                <td className="px-4 py-3 text-gray-900">{new Date(o.createdAt).toLocaleString()}</td>
                <td className="px-4 py-3 text-gray-900">
                  {o.user?.email ?? o.guestEmail ?? 'Unknown'}
                </td>
                <td className="px-4 py-3 text-gray-900">{o.clothingItem.name}</td>
                <td className="px-4 py-3 text-gray-900">{o.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Subcomponents

function StatCard({ title, value, subtitle }) {
  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-700">{title}</h3>
      <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
      {subtitle && <p className="mt-1 text-sm text-gray-600">{subtitle}</p>}
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h3 className="mb-4 text-lg font-medium text-gray-700">{title}</h3>
      {children}
    </div>
  );
}
