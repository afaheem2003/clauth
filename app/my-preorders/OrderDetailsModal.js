"use client"; // Ensure it's a client component

import Modal from "react-modal";
import Image from "next/image";
import ProgressBar from "./ProgressBar";

export default function OrderDetailsModal({ isOpen, onClose, order }) {
  if (!order) return null;

  const { name, image, status, price, pledged = 0, goal = 50 } = order;

  const canCancel = status === "Awaiting Enough Pre-Orders";

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      contentLabel="Order Details"
      style={{
        overlay: {
          backgroundColor: "rgba(0, 0, 0, 0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
        },
        content: {
          position: "relative",
          inset: "auto",
          maxWidth: "500px",
          width: "90%",
          maxHeight: "80vh",
          overflow: "auto",
          borderRadius: "10px",
          padding: "20px",
          backgroundColor: "#fff",
        },
      }}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-2xl"
      >
        &times;
      </button>

      <div className="flex flex-col gap-4 mt-6">
        {/* Plushie Image */}
        <div className="relative w-full aspect-square">
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover rounded-lg"
          />
        </div>

        {/* Plushie Info */}
        <h2 className="text-3xl font-bold text-gray-800">{name}</h2>
        <p className="text-gray-600">{status}</p>

        {/* Progress Bar */}
        <ProgressBar pledged={pledged} goal={goal} />

        {/* Price */}
        <p className="text-lg font-semibold text-gray-800">{price}</p>

        {/* Cancel Button */}
        {canCancel ? (
          <button
            onClick={() => alert("Order Canceled (Mock Function)")}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Cancel Order
          </button>
        ) : (
          <p className="text-gray-500 italic">
            This order can no longer be canceled.
          </p>
        )}
      </div>
    </Modal>
  );
}
