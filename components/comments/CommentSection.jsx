'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link'; // For author names
import { TrashIcon } from '@heroicons/react/24/outline'; // Import TrashIcon

export default function CommentSection({ itemId, itemType, commentsData = [], onCommentPosted }) {
  const { data: session, status } = useSession();
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [deletingCommentId, setDeletingCommentId] = useState(null);
  const [replyingToId, setReplyingToId] = useState(null); // Track which comment is being replied to
  const [replyText, setReplyText] = useState(''); // Text for the reply

  const handleCommentSubmit = async (e, parentId = null) => {
    e.preventDefault();
    const content = parentId ? replyText : newComment;

    if (!content.trim()) {
      setError('Comment cannot be empty.');
      return;
    }
    if (status !== 'authenticated') {
      setError('You must be logged in to comment.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/comment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content,
          clothingItemId: itemId,
          parentId: parentId,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to post comment');
      }

      // Clear input
      if (parentId) {
        setReplyText('');
        setReplyingToId(null);
      } else {
        setNewComment('');
      }

      if (onCommentPosted) {
        onCommentPosted(); // Trigger callback to refresh comments
      }
    } catch (err) {
      console.error('Error posting comment:', err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (status !== 'authenticated') {
      setError('You must be logged in to delete comments.');
      return;
    }
    setDeletingCommentId(commentId);
    setError(null);
    try {
      const res = await fetch(`/api/comment?commentId=${commentId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete comment');
      }

      if (onCommentPosted) { // Reuse onCommentPosted to refresh the list
        onCommentPosted();
      }
    } catch (err) {
      console.error('Error deleting comment:', err);
      setError(err.message);
    } finally {
      setDeletingCommentId(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6">
      {/* Header */}
      <div className="mb-10">
        <h2 className="text-2xl font-semibold text-gray-900">
          Comments
          {commentsData.length > 0 && (
            <span className="ml-2 text-lg font-normal text-gray-500">
              ({commentsData.length})
            </span>
          )}
        </h2>
      </div>

      {/* New Comment Form */}
      {status === 'authenticated' && (
        <form onSubmit={handleCommentSubmit} className="mb-12">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-gray-300 transition-colors">
            <textarea
              id="commentText"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="w-full px-5 py-4 border-0 resize-none focus:ring-0 text-base text-gray-900 placeholder-gray-400 bg-transparent"
              rows={4}
              maxLength={500}
              disabled={isSubmitting}
            />
            <div className="px-5 py-3 bg-gray-50 flex items-center justify-between border-t border-gray-200">
              <span className="text-sm text-gray-500">
                {newComment.length}/500
              </span>
              <button
                type="submit"
                disabled={isSubmitting || !newComment.trim()}
                className="px-5 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all"
              >
                {isSubmitting ? 'Posting...' : 'Post Comment'}
              </button>
            </div>
          </div>
          {error && (
            <div className="mt-3 text-sm text-red-600">
              {error}
            </div>
          )}
        </form>
      )}

      {status === 'unauthenticated' && (
        <div className="mb-12 py-10 text-center bg-gray-50 rounded-xl border border-gray-200">
          <p className="text-base text-gray-600">
            <Link href="/login" className="text-gray-900 font-medium hover:underline">
              Sign in
            </Link>
            {' '}to join the conversation
          </p>
        </div>
      )}

      {/* Comments List */}
      {commentsData.length > 0 ? (
        <div className="space-y-6">
          {commentsData.map((comment) => (
            <div key={comment.id}>
              {/* Main Comment */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-300 transition-colors">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center">
                    <span className="text-sm font-semibold text-white uppercase">
                      {comment.author?.displayName?.charAt(0) || comment.author?.name?.charAt(0) || 'A'}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-gray-900">
                          {comment.author?.displayName || comment.author?.name || 'Anonymous'}
                        </span>
                        <span className="text-sm text-gray-500">
                          {new Date(comment.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: new Date(comment.createdAt).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                          })}
                        </span>
                      </div>
                      {session?.user?.uid === comment.authorId && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          disabled={deletingCommentId === comment.id}
                          className="text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete comment"
                        >
                          {deletingCommentId === comment.id ? (
                            <span className="text-xs">...</span>
                          ) : (
                            <TrashIcon className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </div>
                    <p className="text-base text-gray-700 leading-relaxed whitespace-pre-wrap mb-3">
                      {comment.content}
                    </p>

                    {/* Reply Button */}
                    {status === 'authenticated' && (
                      <button
                        onClick={() => setReplyingToId(replyingToId === comment.id ? null : comment.id)}
                        className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
                      >
                        {replyingToId === comment.id ? 'Cancel' : 'Reply'}
                      </button>
                    )}
                  </div>
                </div>

              </div>

              {/* Reply Form - shown after main comment */}
              {replyingToId === comment.id && status === 'authenticated' && (
                <div className="ml-8 sm:ml-14 mt-4">
                  <form onSubmit={(e) => handleCommentSubmit(e, comment.id)}>
                    <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Write a reply..."
                        className="w-full px-4 py-3 border-0 resize-none focus:ring-0 text-sm text-gray-900 placeholder-gray-400 bg-transparent"
                        rows={3}
                        maxLength={500}
                        disabled={isSubmitting}
                        autoFocus
                      />
                      <div className="px-4 py-2 bg-white flex items-center justify-between border-t border-gray-200">
                        <span className="text-xs text-gray-500">
                          {replyText.length}/500
                        </span>
                        <button
                          type="submit"
                          disabled={isSubmitting || !replyText.trim()}
                          className="px-4 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-md hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all"
                        >
                          {isSubmitting ? 'Posting...' : 'Reply'}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              )}

              {/* Replies - all at same level */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="ml-8 sm:ml-14 mt-4 space-y-4">
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="bg-gray-50 rounded-lg border border-gray-200 p-4 hover:border-gray-300 transition-colors">
                      <div className="flex items-start gap-3">
                        {/* Reply Avatar */}
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                          <span className="text-xs font-semibold text-white uppercase">
                            {reply.author?.displayName?.charAt(0) || reply.author?.name?.charAt(0) || 'A'}
                          </span>
                        </div>

                        {/* Reply Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-3 mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-gray-900">
                                {reply.author?.displayName || reply.author?.name || 'Anonymous'}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(reply.createdAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: new Date(reply.createdAt).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                                })}
                              </span>
                            </div>
                            {session?.user?.uid === reply.authorId && (
                              <button
                                onClick={() => handleDeleteComment(reply.id)}
                                disabled={deletingCommentId === reply.id}
                                className="text-gray-400 hover:text-red-600 transition-colors"
                                title="Delete reply"
                              >
                                {deletingCommentId === reply.id ? (
                                  <span className="text-xs">...</span>
                                ) : (
                                  <TrashIcon className="h-3.5 w-3.5" />
                                )}
                              </button>
                            )}
                          </div>
                          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                            {reply.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        status !== 'loading' && (
          <div className="py-20 text-center bg-gray-50 rounded-xl border border-gray-200">
            <p className="text-base text-gray-400">
              No comments yet. Be the first to share your thoughts!
            </p>
          </div>
        )
      )}
    </div>
  );
} 