"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  async function handleGoogleSignIn() {
    setError("");
    try {
      const result = await signIn("google", {
        redirect: false,
        callbackUrl: "/"
      });
      
      if (result?.error) {
        setError(result.error);
      } else if (result?.url) {
        router.push(result.url);
      }
    } catch (err) {
      console.error("Sign in error:", err);
      setError("Google login failed. Please try again.");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <div className="bg-white w-full max-w-md p-6 rounded-lg shadow-xl">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          Log In
        </h1>
        <button
          onClick={handleGoogleSignIn}
          className="w-full px-6 py-3 text-lg font-semibold rounded-lg shadow bg-blue-600 text-white hover:bg-blue-500"
        >
          Sign in with Google
        </button>
        {error && <p className="text-red-600 mt-4 text-center">{error}</p>}
        <p className="mt-4 text-sm text-gray-600 text-center">
          Don&apos;t have an account?{" "}
          <a
            href="/signup"
            className="text-blue-600 hover:text-blue-500 font-semibold"
          >
            Sign Up
          </a>
        </p>
      </div>
    </div>
  );
}
