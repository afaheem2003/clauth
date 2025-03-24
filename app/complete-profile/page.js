"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, signOutUser } from "@/app/lib/firebaseClient";
import { updateProfile } from "firebase/auth";

export default function CompleteProfile() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (!currentUser) {
        router.replace("/login");
      } else {
        setUser(currentUser);
      }
    });

    return () => unsubscribe();
  }, [router]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!username.trim()) {
      setError("Username cannot be empty.");
      return;
    }

    try {
      await updateProfile(user, { displayName: username });
      router.replace("/");
    } catch (err) {
      setError("Failed to update username.");
    }
  }

  async function handleCancel() {
    await signOutUser();
    router.replace("/login");
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
