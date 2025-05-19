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
  const [deletingCommentId, setDeletingCommentId] = useState(null); // To show loading state for delete

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) {
      setError('Comment cannot be empty.');
      return;
    }
    if (status !== 'authenticated') {
      setError('You must be logged in to comment.');
      // Optionally, redirect to login: router.push('/login');
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
          content: newComment,
          clothingItemId: itemId, // Ensure this matches backend expectation
          // authorId will be taken from session on the backend
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to post comment');
      }

      setNewComment(''); // Clear input
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
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-800">Comments ({commentsData.length})</h3>
      
      {/* New Comment Form */}
      {status === 'authenticated' && (
        <form onSubmit={handleCommentSubmit} className="space-y-3 p-4 border rounded-lg bg-white shadow-sm">
          <div>
            <label htmlFor="commentText" className="sr-only">Your comment</label>
            <textarea
              id="commentText"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={3}
              placeholder="Write a comment..."
              className="w-full p-2 border rounded-md focus:ring-purple-500 focus:border-purple-500 text-sm text-gray-900 placeholder-gray-600"
              disabled={isSubmitting}
            />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={isSubmitting || !newComment.trim()}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 text-sm font-medium transition-colors"
          >
            {isSubmitting ? 'Submitting...' : 'Post Comment'}
          </button>
        </form>
      )}
      {status === 'unauthenticated' && (
        <p className="text-sm text-gray-600 bg-gray-100 p-3 rounded-md">
          Please <Link href="/login" className="text-purple-600 hover:underline">log in</Link> to post a comment.
        </p>
      )}
       {status === 'loading' && (
        <p className="text-sm text-gray-500">Loading comment form...</p>
      )}


      {/* Existing Comments List */}
      {commentsData.length > 0 ? (
        <ul className="space-y-4">
          {commentsData.map((comment) => (
            <li key={comment.id} className="p-4 border rounded-lg bg-white shadow-sm">
              <div className="flex items-start space-x-3">
                {/* Placeholder for avatar - you can integrate with user.image if available */}
                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs text-white uppercase">
                  {comment.author?.name ? comment.author.name.charAt(0) : 'A'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-800 hover:underline">
                      {comment.author?.name || 'Anonymous'}
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">
                        {new Date(comment.createdAt).toLocaleDateString()} {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}
                      </span>
                      {session?.user?.uid === comment.authorId && (
                        <button 
                          onClick={() => handleDeleteComment(comment.id)}
                          disabled={deletingCommentId === comment.id}
                          className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
                          title="Delete comment"
                        >
                          {deletingCommentId === comment.id ? (
                            'Deleting...'
                          ) : (
                            <TrashIcon className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{comment.content}</p>
                  {/* TODO: Add reply functionality, edit for owner */}
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
         status !== 'loading' && <p className="text-sm text-gray-500">No comments yet. Be the first to comment!</p>
      )}
    </div>
  );
} 