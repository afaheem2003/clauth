"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";

/**
 * Global route-protection helper
 *
 *  •  The Home page ( “/” ) is now **public** — anyone can view it.
 *  •  All other pages continue to behave exactly as before.
 */
export default function AuthGuard({ children }) {
  const { data: session, status } = useSession();
  const router                    = useRouter();
  const pathname                  = usePathname();

  useEffect(() => {
    if (status === "loading") return;            // still figuring out auth

    /* ───────── 1) PUBLIC HOME ───────── */
    if (!session && pathname === "/") {
      // visitor is allowed to stay on the landing page
      return;
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
