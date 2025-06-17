'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';

export default function HomeClient({ trendingCreations = [] }) {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-white">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <section className="mb-16">
          <div className="text-left mb-12">
            <h1 className="text-6xl md:text-8xl font-extralight text-black mb-6 tracking-tight leading-none">
              Trending Now
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl font-light leading-relaxed">
              Discover the most loved AI-generated fashion designs from our community. From elegant evening wear to casual streetwear, explore what's capturing attention right now.
            </p>
          </div>
        </section>

        {/* Trending Grid */}
        <section className="mb-20">
          {trendingCreations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
              {trendingCreations.slice(0, 4).map((item, index) => (
                <TrendingItem
                  key={item.id}
                  item={item}
                  featured={index === 0}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="w-24 h-24 bg-gray-100 rounded-full mx-auto mb-6 flex items-center justify-center">
                <span className="text-3xl text-gray-400">✨</span>
              </div>
              <h3 className="text-xl font-light text-gray-900 mb-2">No trending designs yet</h3>
              <p className="text-gray-600 mb-6">Be the first to create something amazing</p>
              <Link
                href="/design"
                className="inline-block bg-black text-white px-8 py-3 text-sm font-medium hover:bg-gray-900 transition-colors"
              >
                Start Creating
              </Link>
            </div>
          )}
        </section>

        {/* More Trending Items */}
        {trendingCreations.length > 4 && (
          <section className="mb-20">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {trendingCreations.slice(4, 8).map((item) => (
                <SmallTrendingItem
                  key={item.id}
                  item={item}
                />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h4 className="text-sm font-medium text-black mb-4">Discover</h4>
              <ul className="space-y-3 text-sm text-gray-600">
                <li><Link href="/discover" className="hover:text-black transition-colors">Trending</Link></li>
                <li><Link href="/collections" className="hover:text-black transition-colors">All Collections</Link></li>
                <li><Link href="/creators" className="hover:text-black transition-colors">AI Designers</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-black mb-4">Categories</h4>
              <ul className="space-y-3 text-sm text-gray-600">
                <li><Link href="/discover?category=menswear" className="hover:text-black transition-colors">Menswear</Link></li>
                <li><Link href="/discover?category=womenswear" className="hover:text-black transition-colors">Womenswear</Link></li>
                <li><Link href="/discover?category=accessories" className="hover:text-black transition-colors">Accessories</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-black mb-4">Company</h4>
              <ul className="space-y-3 text-sm text-gray-600">
                <li><Link href="/about" className="hover:text-black transition-colors">About CLAUTH</Link></li>
                <li><Link href="/press" className="hover:text-black transition-colors">Press</Link></li>
                <li><Link href="/careers" className="hover:text-black transition-colors">Careers</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-black mb-4">Support</h4>
              <ul className="space-y-3 text-sm text-gray-600">
                <li><Link href="/contact" className="hover:text-black transition-colors">Contact</Link></li>
                <li><Link href="/help" className="hover:text-black transition-colors">Help Center</Link></li>
                <li><Link href="/legal" className="hover:text-black transition-colors">Legal</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-100 mt-12 pt-8">
            <p className="text-xs text-gray-400 text-center tracking-widest">
              © 2024 CLAUTH. ALL RIGHTS RESERVED.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Main trending item component
function TrendingItem({ item, featured = false }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link
      href={`/clothing/${item.id}`}
      className="group block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`relative overflow-hidden bg-gray-50 transition-all duration-500 ${
        featured ? 'border-2 border-blue-200' : ''
      }`}>
        {/* Image Container */}
        <div className="aspect-[3/4] relative">
          {/* Front Image */}
          <div className={`absolute inset-0 transition-opacity duration-500 ${
            isHovered ? 'opacity-0' : 'opacity-100'
          }`}>
            {item.imageUrl ? (
              <Image
                src={item.imageUrl}
                alt={item.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 50vw"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <span className="text-4xl text-gray-400">👕</span>
              </div>
            )}
          </div>
          
          {/* Back Image - Shows on Hover */}
          <div className={`absolute inset-0 transition-opacity duration-500 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}>
            {item.backImageUrl || item.imageUrl ? (
              <Image
                src={item.backImageUrl || item.imageUrl}
                alt={`${item.name} - back view`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 50vw"
              />
            ) : (
              <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                <span className="text-4xl text-gray-500">👕</span>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <h3 className="text-xl font-light text-black mb-2 group-hover:text-gray-600 transition-colors">
            {item.name}
          </h3>
          <p className="text-sm text-gray-500 mb-1">
            by {item.creator.name}
          </p>
          <p className="text-xs text-gray-400">
            {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
          </p>
        </div>
      </div>
    </Link>
  );
}

// Small trending item component
function SmallTrendingItem({ item }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link
      href={`/clothing/${item.id}`}
      className="group block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative overflow-hidden bg-gray-50">
        <div className="aspect-[3/4] relative">
          {/* Front Image */}
          <div className={`absolute inset-0 transition-opacity duration-500 ${
            isHovered ? 'opacity-0' : 'opacity-100'
          }`}>
            {item.imageUrl ? (
              <Image
                src={item.imageUrl}
                alt={item.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <span className="text-2xl text-gray-400">👕</span>
              </div>
            )}
          </div>
          
          {/* Back Image - Shows on Hover */}
          <div className={`absolute inset-0 transition-opacity duration-500 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}>
            {item.backImageUrl || item.imageUrl ? (
              <Image
                src={item.backImageUrl || item.imageUrl}
                alt={`${item.name} - back view`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
            ) : (
              <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                <span className="text-2xl text-gray-500">👕</span>
              </div>
            )}
          </div>
        </div>
        <div className="p-4">
          <h4 className="text-sm font-light text-black mb-1 truncate">
            {item.name}
          </h4>
          <p className="text-xs text-gray-500">
            {item.creator.name}
          </p>
        </div>
      </div>
    </Link>
  );
}
