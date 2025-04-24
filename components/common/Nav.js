// components/common/Nav.jsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { slide as Menu } from "react-burger-menu";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

const menuStyles = {
  bmMenuWrap: { top: "0" },
  bmMenu: {
    background: "#1F2937",
    padding: "1.5rem 1rem",
    fontSize: "1rem",
  },
  bmOverlay: { background: "rgba(0, 0, 0, 0.3)" },
  bmItemList: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  bmCrossButton: { height: "36px", width: "36px" },
};

export default function Nav() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();

  const closeMenu = () => setIsOpen(false);

  const handleStateChange = ({ isOpen }) => setIsOpen(isOpen);
  const handleLogin = () => {
    router.push("/login");
    closeMenu();
  };
  const handleLogout = async () => {
    await signOut();
    closeMenu();
  };

  return (
    <div className="relative">
      {/* Top Bar */}
      <div className="w-full flex items-center justify-between p-4 bg-white border-b border-gray-200 shadow-sm">
        <Link href="/" className="text-2xl font-bold text-gray-900 hover:text-gray-700">
          Ploosh
        </Link>
        <button onClick={() => setIsOpen(true)} className="text-gray-700 hover:text-gray-500">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Sidebar Menu */}
      <Menu
        right
        isOpen={isOpen}
        onStateChange={handleStateChange}
        customBurgerIcon={false}
        customCrossIcon={false}
        styles={menuStyles}
      >
        {/* Close Button */}
        <button className="mb-4 text-white hover:text-gray-300" onClick={closeMenu}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Admin Dashboard at Top */}
        {session?.user?.role === "ADMIN" && (
          <Link
            href="/admin"
            className="block mt-2 text-xl text-yellow-400 hover:text-yellow-300"
            onClick={closeMenu}
          >
            Admin Dashboard
          </Link>
        )}

        {/* Main Links */}
        <Link href="/design" className="block mt-2 text-xl text-white hover:text-gray-300" onClick={closeMenu}>
          Create Design
        </Link>
        <Link href="/discover" className="block mt-2 text-xl text-white hover:text-gray-300" onClick={closeMenu}>
          Discover
        </Link>
        <Link href="/my-preorders" className="block mt-2 text-xl text-white hover:text-gray-300" onClick={closeMenu}>
          My Pre-orders
        </Link>

        {/* Profile / Settings */}
        {session?.user && (
          <div className="mt-6 space-y-2">
            <Link href="/profile" className="block text-xl text-white hover:text-gray-300" onClick={closeMenu}>
              My Profile
            </Link>
            <Link href="/settings" className="block text-xl text-white hover:text-gray-300" onClick={closeMenu}>
              Account Settings
            </Link>
          </div>
        )}

        {/* Auth Buttons */}
        {session?.user ? (
          <button
            onClick={handleLogout}
            className="mt-6 block w-full text-left text-white text-xl hover:text-gray-300"
          >
            Log Out
          </button>
        ) : (
          <div className="mt-6 space-y-2">
            <button onClick={handleLogin} className="block w-full text-left text-white text-xl hover:text-gray-300">
              Log In
            </button>
            <Link
              href="/signup"
              className="block w-full text-left text-white text-xl hover:text-gray-300"
              onClick={closeMenu}
            >
              Sign Up
            </Link>
          </div>
        )}
      </Menu>
    </div>
  );
}
