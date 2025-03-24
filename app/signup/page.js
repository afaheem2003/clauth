"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
} from "firebase/auth";
import { auth } from "@/app/lib/firebaseClient";

export default function SignupPage() {
  const router = useRouter();

  // Possible steps: SIGN_UP → USERNAME → DONE
  const [step, setStep] = useState("SIGN_UP");

  // Email/Password form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Username for the second step
  const [username, setUsername] = useState("");

  // For error messages
  const [error, setError] = useState("");

  // 1. Email/Password Sign Up (Step: SIGN_UP)
  async function handleEmailSignup(e) {
    e.preventDefault();
    setError("");

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      // If successful, move on to the username step
      setStep("USERNAME");
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        setError("This email is already in use. Try logging in instead.");
      } else {
        setError(err.message);
      }
    }
  }

  // 2. Google Sign Up (Step: SIGN_UP)
  async function handleGoogleSignup() {
    setError("");
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      // Move on to the username step
      setStep("USERNAME");
    } catch (err) {
      setError("Google Sign Up failed. Please try again.");
    }
  }

  // 3. Prompt for Username (Step: USERNAME)
  async function handleUsernameSubmit() {
    if (!username.trim()) {
      setError("Username cannot be empty.");
      return;
    }
    // Update the user’s displayName in Firebase
    if (auth.currentUser) {
      try {
        await updateProfile(auth.currentUser, { displayName: username });
        setStep("DONE");
        router.push("/");
      } catch (err) {
        setError("Failed to set username. Please try again.");
      }
    } else {
      setError("No signed-in user found. Please try again.");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <div className="bg-white w-full max-w-md p-6 rounded-lg shadow-xl">
        {step === "SIGN_UP" && (
          <>
            <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
              Sign Up
            </h1>

            {/* Email/Password Form */}
            <form onSubmit={handleEmailSignup}>
              <label className="block text-gray-700 font-semibold mb-2">
                Email
              </label>
              <input
                type="email"
                className="w-full p-3 mb-4 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-gray-900 placeholder-gray-500 text-gray-900"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <label className="block text-gray-700 font-semibold mb-2">
                Password
              </label>
              <input
                type="password"
                className="w-full p-3 mb-4 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-gray-900 placeholder-gray-500 text-gray-900"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              {error && <p className="text-red-600 mb-4">{error}</p>}

              <button
                type="submit"
                className="w-full px-6 py-3 mt-2 mb-4 text-lg font-semibold rounded-lg shadow bg-gray-900 text-white hover:bg-gray-700 transition"
              >
                Sign Up
              </button>
            </form>

            {/* Google Sign Up Button */}
            <button
              onClick={handleGoogleSignup}
              className="w-full px-6 py-3 text-lg font-semibold rounded-lg shadow bg-blue-600 text-white hover:bg-blue-500 transition"
            >
              Sign up with Google
            </button>

            <p className="mt-4 text-sm text-gray-600 text-center">
              Already have an account?{" "}
              <a
                href="/login"
                className="text-blue-600 hover:text-blue-500 font-semibold"
              >
                Log In
              </a>
            </p>
          </>
        )}

        {step === "USERNAME" && (
          <>
            <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">
              Choose a Username
            </h2>
            <p className="text-gray-700 mb-4">
              Almost done! Please pick a username for your account.
            </p>

            {error && <p className="text-red-600 mb-4">{error}</p>}

            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter a username..."
              className="w-full p-3 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-gray-900 placeholder-gray-500 text-gray-900"
            />
            <button
              onClick={handleUsernameSubmit}
              className="w-full mt-6 px-6 py-3 text-lg font-semibold rounded-lg shadow bg-gray-900 text-white hover:bg-gray-700 transition"
            >
              Save Username
            </button>
          </>
        )}

        {step === "DONE" && (
          <p className="text-lg text-gray-800 text-center">Redirecting...</p>
        )}
      </div>
    </div>
  );
}
