import { AnimatedCard } from './components/AnimatedCard';
import { useState, useEffect } from 'react';
import ClothingItemCard from '@/components/clothing/ClothingItemCard';

export function PublicProfilePage() {
  const [clothingItems, setClothingItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchClothingItems() {
      try {
        const response = await fetch('/api/clothing-items');
        if (!response.ok) {
          throw new Error('Failed to fetch clothing items');
        }
        const data = await response.json();
        setClothingItems(data.clothingItems);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchClothingItems();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10 text-red-500">
        Error: {error}
      </div>
    );
  }

  return (
    <div>
      {clothingItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-8">
          {clothingItems.map((item) => (
            <AnimatedCard key={item.id}>
              <ClothingItemCard clothingItem={item} />
            </AnimatedCard>
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <div>No items found</div>
        </div>
      )}
    </div>
  );
} 