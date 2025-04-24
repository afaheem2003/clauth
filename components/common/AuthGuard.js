"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";

export default function AuthGuard({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "loading") return;

    // 1) not signed in → /login
    if (!session) {
      router.replace("/login");
      return;
    }

    // 2) non-admins must not visit /admin
    if (
      session.user.role !== "ADMIN" &&
      pathname.startsWith("/admin")
    ) {
      router.replace("/");
      return;
    }

    // 3) new users require a displayName
    if (
      session.user.role !== "ADMIN" &&
      !session.user.name &&
      pathname !== "/complete-profile"
    ) {
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
