// components/common/AdminGuard.jsx
"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function AdminGuard({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // still loading? hold off
    if (status === "loading") return;

    // not authenticated → login
    if (!session) {
      router.replace("/login");
    }
    // authenticated but not an admin → go home (or 403 page)
    else if (session.user.role !== "ADMIN") {
      router.replace("/");
    }
  }, [status, session, router]);

  // while loading or non-admin, you can show a spinner or blank
  if (status === "loading" || session?.user.role !== "ADMIN") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-gray-700">Checking permissions…</p>
      </div>
    );
  }

  // only an ADMIN makes it here
  return <>{children}</>;
}
