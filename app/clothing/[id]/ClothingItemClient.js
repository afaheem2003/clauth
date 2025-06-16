'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';
import { HeartIcon as HeartOutline } from '@heroicons/react/24/outline';
import StatusBadge from '@/components/clothing/StatusBadge';
import SalesProgress from '@/components/clothing/SalesProgress';
import CommentSection from '@/components/comments/CommentSection';
import { formatPrice } from '@/lib/utils';
import { loadStripe } from '@stripe/stripe-js';
import { useCart } from '@/lib/CartContext';

export default function ClothingItemClient({ clothingItem, initialComments, session }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLiked, setIsLiked] = useState(clothingItem.likes?.some(like => like.userId === session?.user?.uid) || false);
  const [likesCount, setLikesCount] = useState(clothingItem.likes?.length || 0);
  const [isLiking, setIsLiking] = useState(false);
  const [comments, setComments] = useState(initialComments);
  const [currentAngle, setCurrentAngle] = useState('FRONT');
  const [selectedSize, setSelectedSize] = useState('');
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const { addToCart } = useCart();
  const isAdmin = session?.user?.role === 'ADMIN';
  const isCreator = session?.user?.uid === clothingItem.creator?.id;

  // Challenge submission state
  const [challengeEligibility, setChallengeEligibility] = useState(null);
  const [isCheckingEligibility, setIsCheckingEligibility] = useState(false);
  const [isSubmittingToChallenge, setIsSubmittingToChallenge] = useState(false);

  // Check challenge eligibility when component mounts (only for creators)
  useEffect(() => {
    if (session?.user && isCreator) {
      checkChallengeEligibility();
    }
  }, [session, isCreator]);

  const checkChallengeEligibility = async () => {
    setIsCheckingEligibility(true);
    try {
      const response = await fetch(`/api/challenges/check-eligibility?clothingItemId=${clothingItem.id}`);
      const data = await response.json();
      setChallengeEligibility(data);
    } catch (error) {
      console.error('Error checking challenge eligibility:', error);
    } finally {
      setIsCheckingEligibility(false);
    }
  };

  const handleSubmitToChallenge = async () => {
    if (!challengeEligibility?.challenge) return;
    
    setIsSubmittingToChallenge(true);
    try {
      const response = await fetch('/api/challenges/submit-existing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          challengeId: challengeEligibility.challenge.id,
          clothingItemId: clothingItem.id
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Refresh eligibility to show updated state
        await checkChallengeEligibility();
        // Show success message or redirect
        alert('Successfully submitted to challenge! You can now vote on other submissions to become eligible for rankings.');
        router.push('/challenges');
      } else {
        alert(data.error || 'Failed to submit to challenge');
      }
    } catch (error) {
      console.error('Error submitting to challenge:', error);
      alert('Failed to submit to challenge. Please try again.');
    } finally {
      setIsSubmittingToChallenge(false);
    }
  };

  const handleLikeToggle = async () => {
    if (!session?.user) {
      router.push('/login');
      return;
    }

    if (isLiking) return;

    try {
      setIsLiking(true);
      
      // Optimistically update UI
      setIsLiked(prevLiked => !prevLiked);
      setLikesCount(prevCount => prevCount + (isLiked ? -1 : 1));

      const res = await fetch(`/api/clothing/${clothingItem.id}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        // Revert optimistic update on error
        setIsLiked(prevLiked => !prevLiked);
        setLikesCount(prevCount => prevCount + (isLiked ? 1 : -1));
        throw new Error('Failed to toggle like');
      }
    } catch (e) {
      console.error('Error toggling like:', e);
    } finally {
      setIsLiking(false);
    }
  };

  const handleAddToCart = async () => {
    if (!selectedSize) return;
    setIsAddingToCart(true);
    
    try {
      addToCart({
        id: clothingItem.id,
        name: clothingItem.name,
        imageUrl: clothingItem.imageUrl,
        price: clothingItem.price,
        size: selectedSize,
        quantity: 1
      });
    } catch (error) {
      console.error('Failed to add to cart:', error);
      alert('Failed to add to cart');
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!selectedSize) return;
    
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clothingItemId: clothingItem.id,
          imageUrl: clothingItem.imageUrl,
          quantity: 1,
          size: selectedSize,
        }),
      });

      const { sessionId } = await response.json();
      
      const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
      await stripe.redirectToCheckout({ sessionId });
    } catch (error) {
      console.error('Failed to initiate checkout:', error);
      alert('Failed to initiate checkout');
    }
  };

  const handleDelete = async () => {
    if (!isAdmin) return;
    
    if (!window.confirm('Are you sure you want to delete this item?')) return;

    try {
      const res = await fetch(`/api/clothing/${clothingItem.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete item');
      
      router.push('/shop');
    } catch (error) {
      console.error('Failed to delete item:', error);
      alert('Failed to delete item. Please try again.');
    }
  };

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/comment?clothingItemId=${clothingItem.id}`);
      if (!res.ok) throw new Error('Failed to fetch comments');
      const data = await res.json();
      setComments(data.comments || []);
    } catch (e) {
      console.error('Error fetching comments:', e);
    }
  };

  // Return to previous page or default route
  const handleBack = () => {
    const from = searchParams.get('from');
    if (from) {
      router.push(`/${from}`);
    } else if (typeof window !== 'undefined' && window.history.length > 2) {
      router.back();
    } else {
      router.push('/discover');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Back Button */}
          <button
            onClick={handleBack}
            className="mb-4 text-gray-600 hover:text-gray-900 flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L4.414 9H17a1 1 0 110 2H4.414l5.293 5.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back
          </button>

          {/* Header Section */}
          <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-normal text-gray-900">{clothingItem.name}</h1>
              <div className="mt-2 flex items-center gap-4">
                <StatusBadge status={clothingItem.status} />
                <Link 
                  href={`/profile/${clothingItem.creator?.displayName}`}
                  className="text-sm text-gray-700 hover:text-black"
                >
                  by {clothingItem.creator?.displayName || clothingItem.creator?.name || 'Anonymous'}
                </Link>
              </div>
            </div>
            {(isAdmin || isCreator) && (
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                Delete Item
              </button>
            )}
          </div>

          {/* Challenge Submission Banner */}
          {isCreator && challengeEligibility && (
            <div className="mb-8">
              {challengeEligibility.canSubmit ? (
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Submit to Today's Challenge!</h3>
                      <p className="text-sm opacity-90 mb-1">
                        <strong>{challengeEligibility.challenge.theme}</strong>
                        {challengeEligibility.challenge.mainItem && (
                          <span> • Focus: {challengeEligibility.challenge.mainItem}</span>
                        )}
                      </p>
                      <p className="text-xs opacity-75">
                        Deadline: {new Date(challengeEligibility.challenge.submissionDeadline).toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={handleSubmitToChallenge}
                      disabled={isSubmittingToChallenge}
                      className="bg-white text-indigo-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmittingToChallenge ? 'Submitting...' : 'Submit to Challenge'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-100 rounded-xl p-6">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 mb-1">Cannot Submit to Challenge</h3>
                      <p className="text-sm text-gray-600 break-words">{challengeEligibility.reason}</p>
                      {challengeEligibility.usedInChallenge && (
                        <p className="text-xs text-gray-500 mt-2 break-words">
                          Previously used in: {challengeEligibility.usedInChallenge.theme}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Main Content */}
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Column - Image */}
            <div className="lg:flex-1 lg:max-w-[50%]">
              <div className="relative aspect-[683/1024] overflow-hidden bg-gray-50 rounded-lg shadow-md">
                <div className="w-full h-full relative group">
                  <Image
                    src={currentAngle === 'FRONT' ? 
                      (clothingItem.frontImage || clothingItem.imageUrl || '/images/clothing-placeholder.png') : 
                      (clothingItem.backImage || clothingItem.imageUrl || '/images/clothing-placeholder.png')}
                    alt={`${clothingItem.name} - ${currentAngle.toLowerCase()} view`}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    unoptimized
                  />

                  {/* Image Navigation Dots */}
                  {(clothingItem.frontImage || clothingItem.imageUrl) && clothingItem.backImage && (
                    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-4">
                      <button
                        onClick={() => setCurrentAngle('FRONT')}
                        className={`w-3 h-3 rounded-full transition-colors ${
                          currentAngle === 'FRONT' ? 'bg-black' : 'bg-gray-400'
                        } hover:bg-black`}
                        aria-label="View front"
                      />
                      <button
                        onClick={() => setCurrentAngle('BACK')}
                        className={`w-3 h-3 rounded-full transition-colors ${
                          currentAngle === 'BACK' ? 'bg-black' : 'bg-gray-400'
                        } hover:bg-black`}
                        aria-label="View back"
                      />
                    </div>
                  )}

                  {/* Side Navigation Buttons */}
                  {(clothingItem.frontImage || clothingItem.imageUrl) && clothingItem.backImage && (
                    <>
                      <button
                        onClick={() => setCurrentAngle('FRONT')}
                        className={`absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 p-2 rounded-full shadow-lg transition-opacity ${
                          currentAngle === 'FRONT' ? 'opacity-0' : 'opacity-100'
                        } hover:bg-white`}
                        aria-label="Previous image"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setCurrentAngle('BACK')}
                        className={`absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 p-2 rounded-full shadow-lg transition-opacity ${
                          currentAngle === 'BACK' ? 'opacity-0' : 'opacity-100'
                        } hover:bg-white`}
                        aria-label="Next image"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </>
                  )}

                  {/* Admin-only Quality Tag */}
                  {isAdmin && clothingItem.quality && (
                    <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg">
                      Quality: {clothingItem.quality.charAt(0).toUpperCase() + clothingItem.quality.slice(1)}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Details and Comments */}
            <div className="lg:flex-1 flex flex-col min-h-[90vh]">
              {/* Details Section */}
              <div className="bg-white p-8 space-y-8">
                {/* Type */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Type</h3>
                  <p className="mt-1 text-lg text-gray-900">{clothingItem.itemType}</p>
                </div>

                {/* Description - Collapsible */}
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
                      {clothingItem.description || 'No description available.'}
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Color</h3>
                  <p className="mt-1 text-lg text-gray-900">{clothingItem.color}</p>
                </div>

                {/* Like Button */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleLikeToggle}
                    disabled={isLiking}
                    className="flex items-center gap-2 px-6 py-3 rounded-full bg-white shadow-sm hover:shadow-md transition-all border border-gray-200"
                  >
                    {isLiked ? (
                      <HeartSolid className="w-6 h-6 text-pink-500" />
                    ) : (
                      <HeartOutline className="w-6 h-6 text-gray-400" />
                    )}
                    <span className="text-sm font-medium text-gray-600">
                      {likesCount}
                    </span>
                  </button>
                </div>

                {clothingItem.status === 'AVAILABLE' && (
                  <>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Material</h3>
                      <p className="mt-1 text-lg text-gray-900">{clothingItem.material || 'Not specified'}</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Price</h3>
                      <p className="mt-1 text-2xl font-semibold text-gray-900">{formatPrice(clothingItem.price)}</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Sales Progress</h3>
                      <div className="mt-2">
                        <SalesProgress
                          sold={clothingItem.sold || 0}
                          total={clothingItem.goal || 100}
                          status={clothingItem.status}
                        />
                      </div>
                    </div>

                    {/* Size Selection */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-2">SIZE</h3>
                      <div className="grid grid-cols-4 gap-2">
                        {['S', 'M', 'L', 'XL'].map(size => (
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

                    {/* Action Buttons */}
                    <div className="flex gap-4">
                      <button 
                        onClick={handleAddToCart}
                        disabled={!selectedSize || isAddingToCart}
                        className={`flex-1 py-4 text-sm font-medium transition-colors ${
                          !selectedSize
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            : 'bg-white text-black border-2 border-black hover:bg-gray-50'
                        }`}
                      >
                        {!selectedSize ? 'SELECT SIZE' : isAddingToCart ? 'ADDING...' : 'ADD TO CART'}
                      </button>
                      <button 
                        onClick={handleBuyNow}
                        disabled={!selectedSize}
                        className={`flex-1 py-4 text-sm font-medium transition-colors ${
                          !selectedSize
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            : 'bg-black text-white hover:bg-gray-900'
                        }`}
                      >
                        BUY NOW
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Comments Section */}
              {(clothingItem.status === 'CONCEPT' || clothingItem.status === 'SELECTED') && (
                <div className="flex-1 bg-gray-50 p-8 rounded-lg">
                  <CommentSection
                    itemId={clothingItem.id}
                    itemType="clothingItem"
                    commentsData={comments}
                    onCommentPosted={fetchComments}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Comments Section for AVAILABLE items */}
          {clothingItem.status === 'AVAILABLE' && (
            <div className="mt-16">
              <CommentSection
                itemId={clothingItem.id}
                itemType="clothingItem"
                commentsData={comments}
                onCommentPosted={fetchComments}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 