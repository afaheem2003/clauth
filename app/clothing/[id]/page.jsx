'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
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
  const searchParams = new URLSearchParams(window.location.search);
  const fromPage = searchParams.get('from');
  const creatorName = searchParams.get('creator');
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
  const [currentAngle, setCurrentAngle] = useState(ANGLES.FRONT);
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(false);
  const [selectedSize, setSelectedSize] = useState('');

  // Add available sizes - we can make this dynamic later from the database
  const availableSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  const getBreadcrumbLabel = () => {
    if (fromPage === 'creators') return 'Creators';
    if (fromPage === 'profile') return creatorName || 'Creator Profile';
    if (fromPage === 'wardrobes') return 'Wardrobes';
    if (fromPage === 'my-likes') return 'My Likes';
    return 'Discover';
  };

  const getBreadcrumbPath = () => {
    if (fromPage === 'creators') return '/creators';
    if (fromPage === 'profile') return creatorName ? `/profile/${creatorName}` : '/profile';
    if (fromPage === 'wardrobes') return '/wardrobes';
    if (fromPage === 'my-likes') return '/my-likes';
    return '/discover';
  };

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
    if (!selectedSize) {
      alert('Please select a size before proceeding');
      return;
    }

    setCheckoutLoading(true);
    setError(null);

    const userEmail = session?.user?.email || null;

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clothingItemId: clothingItem.id,
          imageUrl: clothingItem.frontImage || clothingItem.imageUrl,
          quantity: 1,
          size: selectedSize,
          returnTo: `/clothing/${clothingItem.id}`,
          guestEmail: userEmail,
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

  // Update the currentImageUrl logic to handle fallbacks properly
  const getCurrentImage = () => {
    if (currentAngle === ANGLES.FRONT) {
      return frontImage || imageUrl;
    }
    return backImage || imageUrl;
  };

  // Remove the old currentImageUrl declaration and use the function
  const currentImageUrl = getCurrentImage();

  return (
    <div className="min-h-screen bg-white">
      {/* Main Content */}
      <div className="max-w-screen-2xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left: Image Gallery */}
        <div className="relative h-[90vh] overflow-hidden bg-gray-50">
          <div 
            className="w-full h-full relative group"
            onClick={() => openImageModal()}
          >
            {/* Main Image */}
            <img 
              src={currentImageUrl}
              alt={`${name} - ${currentAngle} view`}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />

            {/* Image Navigation Dots - Only show if we have both front and back images */}
            {(frontImage || imageUrl) && backImage && (
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentAngle(ANGLES.FRONT);
                  }}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    currentAngle === ANGLES.FRONT ? 'bg-black' : 'bg-gray-400'
                  } hover:bg-black`}
                  aria-label="View front"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentAngle(ANGLES.BACK);
                  }}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    currentAngle === ANGLES.BACK ? 'bg-black' : 'bg-gray-400'
                  } hover:bg-black`}
                  aria-label="View back"
                />
              </div>
            )}

            {/* Add image switch buttons on the sides for easier switching */}
            {(frontImage || imageUrl) && backImage && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentAngle(ANGLES.FRONT);
                  }}
                  className={`absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 p-2 rounded-full shadow-lg transition-opacity ${
                    currentAngle === ANGLES.FRONT ? 'opacity-0' : 'opacity-100'
                  } hover:bg-white`}
                  aria-label="Previous image"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentAngle(ANGLES.BACK);
                  }}
                  className={`absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 p-2 rounded-full shadow-lg transition-opacity ${
                    currentAngle === ANGLES.BACK ? 'opacity-0' : 'opacity-100'
                  } hover:bg-white`}
                  aria-label="Next image"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Right: Product Details */}
        <div className="p-8 md:p-12 lg:p-16 flex flex-col h-[90vh] sticky top-0">
          <div className="flex-grow">
            {/* Breadcrumb */}
            <nav className="text-sm mb-8">
              <Link 
                href={getBreadcrumbPath()}
                className="text-gray-600 hover:text-black"
              >
                {getBreadcrumbLabel()}
              </Link>
              <span className="mx-2 text-gray-400">/</span>
              <span className="text-gray-900">{name}</span>
            </nav>

            {/* Title and Price */}
            <h1 className="text-2xl font-normal text-gray-900 mb-4">{name}</h1>
            {price && (
              <p className="text-xl text-gray-900 mb-8">${Number(price).toFixed(2)}</p>
            )}

            {/* Creator Link */}
            <Link 
              href={`/profile/${creator?.displayName || creator?.id}`} 
              className="text-sm text-gray-700 hover:text-black mb-8 inline-block"
            >
              By {creator?.displayName || creator?.name || 'Anonymous Creator'}
            </Link>

            {/* Color and Size */}
            <div className="space-y-6 mb-8">
              {size && (
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    SIZE
                  </label>
                  <div className="text-sm text-gray-700 uppercase">{size}</div>
                </div>
              )}
            </div>

            {/* Size Selector */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-900 mb-2">
                SIZE
              </label>
              <div className="grid grid-cols-3 gap-2">
                {availableSizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                      selectedSize === size
                        ? 'bg-black text-white'
                        : 'bg-gray-50 text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            {cleanDescription && (
              <div className="mb-8">
                <button 
                  className="flex items-center justify-between w-full py-4 text-left border-t border-b border-gray-200"
                  onClick={() => setIsDescriptionOpen(!isDescriptionOpen)}
                >
                  <span className="text-sm font-medium text-gray-900">DESCRIPTION</span>
                  <svg 
                    className={`w-4 h-4 transition-transform ${isDescriptionOpen ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isDescriptionOpen && (
                  <div className="py-4 text-sm text-gray-700 leading-relaxed">
                    {cleanDescription}
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="space-y-4">
              {canPreorder && (
                <button
                  onClick={handlePreorder}
                  disabled={checkoutLoading || !session?.user || !selectedSize}
                  className={`w-full py-4 text-sm font-medium transition-colors ${
                    !selectedSize
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-black text-white hover:bg-gray-900'
                  }`}
                >
                  {checkoutLoading ? 'Processing...' : !selectedSize ? 'SELECT SIZE' : 'PREORDER NOW'}
                </button>
              )}

              <button
                onClick={handleLike}
                disabled={status === 'unauthenticated'}
                className="flex items-center justify-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 border border-gray-300 rounded-full transition-colors"
              >
                {hasLiked ? (
                  <HeartIconSolid className="w-5 h-5 text-red-500" />
                ) : (
                  <HeartIconOutline className="w-5 h-5" />
                )}
                <span>{likes} {likes === 1 ? 'Like' : 'Likes'}</span>
              </button>

              {/* Add to Wardrobe Button */}
              {session?.user && (
                <button
                  onClick={() => router.push(`/wardrobes?addItem=${clothingItemId}`)}
                  className="flex items-center justify-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 border border-gray-300 rounded-full transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Add to Wardrobe
                </button>
              )}

              {canDelete && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center justify-center gap-2 px-4 py-2 text-red-600 hover:text-red-700 border border-red-300 rounded-full transition-colors"
                >
                  <TrashIcon className="w-5 h-5" />
                  Delete Item
                </button>
              )}
            </div>
          </div>

          {/* Countdown Status */}
          {isPublished && goal > 0 && (
            <div className="mt-8 pt-8 border-t border-gray-200">
              <CountdownGoalStatus
                expiresAt={clothingItem.expiresAt}
                goal={clothingItem.goal}
                pledged={clothingItem.pledged}
                status={clothingItem.status}
              />
            </div>
          )}
        </div>
      </div>

      {/* Comments Section */}
      <div className="max-w-screen-xl mx-auto px-4 py-16">
        <CommentSection 
          itemId={clothingItemId} 
          itemType="clothingItem"
          commentsData={comments} 
          onCommentPosted={fetchComments}
        />
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-sm w-full">
            <h3 className="text-xl font-normal mb-4">Delete Item</h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete "{name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-black"
              >
                Cancel
              </button>
              <button 
                onClick={handleDelete}
                disabled={loading}
                className="px-4 py-2 text-sm bg-red-500 text-white hover:bg-red-600 disabled:bg-gray-300"
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {isImageModalOpen && (
        <ImageModal
          images={{ 
            [ANGLES.FRONT]: frontImage, 
            [ANGLES.BACK]: backImage
          }}
          initialIndex={modalImageIndex}
          onClose={closeImageModal}
        />
      )}
    </div>
  );
}
