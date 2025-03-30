"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export default function CompleteProfile() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");

  // If user isn’t signed in or session is loading, handle accordingly
  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user) {
      // Not logged in, redirect to /login
      router.replace("/login");
    }
    // else user is logged in
  }, [session, status, router]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!username.trim()) {
      setError("Username cannot be empty.");
      return;
    }
    // Example: store username in DB via a custom API route or NextAuth update
    console.log("Setting username to:", username);
    router.replace("/");
  }

  async function handleCancel() {
    // If you want to sign out from NextAuth:
    // import { signOut } from "next-auth/react";
    // await signOut();
    router.replace("/login");
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading session...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <div className="bg-white w-full max-w-md p-6 rounded-lg shadow-xl">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          Complete Your Profile
        </h1>
        <p className="text-gray-700 mb-4">
          Please choose a username to continue.
        </p>
        {error && <p className="text-red-600 mb-4">{error}</p>}
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter a username..."
            className="w-full p-3 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-gray-900 placeholder-gray-600"
          />
          <button
            type="submit"
            className="w-full mt-6 px-6 py-3 text-lg font-semibold rounded-lg shadow bg-gray-900 text-white hover:bg-gray-700 transition"
          >
            Save Username
          </button>
        </form>
        <button
          onClick={handleCancel}
          className="w-full mt-4 px-6 py-3 text-lg font-semibold rounded-lg shadow bg-red-700 text-white hover:bg-red-800 transition"
        >
          Cancel (Log Out)
        </button>
      </div>
    </div>
  );
}
