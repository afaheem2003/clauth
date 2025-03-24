"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import OrderDetailsModal from "./OrderDetailsModal";
import ProgressBar from "./ProgressBar";

// Updated Dummy Pre-Orders Data
const DUMMY_ORDERS = [
  {
    id: "1",
    name: "Galaxy Dragon",
    image: "/images/plushie-placeholder.png",
    status: "Awaiting Enough Pre-Orders",
    price: "$54.99",
    pledged: 10,
    goal: 50,
  },
  {
    id: "2",
    name: "Bubble Bunny",
    image: "/images/plushie-placeholder.png",
    status: "Shipped",
    price: "$54.99",
    pledged: 50,
    goal: 50,
  },
  {
    id: "3",
    name: "Robot Cat",
    image: "/images/plushie-placeholder.png",
    status: "In Production",
    price: "$54.99",
    pledged: 50,
    goal: 50,
  },
];

export default function MyPreOrdersPage() {
  const [orders, setOrders] = useState(DUMMY_ORDERS);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const scrollToExplanation = () => {
    document.getElementById("preorder-explanation").scrollIntoView({
      behavior: "smooth",
    });
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="py-12 bg-white shadow-sm mb-8">
        <div className="container mx-auto px-6 flex flex-col items-center">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800 mb-2">
            My Pre-Orders
          </h1>
          <p className="text-gray-600 text-lg md:text-xl text-center">
            Track and manage your plushie pre-orders.
          </p>
          {/* Button to Scroll to Explanation */}
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
        {orders.length > 0 ? (
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
                    className="object-cover rounded-lg"
                  />
                </div>

                <h3 className="text-xl font-semibold text-gray-800">
                  {order.name}
                </h3>
                <p className="text-sm text-gray-500 mb-2">{order.status}</p>

                {/* Progress Bar */}
                <ProgressBar pledged={order.pledged} goal={order.goal} />

                {/* Price */}
                <div className="flex items-center justify-between mt-3">
                  <span className="text-lg font-semibold text-gray-900">
                    {order.price}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600 text-center text-lg">
            You haven’t pre-ordered any plushies yet.{" "}
            <Link href="/discover" className="text-blue-600 hover:underline">
              Browse plushies
            </Link>
          </p>
        )}
      </section>

      {/* Order Details Modal */}
      <OrderDetailsModal
        key={selectedOrder?.id || "default"} // Prevents hydration issues
        isOpen={Boolean(selectedOrder)} // Ensures consistent boolean value
        onClose={() => setSelectedOrder(null)}
        order={selectedOrder}
      />

      {/* Pre-Order Explanation Section */}
      <section id="preorder-explanation" className="bg-white py-16 mt-16">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-800 mb-6">
            How Do Pre-Orders Work?
          </h2>

          <div className="max-w-3xl mx-auto">
            {/* Step 1 */}
            <div className="mb-12">
              <h3 className="text-2xl font-bold text-gray-700 mb-2">
                1. Pre-Order Your Favorite Plushie
              </h3>
              <p className="text-lg text-gray-600">
                Select a plushie you love and place a pre-order. Your payment is
                securely processed, and you’ll be among the first to receive it!
              </p>
            </div>

            {/* Step 2 */}
            <div className="mb-12">
              <h3 className="text-2xl font-bold text-gray-700 mb-2">
                2. Reaching the Minimum Goal
              </h3>
              <p className="text-lg text-gray-600">
                Each plushie needs a minimum number of pre-orders before we can
                start production. You can track its progress right here.
              </p>
            </div>

            {/* Step 3 */}
            <div className="mb-12">
              <h3 className="text-2xl font-bold text-gray-700 mb-2">
                3. Production & Shipping
              </h3>
              <p className="text-lg text-gray-600">
                Once the plushie reaches its goal, we begin production! You’ll
                be notified as it moves to shipping, and soon, it’ll arrive at
                your doorstep.
              </p>
            </div>

            {/* Step 4 */}
            <div className="mb-12">
              <h3 className="text-2xl font-bold text-gray-700 mb-2">
                4. What If the Goal Isn’t Met?
              </h3>
              <p className="text-lg text-gray-600">
                If a plushie doesn’t reach its goal in time, your payment will
                be fully refunded—no worries!
              </p>
            </div>

            {/* CTA */}
            <div className="mt-8">
              <Link
                href="/discover"
                className="px-6 py-3 text-lg font-semibold bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
              >
                Browse Plushies
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
