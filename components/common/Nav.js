"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { slide as Menu } from "react-burger-menu";
import { useRouter, usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useCart } from "@/lib/CartContext";
import { ShoppingBagIcon, ChevronDownIcon, Bars3Icon, XMarkIcon, PlusIcon } from "@heroicons/react/24/outline";

/* react-burger-menu styles ----------------------------------------- */
const menuStyles = {
  bmMenuWrap:  { top: 0, zIndex: 9999, position: 'fixed' },
  bmOverlay:   { background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", zIndex: 9998 },
  bmMenu:      { background: "#000", padding: "2rem 1.5rem", boxShadow: "-10px 0 25px rgba(0,0,0,0.5)", width: '300px', height: '100vh' },
  bmItemList:  { display: "flex", flexDirection: "column", gap: "0.25rem", padding: 0 },
  bmCrossButton:  { height: "40px", width: "40px", top: "1.5rem", right: "1.5rem" },
  bmBurgerButton: { display: 'none' },
};

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
  const [mobileOpen, setMobileOpen]   = useState(false);
  const [accountDrop, setAccountDrop] = useState(false);
  const [createDrop, setCreateDrop]   = useState(false);

  const accountRef = useRef(null);
  const createRef  = useRef(null);

  const { data: session } = useSession();
  const router   = useRouter();
  const pathname = usePathname();
  const { getCartCount, setIsOpen: setCartOpen } = useCart();
  const isShopEnabled = process.env.NEXT_PUBLIC_ENABLE_SHOP === 'true';

  useOutside(accountRef, () => setAccountDrop(false));
  useOutside(createRef,  () => setCreateDrop(false));

  const hideNavPages = ['/waitlist', '/waitlist-status'];
  if (hideNavPages.includes(pathname)) return null;

  const close  = () => setMobileOpen(false);
  const login  = () => { router.push("/login"); close(); };
  const logout = () => signOut().finally(close);

  const isAdmin      = session?.user?.role === 'ADMIN';
  const isApproved   = session?.user?.waitlistStatus === 'APPROVED';
  const hasFullAccess = isAdmin || isApproved;
  const isWaitlisted  = session?.user?.waitlistStatus === 'WAITLISTED' && !isAdmin;

  const cartCount = getCartCount();

  // Browse links — discovery / social / community
  const browseLinks = hasFullAccess ? [
    { href: '/discover',        label: 'Discover'        },
    { href: '/feed',            label: 'Feed'            },
    { href: '/creators',        label: 'Creators'        },
    { href: '/challenges',      label: 'Challenges'      },
    { href: '/community-vote',  label: 'Community Vote'  },
    ...(isShopEnabled ? [{ href: '/shop', label: 'Shop' }] : []),
  ] : [];

  // Create actions — dropdown items
  const createLinks = [
    { href: '/design',              label: 'Design a piece'  },
    { href: '/collections/create',  label: 'New collection'  },
  ];

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-6">

        {/* LOGO */}
        <Link
          href={hasFullAccess ? "/discover" : "/waitlist-status"}
          className="text-lg font-semibold text-black tracking-tight flex-shrink-0"
        >
          Clauth
        </Link>

        {/* DESKTOP BROWSE NAV */}
        {hasFullAccess && (
          <nav className="hidden md:flex items-center gap-0.5 flex-1">
            {browseLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`px-3 py-1.5 text-sm transition-colors rounded ${
                  pathname === l.href
                    ? 'text-black font-medium'
                    : 'text-gray-500 hover:text-black'
                }`}
              >
                {l.label}
              </Link>
            ))}
            {isAdmin && (
              <Link
                href="/admin"
                className="px-3 py-1.5 text-sm text-gray-500 hover:text-black transition-colors rounded"
              >
                Admin
              </Link>
            )}
          </nav>
        )}

        {/* RIGHT SIDE */}
        <div className="flex items-center gap-2 flex-shrink-0">

          {/* CART */}
          {isShopEnabled && hasFullAccess && (
            <button
              onClick={() => setCartOpen(true)}
              className="relative p-2 text-gray-500 hover:text-black transition-colors"
            >
              <ShoppingBagIcon className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-black text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-medium">
                  {cartCount}
                </span>
              )}
            </button>
          )}

          {/* + CREATE DROPDOWN */}
          {hasFullAccess && (
            <div className="hidden md:block relative" ref={createRef}>
              <button
                onClick={() => { setCreateDrop(p => !p); setAccountDrop(false); }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-black text-white text-sm hover:bg-gray-800 transition-colors rounded"
              >
                <PlusIcon className="w-3.5 h-3.5" />
                Create
              </button>

              {createDrop && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 shadow-lg py-1 z-50">
                  {createLinks.map((l) => (
                    <Link
                      key={l.href}
                      href={l.href}
                      onClick={() => setCreateDrop(false)}
                      className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-black transition-colors"
                    >
                      {l.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SIGN IN (unauthenticated) */}
          {!session?.user && (
            <button
              onClick={login}
              className="hidden sm:block px-4 py-1.5 text-sm font-medium text-white bg-black hover:bg-gray-800 rounded transition-colors"
            >
              Sign in
            </button>
          )}

          {/* ACCOUNT DROPDOWN */}
          {session?.user && (
            <div className="hidden md:block relative" ref={accountRef}>
              <button
                onClick={() => { setAccountDrop(p => !p); setCreateDrop(false); }}
                className="flex items-center gap-2 p-1.5 text-gray-600 hover:text-black transition-colors rounded"
              >
                <div className="w-7 h-7 bg-black rounded-full flex items-center justify-center text-white text-xs font-semibold">
                  {session.user.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <ChevronDownIcon className={`w-3.5 h-3.5 transition-transform duration-200 ${accountDrop ? 'rotate-180' : ''}`} />
              </button>

              {accountDrop && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 shadow-lg py-1 z-50">
                  {/* User info */}
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-black truncate">{session.user.name}</p>
                    <p className="text-xs text-gray-400 truncate">{session.user.email}</p>
                    {isAdmin     && <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">Administrator</p>}
                    {isWaitlisted && <p className="text-xs text-gray-400 mt-1">On waitlist</p>}
                  </div>

                  {hasFullAccess && (
                    <div className="py-1">
                      <Link href="/profile"      onClick={() => setAccountDrop(false)} className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-black transition-colors">Profile</Link>
                      <Link href="/my-likes"     onClick={() => setAccountDrop(false)} className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-black transition-colors">Likes</Link>
                      <Link href="/collections"  onClick={() => setAccountDrop(false)} className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-black transition-colors">Collections</Link>
                      {isShopEnabled && <Link href="/my-preorders" onClick={() => setAccountDrop(false)} className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-black transition-colors">Pre-orders</Link>}
                      <Link href="/settings"     onClick={() => setAccountDrop(false)} className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-black transition-colors">Settings</Link>
                    </div>
                  )}

                  <div className="border-t border-gray-100 py-1">
                    <button
                      onClick={logout}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-500 hover:bg-gray-50 hover:text-black transition-colors"
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MOBILE BURGER */}
          {(hasFullAccess || session?.user) && (
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 text-gray-600 hover:text-black transition-colors"
              aria-label="Open menu"
            >
              <Bars3Icon className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* MOBILE SLIDE-OUT */}
      {(hasFullAccess || session?.user) && (
        <Menu
          right
          isOpen={mobileOpen}
          onStateChange={({ isOpen }) => setMobileOpen(isOpen)}
          customBurgerIcon={false}
          customCrossIcon={false}
          styles={menuStyles}
          pageWrapId="page-wrap"
          outerContainerId="outer-container"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <span className="text-white font-semibold tracking-tight">Clauth</span>
            <button onClick={close} className="p-1.5 text-white/60 hover:text-white transition-colors">
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* User info */}
          {session?.user && (
            <div className="mb-6 pb-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center text-black text-sm font-semibold flex-shrink-0">
                  {session.user.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="min-w-0">
                  <p className="text-white text-sm font-medium truncate">{session.user.name}</p>
                  <p className="text-white/40 text-xs truncate">{session.user.email}</p>
                </div>
              </div>
            </div>
          )}

          {/* Create */}
          {hasFullAccess && (
            <div className="mb-6">
              <p className="text-white/30 text-xs font-medium tracking-widest uppercase mb-2 px-1">Create</p>
              {createLinks.map((l) => (
                <Link key={l.href} href={l.href} onClick={close}
                  className="flex items-center gap-3 px-1 py-2.5 text-white hover:text-white/70 transition-colors text-sm"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          )}

          {/* Browse */}
          {hasFullAccess && (
            <div className="mb-6">
              <p className="text-white/30 text-xs font-medium tracking-widest uppercase mb-2 px-1">Browse</p>
              {browseLinks.map((l) => (
                <Link key={l.href} href={l.href} onClick={close}
                  className="flex items-center gap-3 px-1 py-2.5 text-white/80 hover:text-white transition-colors text-sm"
                >
                  {l.label}
                </Link>
              ))}
              {isAdmin && (
                <Link href="/admin" onClick={close}
                  className="flex items-center gap-3 px-1 py-2.5 text-white/80 hover:text-white transition-colors text-sm"
                >
                  Admin Dashboard
                </Link>
              )}
            </div>
          )}

          {/* Account */}
          <div className="border-t border-white/10 pt-6">
            {!session?.user ? (
              <button onClick={login} className="w-full py-2.5 text-left text-black bg-white text-sm font-medium px-4 rounded hover:bg-gray-100 transition-colors">
                Sign in
              </button>
            ) : (
              <div>
                <p className="text-white/30 text-xs font-medium tracking-widest uppercase mb-2 px-1">Account</p>
                {hasFullAccess && (
                  <>
                    <Link href="/profile"     onClick={close} className="block px-1 py-2.5 text-white/80 hover:text-white transition-colors text-sm">Profile</Link>
                    <Link href="/my-likes"    onClick={close} className="block px-1 py-2.5 text-white/80 hover:text-white transition-colors text-sm">Likes</Link>
                    <Link href="/collections" onClick={close} className="block px-1 py-2.5 text-white/80 hover:text-white transition-colors text-sm">Collections</Link>
                    {isShopEnabled && <Link href="/my-preorders" onClick={close} className="block px-1 py-2.5 text-white/80 hover:text-white transition-colors text-sm">Pre-orders</Link>}
                    <Link href="/settings"    onClick={close} className="block px-1 py-2.5 text-white/80 hover:text-white transition-colors text-sm">Settings</Link>
                  </>
                )}
                <button onClick={logout} className="block w-full text-left px-1 py-2.5 text-white/40 hover:text-white transition-colors text-sm mt-2">
                  Sign out
                </button>
              </div>
            )}
          </div>
        </Menu>
      )}
    </header>
  );
}
