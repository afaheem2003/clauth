import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import Image from 'next/image';
import { formatRelativeTime } from '@/lib/utils';

export const dynamic = 'force-dynamic';

async function getClothingItemsByStatus() {
  // Get items grouped by their status in the pipeline
  const [conceptItems, selectedItems, availableItems] = await Promise.all([
    // Get CONCEPT items (designs that can be selected for production)
    prisma.clothingItem.findMany({
      where: { status: 'CONCEPT' },
      include: {
        creator: true,
        likes: true,
      },
      orderBy: [
        { likes: { _count: 'desc' }},
        { createdAt: 'desc' }
      ],
    }),

    // Get SELECTED items (approved for production, waiting for drop)
    prisma.clothingItem.findMany({
      where: { status: 'SELECTED' },
      include: {
        creator: true,
      },
      orderBy: { dropDate: 'asc' },
    }),

    // Get AVAILABLE items (currently purchasable)
    prisma.clothingItem.findMany({
      where: { status: 'AVAILABLE' },
      include: {
        creator: true,
      },
      orderBy: { soldQuantity: 'desc' },
    }),
  ]);

  return {
    conceptItems,
    selectedItems,
    availableItems,
  };
}

export default async function ProductionPage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'ADMIN') {
    return <p className="p-6">Access Denied. You must be an admin to view this page.</p>;
  }

  const { conceptItems, selectedItems, availableItems } = await getClothingItemsByStatus();

  return (
    <div className="max-w-7xl mx-auto space-y-12">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold text-gray-900">Production Pipeline</h1>
      </div>

      {/* Designs Ready for Selection */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-xl font-semibold text-gray-900">Designs Ready for Selection</h2>
          <p className="text-sm text-gray-600 mt-1">Choose designs to prepare for the next drop</p>
        </div>
        <div className="divide-y divide-gray-200">
          {conceptItems.map((item) => (
            <div key={item.id} className="flex items-center px-6 py-4 hover:bg-gray-50 transition-colors">
              <div className="w-16 h-16 relative rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                {item.imageUrl && (
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                )}
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-lg font-medium text-gray-900">
                  <Link href={`/clothing/${item.id}`} className="hover:text-indigo-600">
                    {item.name}
                  </Link>
                </h3>
                <p className="text-sm text-gray-600">By {item.creator.displayName || 'Anonymous'}</p>
              </div>
              <div className="flex items-center gap-8">
                <div className="text-center">
                  <p className="text-2xl font-semibold text-gray-900">{item.likes.length}</p>
                  <p className="text-sm text-gray-600">Likes</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-900">{formatRelativeTime(item.createdAt)}</p>
                  <p className="text-sm text-gray-600">Created</p>
                </div>
                <Link
                  href={`/admin/production/${item.id}/select`}
                  className="ml-8 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Select for Drop
                </Link>
              </div>
            </div>
          ))}
          {conceptItems.length === 0 && (
            <p className="px-6 py-8 text-center text-gray-500">No designs ready for selection</p>
          )}
        </div>
      </section>

      {/* Selected for Production */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-xl font-semibold text-gray-900">Selected for Next Drop</h2>
          <p className="text-sm text-gray-600 mt-1">Items ready to be released to the shop</p>
        </div>
        <div className="divide-y divide-gray-200">
          {selectedItems.map((item) => (
            <div key={item.id} className="flex items-center px-6 py-4 hover:bg-gray-50 transition-colors">
              <div className="w-16 h-16 relative rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                {item.imageUrl && (
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                )}
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-lg font-medium text-gray-900">
                  <Link href={`/clothing/${item.id}`} className="hover:text-indigo-600">
                    {item.name}
                  </Link>
                </h3>
                <p className="text-sm text-gray-600">By {item.creator.displayName || 'Anonymous'}</p>
              </div>
              <div className="flex items-center gap-8">
                <div className="text-center">
                  <p className="text-sm text-gray-900">{item.dropDate ? formatRelativeTime(item.dropDate) : 'Not set'}</p>
                  <p className="text-sm text-gray-600">Drop Date</p>
                </div>
                <Link
                  href={`/admin/production/${item.id}/release`}
                  className="ml-8 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Set Price & Release
                </Link>
              </div>
            </div>
          ))}
          {selectedItems.length === 0 && (
            <p className="px-6 py-8 text-center text-gray-500">No items selected for production</p>
          )}
        </div>
      </section>

      {/* Currently Available */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-xl font-semibold text-gray-900">Currently Available</h2>
          <p className="text-sm text-gray-600 mt-1">Items currently available in the shop</p>
        </div>
        <div className="divide-y divide-gray-200">
          {availableItems.map((item) => (
            <div key={item.id} className="flex items-center px-6 py-4 hover:bg-gray-50 transition-colors">
              <div className="w-16 h-16 relative rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                {item.imageUrl && (
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                )}
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-lg font-medium text-gray-900">
                  <Link href={`/clothing/${item.id}`} className="hover:text-indigo-600">
                    {item.name}
                  </Link>
                </h3>
                <p className="text-sm text-gray-600">By {item.creator.displayName || 'Anonymous'}</p>
              </div>
              <div className="flex items-center gap-8">
                <div className="text-center">
                  <p className="text-2xl font-semibold text-gray-900">{item.soldQuantity}</p>
                  <p className="text-sm text-gray-600">Sold</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-semibold text-gray-900">{item.totalQuantity}</p>
                  <p className="text-sm text-gray-600">Total</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-semibold text-green-600">${item.price}</p>
                  <p className="text-sm text-gray-600">Price</p>
                </div>
              </div>
            </div>
          ))}
          {availableItems.length === 0 && (
            <p className="px-6 py-8 text-center text-gray-500">No items currently available</p>
          )}
        </div>
      </section>
    </div>
  );
}
