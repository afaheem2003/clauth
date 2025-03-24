"use client";

import { useRouter } from "next/navigation";

export default function AuthPromptModal({ onClose }) {
  const router = useRouter();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white w-full max-w-md p-6 rounded-lg shadow-xl text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Sign in to start designing
        </h2>
        <p className="text-gray-600 mb-6">
          You need an account to create and save plushies.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => router.push("/signup")}
            className="w-full px-6 py-3 text-lg font-semibold rounded-lg bg-gray-900 text-white hover:bg-gray-700 transition"
          >
            Sign Up
          </button>
          <button
            onClick={() => router.push("/login")}
            className="w-full px-6 py-3 text-lg font-semibold rounded-lg bg-white text-gray-800 border border-gray-300 hover:bg-gray-100 transition"
          >
            Log In
          </button>
          <button
            onClick={onClose}
            className="text-sm text-gray-500 mt-2 hover:underline"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
