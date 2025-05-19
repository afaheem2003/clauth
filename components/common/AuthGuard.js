"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";

/**
 * Global route-protection helper
 *
 *  • Public paths:
 *    The following paths are publicly accessible and do NOT require authentication:
 *    • The Home page ( “/” ), Discover ( “/discover” ), and Clothing pages ( “/clothing/[id]” ) are public.
 *    • Auth pages ( “/login”, “/signup”, “/forgot-password”, etc... ) are public.
 *    • API routes ( “/api/*” ) are public by default, but are individually protected as needed.
 *  • All other routes require sign-in and appropriate roles.
 */
export default function AuthGuard({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "loading") return; // still figuring out auth

    /* ───────── 1) PUBLIC ROUTES ───────── */
    const isPublic =
      pathname === "/" ||
      pathname.startsWith("/discover") ||
      pathname.startsWith("/clothing") ||
      pathname.startsWith("/api");

    if (!session && isPublic) {
      return; // allow visitors to access public routes
    }

    /* ───────── 2) NOT SIGNED-IN → /login ───────── */
    if (!session) {
      router.replace("/login");
      return;
    }

    /* ───────── 3) ROLE-BASED ACCESS ───────── */
    if (session.user.role !== "ADMIN" && pathname.startsWith("/admin")) {
      router.replace("/");
      return;
    }

    /* ───────── 4) ONBOARDING (displayName) ───────── */
    if (
      session.user.role !== "ADMIN" &&
      !session.user.name &&
      pathname !== "/complete-profile"
    ) {
      router.replace("/complete-profile");
    }
  }, [status, session, pathname, router]);

  /* Optional loading spinner while we check auth */
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg font-semibold text-gray-800">Loading…</p>
      </div>
    );
  }

  return <>{children}</>;
}
