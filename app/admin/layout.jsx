"use client";

import Link       from "next/link";
import { useRouter } from "next/navigation";
import { signOut }   from "next-auth/react";
import AuthGuard     from "@/components/common/AuthGuard";
import AdminGuard    from "@/components/common/AdminGuard";

export default function AdminLayout({ children }) {
  const router = useRouter();

  return (
    <AuthGuard>
      <AdminGuard>
        <div className="flex min-h-screen">
          {/* ────────── Sidebar ────────── */}
          <aside className="w-56 bg-black text-white flex flex-col p-6">
            <h2 className="text-sm font-semibold tracking-widest uppercase text-gray-500 mb-8">Clauth Admin</h2>

            <nav className="space-y-1 flex-1">
              {[
                { href: "/admin", label: "Dashboard" },
                { href: "/admin/clothing", label: "Clothing" },
                { href: "/admin/preorders", label: "Pre-orders" },
                { href: "/admin/production", label: "Production" },
                { href: "/admin/users", label: "Users" },
                { href: "/admin/challenges", label: "Challenges" },
                { href: "/admin/waitlist", label: "Waitlist" },
              ].map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="block px-3 py-2 text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 rounded-md transition-colors"
                >
                  {label}
                </Link>
              ))}
            </nav>

            <button
              onClick={async () => {
                await signOut();
                router.push("/");
              }}
              className="mt-6 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-300 text-left transition-colors"
            >
              Sign out
            </button>
          </aside>

          {/* ────────── Main content ────────── */}
          <main className="flex-1 bg-gray-50 p-8 overflow-auto">
            {children}
          </main>
        </div>
      </AdminGuard>
    </AuthGuard>
  );
}
