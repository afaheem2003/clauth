"use client";

import { useState } from "react";
import Link from "next/link";

export default function CreateDesignPage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log({ name, description, imageFile });
  };

  return (
    <section className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 flex items-center justify-center relative">
      <div className="absolute inset-0 bg-[url('/images/studio-bg.jpg')] bg-cover bg-center opacity-10 pointer-events-none" />
      <div className="container mx-auto px-6 py-16">
        <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-2xl border border-gray-200 p-10">
          <h1 className="text-5xl font-extrabold text-gray-800 text-center mb-4">
            Create Your Plushie Design
          </h1>
          <p className="text-lg text-gray-600 text-center mb-8">
            Unleash your creativity and bring your plushie vision to life.
          </p>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-2">
                Design Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter design name"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800"
              />
            </div>
            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your plushie"
                rows="5"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800"
              />
            </div>
            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-2">
                Upload Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files[0])}
                required
                className="w-full text-sm"
              />
            </div>
            <button
              type="submit"
              className="w-full mt-4 py-3 bg-gray-900 text-white text-lg font-semibold rounded-full hover:bg-gray-700 transition-colors"
            >
              Submit Design
            </button>
          </form>
          <div className="mt-8 text-center">
            <Link
              href="/"
              className="text-gray-800 underline hover:text-gray-600"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
