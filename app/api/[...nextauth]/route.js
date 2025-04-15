import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/app/lib/prisma";

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    // Add more providers as needed
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    // 1) The `jwt` callback
    async jwt({ token, user, account }) {
      // If it's the initial sign-in, user & account are available
      if (account && user) {
        // Use the DB user ID that Prisma Adapter sets
        token.sub = user.id;
      }
      return token;
    },

    // 2) The `session` callback
    async session({ session, token }) {
      // Attach DB user ID to session
      if (token?.sub) {
        session.user.uid = token.sub;
      }
      return session;
    },
  },
};

// Export NextAuth routes for Next.js app router
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
