// app/components/common/AuthGuard.jsx
"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";

export default function AuthGuard({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "loading") return; // Wait for session to load
    if (!session) {
      // Not signed in, redirect to login page
      router.replace("/login");
    } else if (!session.user.displayName && pathname !== "/complete-profile") {
      // User signed in but hasn't set a display name, redirect to complete-profile
      router.replace("/complete-profile");
    }
  }, [session, status, router, pathname]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg font-semibold text-gray-800">Loading...</p>
      </div>
    );
  }

  return <>{children}</>;
}
