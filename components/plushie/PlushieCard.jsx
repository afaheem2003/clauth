"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Modal from "react-modal";
import { useSession } from "next-auth/react";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
);

// cute pink heart
const LikeIcon = () => (
  <svg className="w-5 h-5 text-pink-500" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 4.248C8.852-1.828 0 1.42 0 7.245 0 9.96 1.613 12.32 4.388 14.7 6.667 16.71 9.55 18.95 12 21c2.45-2.05 5.333-4.29 7.612-6.3C22.387 12.32 24 9.96 24 7.245 24 1.42 15.148-1.828 12 4.248z" />
  </svg>
);

export default function PlushieCard({ plushie = {}, setPlushies }) {
  const { data: session } = useSession();
  const {
    id,
    imageUrl = "/images/plushie-placeholder.png",
    name = "Untitled Plushie",
    description = "",
    pledged: initialPledged = 0,
    goal = 50,
    creator,
    likes: initialLikes = [],
    comments: initialComments = [],
  } = plushie;

  const author =
    creator?.displayName ||
    creator?.name ||
    "Unknown";

  const [likes, setLikes] = useState(initialLikes.length);
  const [hasLiked, setHasLiked] = useState(false);
  useEffect(() => {
    if (!session?.user?.uid) return;
    setHasLiked(initialLikes.some((l) => l.userId === session.user.uid));
  }, [initialLikes, session?.user?.uid]);

  const [comments, setComments] = useState(initialComments);
  const [newComment, setNewComment] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  const [pledged, setPledged] = useState(initialPledged);
  const [desiredQty, setDesiredQty] = useState(1);

  async function handleConfirmPayment() {
    setShowPaymentForm(false);
    const stripe = await stripePromise;
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        plushieId: id,
        imageUrl,
        quantity: desiredQty,
        returnTo: window.location.pathname,
      }),
    });
    if (!res.ok) return console.error("Failed to create Stripe session");
    const { sessionId } = await res.json();
    const { error } = await stripe.redirectToCheckout({ sessionId });
    if (error) console.error(error.message);
  }

  async function handleLike() {
    const res = await fetch("/api/like", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ plushieId: id }),
    });
    if (!res.ok) return console.error("Error toggling like");
    const { liked } = await res.json();
    setHasLiked(liked);
    setLikes((n) => (liked ? n + 1 : Math.max(0, n - 1)));
  }

  async function handleCommentSubmit(e) {
    e.preventDefault();
    const text = newComment.trim();
    if (!text) return;

    try {
      const res = await fetch("/api/comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ plushieId: id, text }),
      });
      if (!res.ok) throw new Error("Server error");

      const { comment } = await res.json();
      setComments((c) => [...c, comment]);
      setNewComment("");
    } catch (err) {
      console.error("Error posting comment", err);
    }
  }

  async function handleDeleteComment(cid) {
    if (cid.startsWith("tmp-")) {
      setComments((c) => c.filter((x) => x.id !== cid));
      return;
    }

    try {
      const res = await fetch(`/api/comment?commentId=${cid}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Server error");
      setComments((c) => c.filter((x) => x.id !== cid));
    } catch (err) {
      console.error("Error deleting comment", err);
    }
  }

  useEffect(() => {
    if (typeof window !== "undefined") Modal.setAppElement("body");
  }, []);

  const progress = (pledged / goal) * 100;
  const goalReached = pledged >= goal;

  return (
    <>
      {/* ---------- Card preview ---------- */}
      <div
        className="relative group cursor-pointer w-full h-auto overflow-hidden rounded-lg"
        onClick={() => setIsModalOpen(true)}
      >
        <div className="relative w-full aspect-square">
          <Image
            src={imageUrl}
            alt={name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition duration-300 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100">
          <p className="text-white text-lg md:text-xl font-bold mb-1">
            {author}
          </p>
          {!goalReached ? (
            <p className="text-white text-sm md:text-base">
              {pledged}/{goal} bought
            </p>
          ) : (
            <p className="text-green-300 text-sm md:text-base font-semibold">
              Goal Reached!
            </p>
          )}
        </div>
      </div>

      {/* ---------- Details Modal ---------- */}
      <Modal
        isOpen={isModalOpen}
        onRequestClose={() => setIsModalOpen(false)}
        contentLabel="Plushie Details"
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
            transform: "scale(0.95)",
            transition: "transform 0.3s ease",
            maxWidth: "700px",
            width: "90%",
            maxHeight: "80vh",
            overflow: "auto",
            borderRadius: "10px",
            padding: "20px",
            backgroundColor: "#fff",
          },
        }}
        onAfterOpen={() => {
          const el = document.querySelector(".ReactModal__Content");
          if (el) el.style.transform = "scale(1)";
        }}
      >
        <button
          onClick={() => setIsModalOpen(false)}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-2xl"
        >
          &times;
        </button>

        <div className="flex flex-col gap-4 mt-6">
          <div className="relative w-full aspect-square">
            <Image
              src={imageUrl}
              alt={name}
              fill
              className="object-cover rounded-lg"
            />
          </div>

          <h2 className="text-3xl font-bold text-gray-800">{name}</h2>
          <p className="text-gray-500 italic -mt-2">by {author}</p>
          {description && (
            <p className="text-gray-800 mt-1">{description}</p>
          )}

          {/* Like + progress */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleLike}
              className="flex items-center px-3 py-2 bg-pink-100 text-pink-600 rounded hover:bg-pink-200"
            >
              <LikeIcon />
              <span className="ml-1">{likes}</span>
            </button>
            <div className="text-gray-700 flex items-center">
              <span className="font-semibold mr-1">Bought:</span>
              {pledged}/{goal}
            </div>
          </div>

          <div className="w-full bg-gray-200 rounded h-4 mt-1 overflow-hidden">
            <div className="bg-green-500 h-4" style={{ width: `${progress}%` }} />
          </div>

          <div className="mt-4">
            {!goalReached ? (
              <>
                <button
                  onClick={() => setShowPaymentForm((f) => !f)}
                  className="px-4 py-2 bg-blue-900 text-white rounded hover:bg-blue-800"
                >
                  Pre-order (${(54.99 * desiredQty).toFixed(2)})
                </button>
                {showPaymentForm && (
                  <div className="mt-3 p-4 border rounded space-y-2">
                    <label className="block text-gray-800">
                      Quantity:
                      <input
                        type="number"
                        min="1"
                        value={desiredQty}
                        onChange={(e) =>
                          setDesiredQty(Math.max(1, +e.target.value))
                        }
                        className="ml-2 w-16 p-1 border rounded text-gray-800"
                      />
                    </label>
                    <button
                      onClick={handleConfirmPayment}
                      className="mt-2 px-4 py-2 bg-green-900 text-white rounded hover:bg-green-800"
                    >
                      Continue to Payment
                    </button>
                  </div>
                )}
              </>
            ) : (
              <p className="mt-2 text-green-600 font-semibold">
                Goal reached! Thank you for your support.
              </p>
            )}
          </div>

          <hr />

          <div className="space-y-3 max-h-40 overflow-y-auto">
            {comments.length === 0 ? (
              <p className="text-gray-500 italic">No comments yet.</p>
            ) : (
              comments.map((c) => (
                <div
                  key={c.id}
                  className="bg-gray-100 p-2 rounded flex justify-between"
                >
                  <div>
                    <p className="text-gray-800 font-semibold">
                      {c.author?.displayName || c.author?.name || "Unknown"}
                    </p>
                    <p className="text-gray-800">{c.content}</p>
                  </div>
                  {session?.user?.uid === c.author?.id && (
                    <button
                      onClick={() => handleDeleteComment(c.id)}
                      className="text-gray-500 hover:text-red-600 ml-2"
                    >
                      &times;
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleCommentSubmit} className="mt-4 space-y-2">
            <input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="w-full p-2 border border-gray-300 rounded placeholder-gray-700 text-gray-800"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-gray-900 text-white rounded hover:bg-gray-700"
            >
              Post
            </button>
          </form>
        </div>
      </Modal>
    </>
  );
}
