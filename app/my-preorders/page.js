'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import OrderDetailsModal from '../../components/common/OrderDetailsModal';
import ProgressBar from '../../components/common/ProgressBar';
import { ShoppingCartIcon } from '@heroicons/react/24/outline';

export default function MyPreOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const router = useRouter();

  // Check if shop is enabled, redirect if not
  useEffect(() => {
    const isShopEnabled = process.env.NEXT_PUBLIC_ENABLE_SHOP === 'true';
    if (!isShopEnabled) {
      router.push('/discover');
      return;
    }
  }, [router]);

  const refreshOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/preorders');
      if (!res.ok) throw new Error('Failed to load pre‑orders');
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshOrders();
  }, []);

  const scrollToExplanation = () => {
    document
      .getElementById('preorder-explanation')
      ?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <main className="flex-grow">
        {/* Header */}
        <section className="py-12 bg-white shadow-sm mb-8">
          <div className="container mx-auto px-6 flex flex-col items-center">
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800 mb-2">
              My Pre-Orders
            </h1>
            <p className="text-gray-600 text-lg md:text-xl text-center">
              Track and manage your clothing item pre-orders.
            </p>
            <button
              onClick={scrollToExplanation}
              className="mt-4 px-6 py-3 text-lg font-semibold bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
            >
              How Do Pre-Orders Work?
            </button>
          </div>
        </section>

        {/* Order List */}
        <section className="container mx-auto px-6 pb-16">
          {loading ? (
            <p className="text-center">Loading…</p>
          ) : orders.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition cursor-pointer"
                  onClick={() => setSelectedOrder(order)}
                >
                  <div className="relative w-full aspect-square mb-4">
                    <Image
                      src={order.image}
                      alt={order.name}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      priority
                      className="object-cover rounded-lg"
                      unoptimized
                    />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800">
                    {order.name}
                  </h3>
                  <p className="text-sm text-gray-500 mb-2">{order.status}</p>
                  <ProgressBar pledged={order.pledged} goal={order.goal} />
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-lg font-semibold text-gray-900">
                      {order.price}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center bg-white p-10 rounded-lg shadow-md">
              <ShoppingCartIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <p className="text-xl font-medium text-gray-700 mb-2">
                No Pre-Orders Yet!
              </p>
              <p className="text-gray-500 mb-6">
                You haven&apos;t pre-ordered any clothing items yet.{' '}
              </p>
              <Link href="/discover" legacyBehavior>
                <a className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm font-medium">
                  Browse clothing items
                </a>
              </Link>
            </div>
          )}
        </section>

        {/* Order Details Modal */}
        <OrderDetailsModal
          key={selectedOrder?.id || 'modal'}
          isOpen={Boolean(selectedOrder)}
          onClose={() => setSelectedOrder(null)}
          order={selectedOrder}
          onCancelSuccess={() => {
            setSelectedOrder(null);
            refreshOrders();
          }}
        />

        {/* Pre-Order Explanation */}
        <section id="preorder-explanation" className="bg-white py-16 mt-16">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-800 mb-6">
              How Do Pre-Orders Work?
            </h2>
            <div className="max-w-3xl mx-auto space-y-12">
              {[
                {
                  title: "1. Pre-Order Your Favorite Clothing Item",
                  desc:
                    "Select a clothing item you love and place a pre-order. Your payment is securely processed, and you'll be among the first to receive it!",
                },
                {
                  title: "2. Help It Reach Its Goal",
                  desc:
                    "Each clothing item needs a minimum number of pre-orders before we can start production. You can track its progress right here.",
                },
                {
                  title: "3. Production & Shipping",
                  desc:
                    "Once the clothing item reaches its goal, we begin production! You'll be notified as it moves to shipping, and soon, it'll arrive at your doorstep.",
                },
                {
                  title: "4. Goal Not Met? Full Refund!",
                  desc:
                    "If a clothing item doesn&apos;t reach its goal in time, your payment will be fully refunded—no worries!",
                },
              ].map((step) => (
                <div key={step.title}>
                  <h3 className="text-2xl font-bold text-gray-700 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-lg text-gray-600">{step.desc}</p>
                </div>
              ))}
              <Link
                href="/discover"
                className="mt-6 inline-block px-8 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-semibold text-lg shadow-md"
              >
                Browse Clothing Items
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
