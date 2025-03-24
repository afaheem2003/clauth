"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/app/lib/firebaseClient";

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (!currentUser) {
        router.push("/login");
      } else {
        setUser(currentUser);
        setDisplayName(currentUser.displayName || "");
      }
    });
    return () => unsubscribe();
  }, [router]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg font-semibold">Loading...</p>
      </div>
    );
  }

  function handleSaveChanges() {
    alert(`Saving new display name: ${displayName} (not implemented)`);
  }

  function handleDeleteAccount() {
    alert("Delete account not implemented! (Darker button as requested)");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-10">
      <div className="container mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-6 max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">
            Account Settings
          </h1>

          {/* Change Display Name */}
          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2">
              Change Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your new display name"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 placeholder-gray-600"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:space-x-4">
            <button
              onClick={handleSaveChanges}
              className="mb-4 sm:mb-0 px-6 py-3 rounded-lg bg-gray-900 text-white font-semibold hover:bg-gray-700 transition"
            >
              Save Changes
            </button>
            <button
              onClick={handleDeleteAccount}
              className="px-6 py-3 rounded-lg bg-red-700 text-white font-semibold hover:bg-red-800 transition"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
