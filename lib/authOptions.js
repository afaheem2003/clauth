import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/prisma";

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.sub = user.id;
        token.email = user.email;
        token.role = user.role;
        token.displayName = user.displayName || user.name || "";
      }

      if (trigger === "update" && session?.displayName) {
        token.displayName = session.displayName;
      }

      if (!token.sub && token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
          select: { id: true, role: true, displayName: true },
        });
        if (dbUser) {
          token.sub = dbUser.id;
          token.role = dbUser.role;
          token.displayName = dbUser.displayName || "";
        }
      }

      return token;
    },

    async session({ session, token }) {
      session.user.uid = token.sub;
      session.user.role = token.role || "USER";
      session.user.displayName = token.displayName || "";
      session.user.name = token.displayName || "";
      return session;
    },
  },
};
