import NextAuth          from 'next-auth';
import GoogleProvider    from 'next-auth/providers/google';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import prisma            from '@/lib/prisma';

export const authOptions = {
  adapter : PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId    : process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  secret  : process.env.NEXTAUTH_SECRET,
  session : { strategy: 'jwt' },

  callbacks: {
    /* ──────────────── JWT ───────────────── */
    async jwt({ token, user, trigger, session }) {
      /* first sign-in (user + account present) */
      if (user) {
        token.sub         = user.id;
        token.email       = user.email;
        token.role        = user.role;          // custom role, keep if you use it
        token.displayName = user.displayName ?? user.name ?? '';
      }

      /* update() from the client: add new displayName into the token */
      if (trigger === 'update' && session?.displayName) {
        token.displayName = session.displayName;
      }

      /* fallback: look up role / id if missing (SSG edge-cases) */
      if (!token.sub && token.email) {
        const dbUser = await prisma.user.findUnique({
          where : { email: token.email },
          select: { id: true, role: true, displayName: true },
        });
        if (dbUser) {
          token.sub         = dbUser.id;
          token.role        = dbUser.role;
          token.displayName = dbUser.displayName ?? '';
        }
      }

      return token;
    },

    /* ────────────── SESSION ─────────────── */
    async session({ session, token }) {
      session.user.uid          = token.sub;
      session.user.role         = token.role ?? 'USER';
      session.user.displayName  = token.displayName ?? '';
      session.user.name         = token.displayName ?? '';   // keep .name in sync
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
