"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { auth } from "@/app/lib/firebaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // 1. Email/Password Sign In
  async function handleEmailLogin(e) {
    e.preventDefault();
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/");
    } catch (err) {
      if (err.code === "auth/user-not-found") {
        setError("No user found with these credentials. Please sign up first.");
      } else {
        setError(err.message);
      }
    }
  }

  // 2. Google Sign In (existing user)
  async function handleGoogleSignIn() {
    setError("");
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      router.push("/");
    } catch (err) {
      setError("Google Login failed. Please try again.");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <div className="bg-white w-full max-w-md p-6 rounded-lg shadow-xl">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          Log In
        </h1>

        {/* Email/Password Form */}
        <form onSubmit={handleEmailLogin}>
          <label className="block text-gray-700 font-semibold mb-2">
            Email
          </label>
          <input
            type="email"
            className="w-full p-3 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 placeholder-gray-500"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label className="block text-gray-700 font-semibold mb-2">
            Password
          </label>
          <input
            type="password"
            className="w-full p-3 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 placeholder-gray-600"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && <p className="text-red-600 mb-4">{error}</p>}

          <button
            type="submit"
            className="w-full px-6 py-3 mt-2 mb-4 text-lg font-semibold rounded-lg shadow bg-gray-900 text-white hover:bg-gray-700 transition"
          >
            Log In
          </button>
        </form>

        {/* Google Sign In Button */}
        <button
          onClick={handleGoogleSignIn}
          className="w-full px-6 py-3 text-lg font-semibold rounded-lg shadow bg-blue-600 text-white hover:bg-blue-500 transition"
        >
          Sign in with Google
        </button>

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
