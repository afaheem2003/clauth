"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";

/**
 * Simplified AuthGuard that works with our middleware
 * 
 * The middleware handles most routing logic for waitlist mode.
 * This guard handles:
 * - Loading states
 * - Profile completion requirements
 * - Admin-specific protections
 */
export default function AuthGuard({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "loading") return; // still figuring out auth

    // Let middleware handle waitlist routing - we just handle specific cases here
    
    /* ───────── ADMIN-ONLY ROUTES ───────── */
    if (session?.user && session.user.role !== "ADMIN" && pathname.startsWith("/admin")) {
      router.replace("/");
      return;
    }

    /* ───────── PROFILE COMPLETION ───────── */
    if (
      session?.user &&
      session.user.role !== "ADMIN" &&
      !session.user.displayName &&
      pathname !== "/complete-profile" &&
      pathname !== "/waitlist-status" &&
      pathname !== "/waitlist" &&
      pathname !== "/login"
    ) {
      router.replace("/complete-profile");
    }
  }, [status, session, pathname, router]);

  /* Loading spinner while we check auth */
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-gray-600 font-light">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
