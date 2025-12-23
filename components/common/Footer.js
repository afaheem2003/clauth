"use client";

import Link from 'next/link';

export default function Footer() {
  return (
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
            © {new Date().getFullYear()} CLAUTH. ALL RIGHTS RESERVED.
          </p>
        </div>
      </div>
    </footer>
  );
}
