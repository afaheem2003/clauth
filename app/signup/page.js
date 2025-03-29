"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  async function handleGoogleSignUp() {
    setError("");
    const res = await signIn("google", { callbackUrl: "/" });
    if (res && res.error) {
      setError(res.error);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <div className="bg-white w-full max-w-md p-6 rounded-lg shadow-xl">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          Sign Up
        </h1>
        <button
          onClick={handleGoogleSignUp}
          className="w-full px-6 py-3 text-lg font-semibold rounded-lg shadow bg-blue-600 text-white hover:bg-blue-500"
        >
          Sign up with Google
        </button>
        {error && <p className="text-red-600 mb-4">{error}</p>}
        <p className="mt-4 text-sm text-gray-600 text-center">
          Already have an account?{" "}
          <a
            href="/login"
            className="text-blue-600 hover:text-blue-500 font-semibold"
          >
            Log In
          </a>
        </p>
      </div>
    </div>
  );
}
