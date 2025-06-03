'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';
import { HeartIcon as HeartOutline } from '@heroicons/react/24/outline';
import StatusBadge from '@/components/clothing/StatusBadge';
import SalesProgress from '@/components/clothing/SalesProgress';
import BigSpinner from '@/components/common/BigSpinner';
import CommentSection from '@/components/comments/CommentSection';
import { formatPrice } from '@/lib/utils';
import { loadStripe } from '@stripe/stripe-js';
import { useCart } from '@/lib/CartContext';

export default function ClothingItemPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();
  const [clothingItem, setClothingItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isLiking, setIsLiking] = useState(false);
  const [comments, setComments] = useState([]);
  const [currentAngle, setCurrentAngle] = useState('FRONT');
  const [selectedSize, setSelectedSize] = useState('');
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const { addToCart } = useCart();
  const isAdmin = session?.user?.role === 'ADMIN';

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/comment?clothingItemId=${params.id}`);
      if (!res.ok) throw new Error('Failed to fetch comments');
      const data = await res.json();
      setComments(data.comments || []);
    } catch (e) {
      console.error('Error fetching comments:', e);
    }
  }, [params.id]);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/clothing/${params.id}`);
        if (!res.ok) throw new Error('Failed to fetch clothing item');
        const data = await res.json();
        setClothingItem(data.clothingItem);
        setIsLiked(data.clothingItem.likes?.some(like => like.userId === session?.user?.uid) || false);
        setLikesCount(data.clothingItem.likes?.length || 0);
      } catch (e) {
        console.error('Error fetching clothing item:', e);
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
    fetchComments();
  }, [params.id, session?.user?.uid, fetchComments]);

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

      const res = await fetch(`/api/clothing/${params.id}/like`, {
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
          clothingItemId: params.id,
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
      const res = await fetch(`/api/clothing/${params.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete item');
      
      router.push('/shop');
    } catch (error) {
      console.error('Failed to delete item:', error);
      alert('Failed to delete item. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <BigSpinner />
      </div>
    );
  }

  if (error || !clothingItem) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">Failed to load clothing item.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-normal text-gray-900">{clothingItem.name}</h1>
              <div className="mt-2 flex items-center gap-4">
                <StatusBadge status={clothingItem.status} />
                <Link 
                  href={`/profile/${clothingItem.creator?.id}`}
                  className="text-sm text-gray-700 hover:text-black"
                >
                  by {clothingItem.creator?.displayName || clothingItem.creator?.name || 'Anonymous'}
                </Link>
              </div>
            </div>
            {isAdmin && (
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                Delete Item
              </button>
            )}
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Image Gallery */}
            <div className="relative h-[90vh] overflow-hidden bg-gray-50">
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
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentAngle('FRONT');
                      }}
                      className={`w-3 h-3 rounded-full transition-colors ${
                        currentAngle === 'FRONT' ? 'bg-black' : 'bg-gray-400'
                      } hover:bg-black`}
                      aria-label="View front"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentAngle('BACK');
                      }}
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
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentAngle('FRONT');
                      }}
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
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentAngle('BACK');
                      }}
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
              </div>
            </div>

            {/* Details Section */}
            <div className="p-8 md:p-12 lg:p-16 flex flex-col h-[90vh] sticky top-0">
              <div className="flex-grow space-y-8">
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

                {clothingItem.status === 'AVAILABLE' && (
                  <>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Material</h3>
                      <p className="mt-1 text-lg text-gray-900">{clothingItem.material || 'Not specified'}</p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Price</h3>
                        <p className="mt-1 text-2xl font-semibold text-gray-900">{formatPrice(clothingItem.price)}</p>
                      </div>
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
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setSelectedSize(size);
                            }}
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
            </div>
          </div>

          {/* Comments Section */}
          <div className="mt-16">
            <CommentSection
              itemId={params.id}
              itemType="clothingItem"
              commentsData={comments}
              onCommentPosted={fetchComments}
            />
          </div>
        </div>
      </main>
    </div>
  );
} 