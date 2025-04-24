// app/api/auth/[...nextauth]/route.js
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
    // …add others if you like
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user, account }) {
      // On first sign-in, stash id, email & role in the token
      if (user && account) {
        token.sub  = user.id;
        token.email = user.email;
        token.role  = user.role;    // ← your new enum field
      }
      // If later requests have no sub, look it up by email
      if (!token.sub && token.email) {
        const u = await prisma.user.findUnique({
          where: { email: token.email },
          select: { id: true, role: true },
        });
        if (u) {
          token.sub  = u.id;
          token.role = u.role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      // Expose our DB id & role on the client
      session.user.uid  = token.sub;
      session.user.role = token.role || "USER";
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
