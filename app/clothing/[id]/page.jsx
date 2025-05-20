'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import sanitizeHtml from 'sanitize-html';
// import ClothingSuggestions from '@/components/clothing/ClothingSuggestions'; // Assuming this component will be or is refactored
import CommentSection from '@/components/comments/CommentSection';
import Button from '@/components/common/Button';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { HeartIcon as HeartIconOutline, ArrowUturnLeftIcon, TrashIcon, PencilIcon, XMarkIcon } from '@heroicons/react/24/outline';
import NotFound from '@/app/not-found'; // Assuming a generic not-found page
import BigSpinner from '@/components/common/BigSpinner';
import CountdownGoalStatus from '@/components/clothing/CountdownGoalStatus';
import ImageGallery from '@/components/clothing/ImageGallery';
import ImageModal from '@/app/components/clothing/ImageModal';
import { ANGLES } from '@/utils/imageProcessing';
import { loadStripe } from '@stripe/stripe-js'; // Import loadStripe

// Initialize Stripe.js with your publishable key outside of the component render cycle
// It's a good practice to use an environment variable for your Stripe publishable key
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function ClothingItemDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { id: clothingItemId } = params;
  const { data: session, status } = useSession();

  const [clothingItem, setClothingItem] = useState(null);
  const [likes, setLikes] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(0);

  const fetchClothingItemDetails = useCallback(async () => {
    if (!clothingItemId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/clothing/${clothingItemId}`, {
        cache: 'no-store'
      });
      if (res.status === 404) {
        setClothingItem(null); // Mark as not found
        setError('Clothing item not found.'); 
        return;
      }
      if (!res.ok) {
        throw new Error('Failed to fetch clothing item details');
      }
      const data = await res.json();
      setClothingItem(data.clothingItem);
      setLikes(data.clothingItem.likes?.length || 0);
      setHasLiked(data.clothingItem.likes?.some(l => l.userId === session?.user?.uid) || false);
      // Comments are fetched separately or included if API supports
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [clothingItemId, session?.user?.uid]);

  const fetchComments = useCallback(async () => {
    if (!clothingItemId) return;
    try {
      const res = await fetch(`/api/comment?clothingItemId=${clothingItemId}`);
      if (!res.ok) throw new Error('Failed to fetch comments');
      const data = await res.json();
      setComments(data.comments || []);
    } catch (err) {
      console.error('Error fetching comments:', err);
    }
  }, [clothingItemId]);

  useEffect(() => {
    fetchClothingItemDetails();
    fetchComments();
  }, [fetchClothingItemDetails, fetchComments]);

  const handleLike = async () => {
    if (status !== 'authenticated') {
      router.push('/login');
      return;
    }
    if (!clothingItem) return;

    const newHasLiked = !hasLiked;
    setHasLiked(newHasLiked);
    setLikes(prev => newHasLiked ? prev + 1 : prev - 1);

    try {
      const res = await fetch(`/api/clothing/${clothingItemId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: session.user.uid }), // Optional: send userId if backend needs it explicitly
      });
      if (!res.ok) {
        // Revert optimistic update on error
        setHasLiked(!newHasLiked);
        setLikes(prev => !newHasLiked ? prev + 1 : prev - 1);
        console.error('Failed to update like status');
      }
    } catch (err) {
      // Revert optimistic update on error
      setHasLiked(!newHasLiked);
      setLikes(prev => !newHasLiked ? prev + 1 : prev - 1);
      console.error('Error liking item:', err);
    }
  };

  const handlePreorder = async () => {
    if (!clothingItem) return;

    setCheckoutLoading(true);
    setError(null); // Clear previous errors

    // For guest checkouts, you might want to collect email on this page
    // or rely on Stripe to do it. For now, we'll pass null or an empty string.
    // If session exists and you want to prefill email for logged-in users:
    const userEmail = session?.user?.email || null;

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clothingItemId: clothingItem.id,
          imageUrl: clothingItem.frontImage || clothingItem.imageUrl, // Send an appropriate image
          quantity: 1, // Or allow quantity selection
          returnTo: `/clothing/${clothingItem.id}`, // Return to the current page
          guestEmail: userEmail, // Pass user's email if logged in, or null/undefined for guest
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Could not initiate checkout. Please try again.');
      }

      const { sessionId } = await response.json();
      if (!sessionId) {
        throw new Error('Checkout session ID not found.');
      }

      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe.js failed to load.');
      }

      const { error: stripeError } = await stripe.redirectToCheckout({ sessionId });

      if (stripeError) {
        console.error("Stripe redirectToCheckout error:", stripeError);
        setError(stripeError.message || 'Failed to redirect to Stripe. Please try again.');
      }
    } catch (err) {
      console.error("Preorder error:", err);
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setCheckoutLoading(false);
    }
  };
  
  const handleDelete = async () => {
    if (status !== 'authenticated' || session.user.uid !== clothingItem?.creatorId) {
      alert("You don't have permission to delete this item.");
      return;
    }
    setShowDeleteConfirm(false);
    setLoading(true);
    try {
        const res = await fetch(`/api/clothing/${clothingItemId}`, {
            method: 'DELETE'
        });
        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || 'Failed to delete clothing item');
        }
        alert('Clothing item deleted successfully.');
        router.push('/profile'); // Redirect to profile or discover page
    } catch (err) {
        console.error("Delete error:", err);
        setError(err.message || "Could not delete item.");
        setLoading(false);
    }
  };

  if (loading && !clothingItem) return <div className="flex justify-center items-center min-h-screen"><BigSpinner /></div>;
  if (error && !clothingItem) {
    if (error.includes('not found') || error.includes('404')) {
      return <NotFound />;
    }
    return <div className="text-center py-10 text-red-500">Error: {error}</div>;
  }
  if (!clothingItem) return <NotFound />;

  const { 
    name, 
    imageUrl,
    frontImage,
    rightImage,
    leftImage,
    backImage,
    description, 
    itemType, 
    texture, 
    size, 
    color, 
    creator, 
    goal, 
    pledged, 
    isPublished, 
    price,
    estimatedShipDate 
  } = clothingItem;
  
  const isOwner = session?.user?.uid === creator?.id;
  const isAdmin = session?.user?.role === 'ADMIN';
  const canDelete = isOwner || isAdmin;
  const canPreorder = isPublished && (!goal || pledged < goal);
  const cleanDescription = sanitizeHtml(description || '', { allowedTags: [], allowedAttributes: {} });

  const openImageModal = (index = 0) => {
    setModalImageIndex(index);
    setIsImageModalOpen(true);
  };
  const closeImageModal = () => setIsImageModalOpen(false);

  return (
    <div className="bg-gray-50 min-h-screen py-8 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white shadow-xl rounded-lg overflow-hidden md:flex">
          {/* Image Gallery Section */} 
          <div className="md:w-1/2">
            <ImageGallery 
              images={{ 
                imageUrl: imageUrl, // Keep for legacy fallback in ImageGallery
                [ANGLES.FRONT]: frontImage, 
                [ANGLES.BACK]: backImage, 
                // You could also add rightImage and leftImage here if the gallery supported them
                // e.g., right: rightImage, left: leftImage 
              }}
              onImageClick={openImageModal}
            />
          </div>

          {/* Details Section */} 
          <div className="md:w-1/2 p-6 md:p-8 flex flex-col justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">{name}</h1>
              {price && <p className="text-2xl text-purple-600 font-semibold mb-3">${Number(price).toFixed(2)}</p>}
              <Link href={`/profile/${creator?.displayName || creator?.id}`} className="text-lg text-purple-500 hover:text-purple-700 mb-4 block">
                By {creator?.displayName || creator?.name || 'Anonymous Creator'}
              </Link>

              {/* Countdown Status */}
              {isPublished && (
                <div className="mb-6">
                  <CountdownGoalStatus
                    expiresAt={clothingItem.expiresAt}
                    goal={clothingItem.goal}
                    pledged={clothingItem.pledged}
                    status={clothingItem.status}
                  />
                </div>
              )}

              {cleanDescription && <p className="text-gray-600 mb-4 whitespace-pre-wrap">{cleanDescription}</p>}
              
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-gray-700 mb-4">
                {itemType && <p><strong>Type:</strong> {itemType}</p>}
                {texture && <p><strong>Texture:</strong> {texture}</p>}
                {size && <p><strong>Size:</strong> {size}</p>}
                {color && <p><strong>Color:</strong> {color}</p>}
                {estimatedShipDate && (
                  <p className="col-span-2">
                    <strong>Estimated Shipping:</strong> {new Date(estimatedShipDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
            
            {/* Actions & Preorder */} 
            <div className="mt-auto">
              <div className="flex items-center space-x-3 mb-4">
                <button onClick={handleLike} className={`p-2 rounded-full transition-colors ${hasLiked ? 'text-red-500 bg-red-100' : 'text-gray-500 hover:bg-gray-100'}`} disabled={status === 'unauthenticated' && loading}>
                  {hasLiked ? <HeartIconSolid className="h-6 w-6" /> : <HeartIconOutline className="h-6 w-6" />}
                </button>
                <span className="text-gray-600">{likes} Likes</span>
              </div>

              {canPreorder && (
                <Button onClick={handlePreorder} fullWidth primary disabled={loading || checkoutLoading}>
                  {checkoutLoading ? 'Processing...' : 'Preorder Now'}
                </Button>
              )}
              {!isPublished && isOwner && (
                <p className="text-sm text-center text-yellow-600 bg-yellow-50 p-2 rounded mb-2">This is a saved draft. Publish it from your profile.</p>
              )}
              {!canPreorder && isPublished && goal > 0 && pledged >= goal && (
                  <p className="text-sm text-center text-green-600 bg-green-50 p-2 rounded mb-2">This item has been fully funded! Production will begin soon.</p>
              )}

              {canDelete && (
                <div className="mt-4 pt-4 border-t">
                  <button 
                    onClick={() => setShowDeleteConfirm(true)} 
                    className="w-full flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                    disabled={loading}
                  >
                    <TrashIcon className="h-5 w-5 mr-2"/> Delete Item
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */} 
        {showDeleteConfirm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
                    <h3 className="text-lg font-semibold mb-2">Confirm Deletion</h3>
                    <p className="text-sm text-gray-600 mb-4">Are you sure you want to delete "{name}"? This action cannot be undone.</p>
                    <div className="flex justify-end space-x-2">
                        <Button onClick={() => setShowDeleteConfirm(false)} secondary>Cancel</Button>
                        <Button onClick={handleDelete} danger loading={loading}>Delete Item</Button>
                    </div>
                </div>
            </div>
        )}

        {/* Image Modal */}
        {isImageModalOpen && (
          <ImageModal
            images={{ 
              imageUrl: imageUrl, // For legacy fallback in ImageModal
              [ANGLES.FRONT]: frontImage, 
              [ANGLES.BACK]: backImage, 
              // Pass other angles if ImageModal is ever designed to use them
              // right: rightImage,
              // left: leftImage
            }}
            initialIndex={modalImageIndex}
            onClose={closeImageModal}
          />
        )}

        {/* Comments Section */} 
        <div className="mt-8">
          <CommentSection 
            itemId={clothingItemId} 
            itemType="clothingItem"
            commentsData={comments} 
            onCommentPosted={fetchComments}
          /> 
        </div>

        {/* Suggested Items */} 
        <div className="mt-12">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">You Might Also Like</h2>
          {/* <ClothingSuggestions currentItemId={clothingItemId} /> */}
        </div>
      </div>
    </div>
  );
}
