import "./globals.css";
import Nav from "@/components/common/Nav";
import AuthGuard from "@/components/common/AuthGuard";
import AppClientInitializer from "@/components/common/AppClientInitializer"; // 👈

export const metadata = {
  title: "Ploosh",
  description: "Create and discover AI plushies",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AppClientInitializer /> {/* 👈 Fixes Modal issue safely */}
        <Nav />
        <AuthGuard>{children}</AuthGuard>
      </body>
    </html>
  );
}
