"use client";

import { useEffect, useState } from "react";
import Modal from "react-modal";
import Image from "next/image";
import ProgressBar from "@/components/common/ProgressBar";
import { CANCELLATION_QUOTES } from "@/utils/cancellationQuotes";

export default function OrderDetailsModal({ isOpen, onClose, order, onCancelSuccess }) {
  useEffect(() => {
    Modal.setAppElement("body");
  }, []);

  const [confirming, setConfirming] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [quote, setQuote] = useState("");

  if (!order) return null;
  const { id, name, image, status, price, pledged, goal, quantity } = order;
  const canCancel = status === "Awaiting Enough Pre‑Orders";

  function initiateCancel() {
    const q =
      CANCELLATION_QUOTES[
        Math.floor(Math.random() * CANCELLATION_QUOTES.length)
      ];
    setQuote(q);
    setConfirming(true);
  }

  async function confirmCancel() {
    setCanceling(true);
    try {
      await fetch(`/api/preorders/${id}`, { method: "DELETE" });
      if (onCancelSuccess) onCancelSuccess(); // 👈 trigger parent refresh + close
    } catch (err) {
      console.error("Cancel failed", err);
      setCanceling(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      contentLabel="Order Details"
      style={{
        overlay: {
          backgroundColor: "rgba(0,0,0,0.4)",
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
          maxHeight: "75vh",
          overflow: "auto",
          borderRadius: "8px",
          padding: "20px",
          backgroundColor: "#fff",
        },
      }}
    >
      <button
        onClick={onClose}
        className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl leading-none"
      >
        &times;
      </button>

      <div className="flex flex-col gap-4 mt-4">
        <div className="relative w-full pb-[100%]">
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover rounded-md"
          />
        </div>

        <h2 className="text-2xl font-bold text-gray-800">{name}</h2>
        <p className="text-gray-600">{status}</p>
        <ProgressBar pledged={pledged} goal={goal} />

        <div className="flex justify-between">
          <p className="text-lg font-semibold text-gray-800">{price}</p>
          <p className="text-gray-700">Qty: {quantity}</p>
        </div>

        {canceling ? (
          <p className="mt-4 text-center text-gray-500">Cancelling…</p>
        ) : confirming ? (
          <>
            <p className="mt-4 italic text-center text-pink-600">“{quote}”</p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={confirmCancel}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Yes, I’m sure
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                Never mind
              </button>
            </div>
          </>
        ) : canCancel ? (
          <button
            onClick={initiateCancel}
            className="mt-4 w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            🥺 Cancel Order
          </button>
        ) : (
          <p className="mt-4 text-gray-500 italic text-center">
            This order can no longer be canceled.
          </p>
        )}
      </div>
    </Modal>
  );
}
