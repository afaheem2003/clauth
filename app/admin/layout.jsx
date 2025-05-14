"use client";

import Link       from "next/link";
import { useRouter } from "next/navigation";
import { signOut }   from "next-auth/react";
import AuthGuard     from "@/components/common/AuthGuard";
import AdminGuard    from "@/components/common/AdminGuard";

export const dynamic = 'force-dynamic';

export default function AdminLayout({ children }) {
  const router = useRouter();

  return (
    <AuthGuard>
      <AdminGuard>
        <div className="flex min-h-screen">
          {/* ────────── Sidebar ────────── */}
          <aside className="w-64 bg-gray-900 text-white p-6">
            <h2 className="text-2xl font-bold mb-8 text-gray-100">Ploosh&nbsp;Admin</h2>

            <nav className="space-y-4 text-lg">
  <Link href="/admin"                  className="block font-medium text-gray-200 hover:text-gray-100">
    Dashboard
  </Link>

  <Link href="/admin/plushies"         className="block font-medium text-gray-200 hover:text-gray-100">
    Plushies
  </Link>

  <Link href="/admin/preorders"        className="block font-medium text-gray-200 hover:text-gray-100">
    Pre-orders
  </Link>

  {/* Production section */}
  <div className="space-y-2">
    <p className="text-sm uppercase tracking-wide text-gray-400">Production</p>

    <Link href="/admin/production"              className="block ml-3 font-medium text-gray-200 hover:text-gray-100">
      Queue&nbsp;(ready)
    </Link>

    <Link href="/admin/production/in-progress"  className="block ml-3 font-medium text-gray-200 hover:text-gray-100">
      In&nbsp;Progress
    </Link>
  </div>

  <Link href="/admin/users"            className="block font-medium text-gray-200 hover:text-gray-100">
    Users
  </Link>
</nav>

            <button
              onClick={async () => {
                await signOut();
                router.push("/");
              }}
              className="mt-8 bg-red-600 px-4 py-2 rounded hover:bg-red-700 font-medium text-white"
            >
              Sign&nbsp;Out
            </button>
          </aside>

          {/* ────────── Main content ────────── */}
          <main className="flex-1 bg-gray-100 p-8 overflow-auto">
            {children}
          </main>
        </div>
      </AdminGuard>
    </AuthGuard>
  );
}
