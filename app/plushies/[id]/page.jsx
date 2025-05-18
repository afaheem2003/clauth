'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { loadStripe } from '@stripe/stripe-js';
import { CANCELLATION_QUOTES } from '@/utils/cancellationQuotes';
import Input from '@/components/common/Input';
import BigSpinner from '@/components/common/BigSpinner';
import Footer from '@/components/common/Footer';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function PlushieDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session } = useSession();

  const [plushie, setPlushie]           = useState(null);
  const [likes, setLikes]               = useState(0);
  const [hasLiked, setHasLiked]         = useState(false);
  const [comments, setComments]         = useState([]);
  const [newComment, setNewComment]     = useState('');
  const [commentError, setCommentError] = useState('');
  const [replyInputs, setReplyInputs]   = useState({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteQuote, setDeleteQuote]             = useState('');
  const [showPaymentForm, setShowPaymentForm]     = useState(false);
  const [desiredQty, setDesiredQty]               = useState(1);

  // Fetch plushie
  useEffect(() => {
    (async () => {
      const res  = await fetch(`/api/plushies/${id}`);
      const json = await res.json();
      if (res.ok) {
        setPlushie(json.plushie);
        setLikes(json.plushie.likes.length);
        setHasLiked(json.plushie.likes.some(l => l.userId === session?.user?.uid));
      }
    })();
  }, [id, session?.user?.uid]);

  // Fetch comments
  useEffect(() => {
    if (!plushie) return;
    (async () => {
      const res  = await fetch(`/api/comment?plushieId=${id}`);
      const json = await res.json();
      if (res.ok) setComments(json.comments);
    })();
  }, [plushie]);

  if (!plushie) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">
        Loading…
      </div>
    );
  }

  const {
    imageUrl,
    name,
    description,
    animal,
    creator,
    goal,
    pledged,
  } = plushie;

  const author      = creator?.displayName || creator?.name || 'Unknown';
  const progress    = (pledged / goal) * 100;
  const goalReached = pledged >= goal;

  // Like toggle
  async function handleLike() {
    const res = await fetch('/api/like', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ plushieId: id }),
    });
    if (!res.ok) return;
    const { liked } = await res.json();
    setHasLiked(liked);
    setLikes(n => liked ? n + 1 : Math.max(0, n - 1));
  }

  // Delete flow
  function initiateDelete() {
    setDeleteQuote(
      CANCELLATION_QUOTES[Math.floor(Math.random() * CANCELLATION_QUOTES.length)]
    );
    setShowDeleteConfirm(true);
  }
  async function confirmDelete() {
    const res = await fetch(`/api/plushies/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (res.ok) router.push('/');
  }

  // Pre-order
  async function handleConfirmPayment() {
    const stripe = await stripePromise;
    const res    = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        plushieId: id,
        imageUrl,
        quantity: desiredQty,
        returnTo: `/plushies/${id}`,
      }),
    });
    const { sessionId } = await res.json();
    await stripe.redirectToCheckout({ sessionId });
  }

  // Comment submit & replies
  async function handleCommentSubmit(e, parentId = null) {
    e.preventDefault();
    const text = parentId
      ? replyInputs[parentId]?.trim()
      : newComment.trim();
    if (!text) return;

    const res = await fetch('/api/comment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ plushieId: id, text, parentId }),
    });
    if (!res.ok) {
      const { error } = await res.json();
      if (error.includes('Inappropriate')) {
        setCommentError('⚠️ Please avoid offensive language.');
        return;
      }
    }

    setNewComment('');
    setReplyInputs(prev => {
      const u = { ...prev };
      if (parentId) delete u[parentId];
      return u;
    });

    const c = await fetch(`/api/comment?plushieId=${id}`);
    setComments((await c.json()).comments);
  }

  async function handleDeleteComment(cid) {
    await fetch(`/api/comment?commentId=${cid}`, {
      method: 'DELETE', credentials: 'include'
    });
    const c = await fetch(`/api/comment?plushieId=${id}`);
    setComments((await c.json()).comments);
  }

  return (
    <>
      <main className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-screen-lg mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="md:flex">
              {/* Image */}
              <div className="md:w-1/2 h-80 md:h-auto">
                <Image
                  src={imageUrl}
                  alt={name}
                  width={800}
                  height={800}
                  unoptimized
                  className="
                    object-cover w-full h-full
                    rounded-t-2xl md:rounded-l-2xl md:rounded-tr-none
                  "
                />
              </div>

              {/* Details */}
              <div className="md:w-1/2 p-8 flex flex-col">
                <h1 className="text-5xl font-extrabold text-gray-900">{name}</h1>
                <p className="mt-1 text-gray-700">
                  by:{' '}
                  <span
                    className="italic hover:underline cursor-pointer"
                    onClick={() => router.push(`/user/${creator?.displayName || creator?.id}`)}
                  >
                    {author}
                  </span>
                </p>

                <p className="mt-4 text-gray-700 text-lg">
                  Animal: <span className="font-medium">{animal}</span>
                </p>
                {description && (
                  <p className="mt-4 text-gray-800">{description}</p>
                )}

                {/* Delete UI */}
                {session?.user?.uid === creator.id && !goalReached && (
                  !showDeleteConfirm
                    ? (
                      <button
                        onClick={initiateDelete}
                        className="mt-6 px-4 py-2 border border-red-500 text-red-600 rounded hover:bg-red-50 transition"
                      >
                        Delete Plushie
                      </button>
                    )
                    : (
                      <div className="mt-6 bg-gray-100 p-4 rounded space-y-3">
                        <p className="italic text-red-600">“{deleteQuote}”</p>
                        <div className="flex gap-2">
                          <button
                            onClick={confirmDelete}
                            className="flex-1 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
                          >
                            Yes, delete
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(false)}
                            className="flex-1 px-4 py-2 border rounded hover:bg-gray-200 transition"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )
                )}

                {/* Like & Progress */}
                <div className="mt-6 flex items-center gap-4">
                  <button
                    onClick={handleLike}
                    className="flex items-center space-x-2 bg-gray-100 px-3 py-1 rounded-full hover:bg-gray-200 transition"
                  >
                    <span className="text-red-500 text-xl">❤️</span>
                    <span className="font-medium text-gray-700">{likes}</span>
                  </button>
                  <div className="flex-1 bg-gray-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-green-500 h-full"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-gray-700 font-medium">
                    {pledged}/{goal}
                  </span>
                </div>

                {/* Pre-order */}
                {!goalReached ? (
                  <div className="mt-6 space-y-4">
                    <button
                      onClick={() => setShowPaymentForm(f => !f)}
                      className="px-6 py-3 bg-black text-white font-medium rounded hover:bg-gray-900 transition"
                    >
                      Pre-order (${(54.99 * desiredQty).toFixed(2)})
                    </button>
                    {showPaymentForm && (
                      <div className="flex items-center gap-4">
                        <label className="flex items-center text-gray-700">
                          Qty:
                          <input
                            type="number"
                            min="1"
                            value={desiredQty}
                            onChange={e => setDesiredQty(Math.max(1, +e.target.value))}
                            className="ml-2 w-20 px-2 py-1 border rounded"
                          />
                        </label>
                        <button
                          onClick={handleConfirmPayment}
                          className="px-6 py-3 bg-green-600 text-white rounded hover:bg-green-700 transition"
                        >
                          Checkout
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="mt-6 text-green-600 font-semibold">
                    Goal reached! Thanks for your support.
                  </p>
                )}

                {/* Comments section */}
                <div className="mt-8 flex-1 overflow-auto">
                  {comments.length === 0
                    ? <p className="italic text-gray-500">No comments yet.</p>
                    : comments.map(c => (
                      <div key={c.id} className="mb-6">
                        <div className="flex justify-between">
                          <div>
                            <p className="font-semibold text-gray-800">
                              {c.author?.displayName || c.author?.name}
                            </p>
                            <p className="text-gray-700">{c.content}</p>
                          </div>
                          {session?.user?.uid === c.author?.id && (
                            <button
                              onClick={() => handleDeleteComment(c.id)}
                              className="text-gray-400 hover:text-red-600"
                            >
                              &times;
                            </button>
                          )}
                        </div>
                        <button
                          onClick={() =>
                            setReplyInputs(p => ({ ...p, [c.id]: p[c.id] ? undefined : '' }))
                          }
                          className="mt-1 text-blue-600 text-sm"
                        >
                          {replyInputs[c.id] ? 'Cancel' : 'Reply'}
                        </button>
                        {replyInputs[c.id] !== undefined && (
                          <form onSubmit={e => handleCommentSubmit(e, c.id)} className="mt-2 space-y-2">
                            <Input
                              label="Reply"
                              value={replyInputs[c.id]}
                              setValue={v => setReplyInputs(p => ({ ...p, [c.id]: v }))}
                              required
                            />
                            <button
                              type="submit"
                              className="px-4 py-2 bg-black text-white rounded hover:bg-gray-900 transition text-sm"
                            >
                              Post Reply
                            </button>
                          </form>
                        )}
                      </div>
                    ))
                  }

                  {/* New comment box */}
                  <form onSubmit={e => handleCommentSubmit(e)} className="space-y-2">
                    <textarea
                      rows={2}
                      value={newComment}
                      onChange={e => {
                        setNewComment(e.target.value);
                        setCommentError('');
                      }}
                      placeholder="Add a comment..."
                      className="w-full p-3 border rounded focus:ring focus:ring-gray-300 placeholder-gray-600"
                    />
                    {commentError && <p className="text-red-600 text-sm">{commentError}</p>}
                    <button
                      type="submit"
                      className="px-6 py-2 bg-black text-white rounded hover:bg-gray-900 transition"
                    >
                      Post Comment
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
