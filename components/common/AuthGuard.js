"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";

export default function AuthGuard({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Wait for session to load
    if (status === "loading") return;

    // If not logged in, redirect
    if (!session) {
      router.replace("/login");
    }
    // If missing displayName, redirect to complete-profile
    else if (!session.user?.name && pathname !== "/complete-profile") {
      router.replace("/complete-profile");
    }
  }, [status, session, pathname, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg font-semibold text-gray-800">Loading...</p>
      </div>
    );
  }

  return <>{children}</>;
}
