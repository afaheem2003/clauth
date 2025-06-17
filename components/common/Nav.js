// app/components/Nav.jsx or Nav.tsx (if using TS)
"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { slide as Menu } from "react-burger-menu";
import { useRouter, usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useCart } from "@/lib/CartContext";
import { ShoppingBagIcon, ChevronDownIcon, Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import CreditBalance from "@/components/credits/CreditBalance";

/* react-burger-menu styles ----------------------------------------- */
const menuStyles = {
  bmMenuWrap: { 
    top: 0,
    zIndex: 9999,
    position: 'fixed'
  },
  bmOverlay: { 
    background: "rgba(0, 0, 0, 0.7)",
    backdropFilter: "blur(4px)",
    zIndex: 9998
  },
  bmMenu: { 
    background: "linear-gradient(135deg, #000000 0%, #1a1a1a 100%)",
    padding: "2rem 1.5rem",
    boxShadow: "-10px 0 25px rgba(0, 0, 0, 0.5)",
    width: '300px',
    height: '100vh'
  },
  bmItemList: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
    padding: 0
  },
  bmCrossButton: { 
    height: "40px", 
    width: "40px",
    top: "1.5rem",
    right: "1.5rem"
  },
  bmBurgerButton: {
    display: 'none' // We're using our own burger button
  }
};

/* helper ─ close dropdown on outside-click -------------------------- */
function useOutside(ref, cb) {
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) cb();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, cb]);
}

export default function Nav() {
  const [open, setOpen] = useState(false); // mobile slide-out
  const [drop, setDrop] = useState(false); // desktop dropdown
  const dropRef = useRef(null);
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { getCartCount, setIsOpen: setCartOpen } = useCart();
  const [isShopEnabled, setIsShopEnabled] = useState(false);

  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  useEffect(() => {
    // Get ENABLE_SHOP value from environment variable
    setIsShopEnabled(process.env.NEXT_PUBLIC_ENABLE_SHOP === 'true');
  }, []);

  useOutside(dropRef, () => setDrop(false));

  // Hide navigation on standalone pages that are designed as full-page experiences
  const hideNavPages = ['/waitlist', '/waitlist-status'];
  const shouldHideNav = hideNavPages.includes(pathname);

  // If we should hide nav, return null AFTER all hooks have been called
  if (shouldHideNav) {
    return null;
  }

  const close = () => setOpen(false);
  const login = () => {
    router.push("/login");
    close();
  };
  const logout = () => signOut().finally(close);

  // Check if user has full access - admins ALWAYS have full access, regardless of waitlist status
  const isAdmin = session?.user?.role === 'ADMIN';
  const isApproved = session?.user?.waitlistStatus === 'APPROVED';
  const hasFullAccess = isAdmin || isApproved;
  const isWaitlisted = session?.user?.waitlistStatus === 'WAITLISTED' && !isAdmin; // Admins are never considered waitlisted

  // Different navigation links based on user status
  const getNavigationLinks = () => {
    if (!session?.user || isWaitlisted) {
      // Waitlisted users (but not admins) or non-logged in users get minimal navigation
      return [];
    }

    // Full access users get all links
    const links = [
      { href: '/discover', label: 'Discover' },
      ...(isShopEnabled ? [{ href: '/shop', label: 'Shop' }] : []),
      { href: '/creators', label: 'Creators' },
      { href: '/design', label: 'Design' },
      { href: '/challenges', label: 'Challenges' },
    ];

    // Add feed link if user is logged in and has full access
    return hasFullAccess ? [...links, { href: '/feed', label: 'Feed' }] : links;
  };

  const allLinks = getNavigationLinks();
  const cartCount = getCartCount();

  return (
    <header className="bg-white border-b border-gray-300 sticky top-0 z-40 shadow-md">
      <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* LOGO */}
        <Link 
          href={hasFullAccess ? "/discover" : "/waitlist-status"} 
          className="text-2xl font-bold text-black hover:text-gray-700 transition-all duration-300"
        >
          Clauth
        </Link>

        {/* DESKTOP NAV - Only show for users with full access */}
        {hasFullAccess && (
          <nav className="hidden md:flex items-center gap-1">
            {allLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-black hover:bg-gray-100 rounded-lg transition-all duration-200 relative group"
              >
                {l.label}
                <span className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-black group-hover:w-full group-hover:left-0 transition-all duration-300"></span>
              </Link>
            ))}

            {isAdmin && (
              <Link
                href="/admin"
                className="px-4 py-2 text-sm font-medium text-gray-800 hover:text-black hover:bg-gray-100 rounded-lg transition-all duration-200 relative group"
              >
                Admin
                <span className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-gray-800 group-hover:w-full group-hover:left-0 transition-all duration-300"></span>
              </Link>
            )}
          </nav>
        )}

        {/* RIGHT SIDE ACTIONS */}
        <div className="flex items-center gap-3">
          {/* Credit Balance - Only show for users with full access */}
          {session?.user && hasFullAccess && (
            <div className="hidden sm:block">
              <CreditBalance />
            </div>
          )}

          {/* Cart Icon - Only show if shop is enabled and user has full access */}
          {isShopEnabled && hasFullAccess && (
            <button
              onClick={() => setCartOpen(true)}
              className="relative p-2.5 text-gray-600 hover:text-black hover:bg-gray-100 rounded-xl transition-all duration-200 group"
            >
              <ShoppingBagIcon className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-black text-white text-xs w-5 h-5 flex items-center justify-center rounded-full font-medium shadow-lg">
                  {cartCount}
                </span>
              )}
            </button>
          )}

          {!session?.user ? (
            <button
              onClick={login}
              className="hidden sm:flex items-center px-4 py-2 text-sm font-medium text-white bg-black hover:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              Sign In
            </button>
          ) : (
            <div className="hidden md:block relative" ref={dropRef}>
              <button
                onClick={() => setDrop((prev) => !prev)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-black hover:bg-gray-100 rounded-xl transition-all duration-200 group"
              >
                <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-white font-semibold text-xs">
                  {session.user.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <span className="hidden lg:block">
                  {isAdmin ? 'Admin' : isWaitlisted ? 'Waitlisted' : 'Account'}
                </span>
                <ChevronDownIcon className={`w-4 h-4 transition-transform duration-200 ${drop ? 'rotate-180' : ''}`} />
              </button>

              {drop && (
                <div className="absolute right-0 mt-3 w-56 rounded-2xl shadow-xl bg-white ring-1 ring-gray-300 py-2 text-sm border border-gray-200 animate-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-3 border-b border-gray-200">
                    <p className="text-sm font-medium text-black">{session.user.name}</p>
                    <p className="text-xs text-gray-600 truncate">{session.user.email}</p>
                    {isAdmin && (
                      <p className="text-xs text-blue-600 mt-1">Administrator</p>
                    )}
                    {isWaitlisted && (
                      <p className="text-xs text-orange-600 mt-1">On Waitlist</p>
                    )}
                  </div>
                  
                  {/* Only show menu items for users with full access */}
                  {hasFullAccess && (
                    <div className="py-2">
                      <Link
                        href="/my-likes"
                        onClick={() => setDrop(false)}
                        className="flex items-center px-4 py-2.5 text-gray-700 hover:bg-gray-100 hover:text-black transition-colors duration-150"
                      >
                        <span className="w-2 h-2 bg-gray-400 rounded-full mr-3"></span>
                        My Likes
                      </Link>
                      {isShopEnabled && (
                        <Link
                          href="/my-preorders"
                          onClick={() => setDrop(false)}
                          className="flex items-center px-4 py-2.5 text-gray-700 hover:bg-gray-100 hover:text-black transition-colors duration-150"
                        >
                          <span className="w-2 h-2 bg-gray-500 rounded-full mr-3"></span>
                          My Pre-orders
                        </Link>
                      )}
                      <Link
                        href="/collections"
                        onClick={() => setDrop(false)}
                        className="flex items-center px-4 py-2.5 text-gray-700 hover:bg-gray-100 hover:text-black transition-colors duration-150"
                      >
                        <span className="w-2 h-2 bg-gray-600 rounded-full mr-3"></span>
                        My Collections
                      </Link>
                      <Link
                        href="/profile"
                        onClick={() => setDrop(false)}
                        className="flex items-center px-4 py-2.5 text-gray-700 hover:bg-gray-100 hover:text-black transition-colors duration-150"
                      >
                        <span className="w-2 h-2 bg-gray-700 rounded-full mr-3"></span>
                        My Profile
                      </Link>
                      <Link
                        href="/settings"
                        onClick={() => setDrop(false)}
                        className="flex items-center px-4 py-2.5 text-gray-700 hover:bg-gray-100 hover:text-black transition-colors duration-150"
                      >
                        <span className="w-2 h-2 bg-gray-800 rounded-full mr-3"></span>
                        Settings
                      </Link>
                    </div>
                  )}
                  
                  <div className="border-t border-gray-200 pt-2">
                    <button
                      onClick={logout}
                      className="w-full text-left flex items-center px-4 py-2.5 text-gray-700 hover:bg-gray-100 hover:text-black transition-colors duration-150"
                    >
                      <span className="w-2 h-2 bg-gray-900 rounded-full mr-3"></span>
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MOBILE BURGER - Only show for users with full access */}
          {hasFullAccess && (
            <button
              onClick={() => {
                console.log('Burger clicked, opening menu');
                setOpen(true);
              }}
              className="md:hidden p-2 text-gray-600 hover:text-black hover:bg-gray-100 rounded-lg transition-all duration-200 flex items-center justify-center"
              aria-label="Open mobile menu"
            >
              <Bars3Icon className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>

      {/* MOBILE SLIDE-OUT MENU - Only for users with full access */}
      {hasFullAccess && (
        <Menu
          right
          isOpen={open}
          onStateChange={({ isOpen }) => {
            console.log('Menu state changed:', isOpen);
            setOpen(isOpen);
          }}
          customBurgerIcon={false}
          customCrossIcon={false}
          styles={menuStyles}
          pageWrapId="page-wrap"
          outerContainerId="outer-container"
        >
          <div className="flex items-center justify-between mb-8">
            <div className="text-2xl font-bold text-white">
              Clauth
            </div>
            <button 
              onClick={close} 
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {session?.user && (
            <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-black font-semibold">
                  {session.user.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="text-white font-medium">{session.user.name}</p>
                  <p className="text-white/60 text-sm truncate">{session.user.email}</p>
                  {isAdmin && (
                    <p className="text-blue-400 text-xs">Administrator</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {isAdmin && (
            <Link
              href="/admin"
              onClick={close}
              className="flex items-center gap-3 p-3 mb-2 text-white hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
            >
              <span className="w-2 h-2 bg-white rounded-full"></span>
              <span className="text-lg font-medium">Admin Dashboard</span>
            </Link>
          )}

          <div className="space-y-1 mb-6">
            {allLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={close}
                className="flex items-center gap-3 p-3 text-white hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200 group"
              >
                <span className="w-2 h-2 bg-white/60 rounded-full group-hover:bg-white transition-colors duration-200"></span>
                <span className="text-lg font-medium">{l.label}</span>
              </Link>
            ))}
          </div>

          <div className="border-t border-white/20 pt-6">
            {!session?.user ? (
              <div className="space-y-3">
                <button
                  onClick={login}
                  className="w-full p-3 text-left text-black bg-white hover:bg-gray-200 rounded-xl transition-all duration-200 font-medium"
                >
                  Sign In
                </button>
                <Link
                  href="/signup"
                  onClick={close}
                  className="block p-3 text-white/80 hover:text-white hover:bg-white/5 rounded-xl transition-all duration-200"
                >
                  Create Account
                </Link>
              </div>
            ) : (
              <div className="space-y-1">
                {isShopEnabled && (
                  <Link
                    href="/my-preorders"
                    onClick={close}
                    className="flex items-center gap-3 p-3 text-white/80 hover:text-white hover:bg-white/5 rounded-xl transition-all duration-200"
                  >
                    <span className="w-2 h-2 bg-white/40 rounded-full"></span>
                    My Pre-orders
                  </Link>
                )}
                <Link
                  href="/collections"
                  onClick={close}
                  className="flex items-center gap-3 p-3 text-white/80 hover:text-white hover:bg-white/5 rounded-xl transition-all duration-200"
                >
                  <span className="w-2 h-2 bg-white/50 rounded-full"></span>
                  My Collections
                </Link>
                <Link
                  href="/profile"
                  onClick={close}
                  className="flex items-center gap-3 p-3 text-white/80 hover:text-white hover:bg-white/5 rounded-xl transition-all duration-200"
                >
                  <span className="w-2 h-2 bg-white/60 rounded-full"></span>
                  My Profile
                </Link>
                <Link
                  href="/settings"
                  onClick={close}
                  className="flex items-center gap-3 p-3 text-white/80 hover:text-white hover:bg-white/5 rounded-xl transition-all duration-200"
                >
                  <span className="w-2 h-2 bg-white/70 rounded-full"></span>
                  Settings
                </Link>
                <Link
                  href="/my-likes"
                  onClick={close}
                  className="flex items-center gap-3 p-3 text-white/80 hover:text-white hover:bg-white/5 rounded-xl transition-all duration-200"
                >
                  <span className="w-2 h-2 bg-white/80 rounded-full"></span>
                  My Likes
                </Link>
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-3 p-3 text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-all duration-200 mt-4"
                >
                  <span className="w-2 h-2 bg-white/90 rounded-full"></span>
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </Menu>
      )}
    </header>
  );
}
