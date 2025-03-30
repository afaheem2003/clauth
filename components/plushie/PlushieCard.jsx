"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Modal from "react-modal";
import { useSession } from "next-auth/react";

// A small pink heart icon for the like button
const LikeIcon = () => (
  <svg
    className="w-5 h-5 text-pink-500"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M12 4.248C8.852-1.828 0 1.42 0 7.245 0 9.96 1.613 12.32 4.388 14.7 6.667 16.71 9.55 18.95 12 21c2.45-2.05 5.333-4.29 7.612-6.3C22.387 12.32 24 9.96 24 7.245 24 1.42 15.148-1.828 12 4.248z" />
  </svg>
);

export default function PlushieCard({ plushie = {}, setPlushies }) {
  const { data: session } = useSession();

  const {
    id = "no-id",
    imageUrl = "/images/plushie-placeholder.png",
    name = "Untitled Plushie",
    promptSanitized = "No description available.",
    pledged: initialPledged = 0,
    goal = 50,
    creator,
    likes: initialLikes = [],
    comments: initialComments = [],
  } = plushie;

  const author = creator?.displayName || creator?.name || "@Unknown";

  // 1) Initialize 'likes' to the total number of Like records
  const [likes, setLikes] = useState(initialLikes.length);

  // 2) Check if the current user already liked this plushie
  const [hasLiked, setHasLiked] = useState(false);
  useEffect(() => {
    if (!session?.user?.uid) return;
    const alreadyLiked = initialLikes.some(
      (like) => like.userId === session.user.uid
    );
    setHasLiked(alreadyLiked);
  }, [initialLikes, session?.user?.uid]);

  // Other states
  const [pledged, setPledged] = useState(initialPledged);
  const [comments, setComments] = useState(initialComments);
  const [newComment, setNewComment] = useState("");
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Setup React Modal
  useEffect(() => {
    if (typeof window !== "undefined") {
      Modal.setAppElement("body");
    }
  }, []);

  // 3) Toggle like
  async function handleLike() {
    try {
      const res = await fetch("/api/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ plushieId: id }),
      });
      if (!res.ok) {
        console.error("API error toggling like");
        return;
      }
      const data = await res.json();
      // If data.liked === true => user just liked; else user just unliked
      if (data.liked === true) {
        setHasLiked(true);
        setLikes((prev) => prev + 1);
      } else {
        setHasLiked(false);
        setLikes((prev) => (prev > 0 ? prev - 1 : 0));
      }
    } catch (err) {
      console.error("Error toggling like:", err);
    }
  }

  // Submit new comment
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
      if (!res.ok) {
        console.error("API error posting comment");
        return;
      }
      setComments((prev) => [
        ...prev,
        {
          id: `local-${Date.now()}`,
          content: text,
          author: {
            id: session?.user?.uid,
            displayName: session?.user?.name || "You",
          },
        },
      ]);
      setNewComment("");
    } catch (err) {
      console.error("Error posting comment:", err);
    }
  }

  // Delete comment
  async function handleDeleteComment(commentId) {
    try {
      const res = await fetch(`/api/comment?commentId=${commentId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        console.error("API error deleting comment");
        return;
      }
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err) {
      console.error("Error deleting comment:", err);
    }
  }

  // Payment flow
  const handlePreOrder = () => setShowPaymentForm((prev) => !prev);
  const handleConfirmPayment = () => {
    const newPledged = pledged + 1;
    setPledged(newPledged);
    if (setPlushies) {
      setPlushies((prevArr) =>
        prevArr.map((p) => (p.id === id ? { ...p, pledged: newPledged } : p))
      );
    }
    setShowPaymentForm(false);
  };

  // Compute progress
  const progress = (pledged / goal) * 100;
  const goalReached = pledged >= goal;

  return (
    <>
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

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onRequestClose={() => setIsModalOpen(false)}
        contentLabel="Plushie Details"
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
          const modalEl = document.querySelector(".ReactModal__Content");
          if (modalEl) {
            modalEl.style.transform = "scale(1)";
          }
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
          <p className="text-gray-600">{promptSanitized}</p>

          {/* Like & Pledge Info */}
          <div className="flex items-center gap-3">
            {/* Remove "disabled={hasLiked}" so we can un-like */}
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

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded h-4 mt-1 overflow-hidden">
            <div
              className="bg-green-500 h-4"
              style={{ width: `${progress}%` }}
            />
          </div>
          {goalReached && (
            <p className="text-green-600 font-semibold">
              Goal Reached! We’ll produce this plushie!
            </p>
          )}
          {!goalReached && (
            <button
              onClick={handlePreOrder}
              className="px-4 py-2 bg-blue-900 text-white rounded hover:bg-blue-800 w-fit"
            >
              Pre-order ($54.99)
            </button>
          )}
          {showPaymentForm && !goalReached && (
            <div className="p-3 border border-blue-300 rounded mt-2">
              <h3 className="font-semibold text-blue-700 mb-2">
                Payment Details
              </h3>
              <p className="text-sm text-gray-600 mb-2">
                Enter your card info to buy this plush for $54.99
              </p>
              <div className="flex flex-col gap-2 mb-2">
                <input
                  placeholder="Card Number"
                  className="p-2 border border-gray-300 rounded placeholder-gray-700 text-gray-800"
                />
                <input
                  placeholder="Expiry (MM/YY)"
                  className="p-2 border border-gray-300 rounded placeholder-gray-700 text-gray-800"
                />
                <input
                  placeholder="CVV"
                  className="p-2 border border-gray-300 rounded placeholder-gray-700 text-gray-800 w-24"
                />
              </div>
              <button
                onClick={handleConfirmPayment}
                className="px-4 py-2 bg-green-900 text-white rounded hover:bg-green-800"
              >
                Confirm Purchase
              </button>
            </div>
          )}

          <hr />

          {/* Comments Section */}
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
                      {c.author?.displayName ||
                        c.author?.name ||
                        "Unknown User"}
                    </p>
                    <p className="text-gray-800">{c.content}</p>
                  </div>
                  {session?.user?.uid && c.author?.id === session.user.uid && (
                    <button
                      onClick={() => handleDeleteComment(c.id)}
                      className="text-gray-500 hover:text-red-600 ml-2"
                      title="Delete Comment"
                    >
                      &times;
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Add Comment */}
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
