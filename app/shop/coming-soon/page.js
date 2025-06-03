export default function ShopComingSoon() {
  return (
    <main className="min-h-screen w-full bg-white py-20">
      <div className="max-w-4xl mx-auto text-center px-4">
        {/* Large heading with gradient text */}
        <h1 className="text-6xl md:text-7xl font-bold mb-6 text-gray-900">
          Shop Coming Soon
        </h1>

        {/* Subtitle with better typography */}
        <p className="text-xl md:text-2xl text-gray-600 max-w-2xl mx-auto mb-12 leading-relaxed">
          We're working hard to bring your designs to life. Keep creating and stay tuned for our shop launch.
        </p>

        {/* Modern call-to-action button */}
        <div className="mb-20">
          <a
            href="/design"
            className="inline-flex items-center px-8 py-4 text-lg font-medium text-white bg-black rounded-full hover:bg-gray-900 transition-colors duration-200 ease-in-out"
          >
            Start Designing
            <svg 
              className="ml-2 w-5 h-5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M17 8l4 4m0 0l-4 4m4-4H3" 
              />
            </svg>
          </a>
        </div>

        {/* Decorative elements */}
        <div className="flex justify-center items-start space-x-16 md:space-x-24 mt-4 pb-20">
          <div className="text-gray-400 flex flex-col items-center">
            <svg 
              className="w-8 h-8 mb-3" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5} 
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" 
              />
            </svg>
            <span className="text-sm font-medium">Design</span>
          </div>
          <div className="text-gray-400 flex flex-col items-center">
            <svg 
              className="w-8 h-8 mb-3" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5} 
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" 
              />
            </svg>
            <span className="text-sm font-medium">Create</span>
          </div>
          <div className="text-gray-400 flex flex-col items-center">
            <svg 
              className="w-8 h-8 mb-3" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5} 
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" 
              />
            </svg>
            <span className="text-sm font-medium">Shop</span>
          </div>
        </div>
      </div>
    </main>
  );
} 