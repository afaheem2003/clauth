"use client";

export default function Footer() {
  return (
    <footer className="bg-gray-200 py-6 text-center">
      <p className="text-gray-700 text-sm md:text-base">
        © {new Date().getFullYear()} Clauth. All rights reserved.
      </p>
    </footer>
  );
}
