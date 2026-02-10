import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    CredentialsProvider({
      name: "email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user || !user.password) {
          throw new Error("Invalid credentials");
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
        
        if (!isPasswordValid) {
          throw new Error("Invalid credentials");
        }

        // Check if phone is verified for credentials login
        if (!user.phoneVerified) {
          throw new Error("Phone verification required");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.displayName || user.name,
          image: user.image,
          role: user.role,
          waitlistStatus: user.waitlistStatus,
          phoneVerified: user.phoneVerified
        };
      }
    })
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },

  callbacks: {
    async signIn({ user, account, profile, isNewUser }) {
      const waitlistEnabled = process.env.WAITLIST_ENABLED === 'true'
      
      if (waitlistEnabled && account?.provider === 'google') {
        // Get the user from database to check current status
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email }
        })
        
        if (dbUser) {
          // If user is an admin, make sure they're approved
          if (dbUser.role === 'ADMIN') {
            await prisma.user.update({
              where: { email: user.email },
              data: { waitlistStatus: 'APPROVED' }
            })
            
            // Try to create waitlist info if it doesn't exist (safely)
            try {
              await prisma.waitlistInfo.upsert({
                where: { userId: dbUser.id },
                update: {},
                create: {
                  userId: dbUser.id,
                  signupDate: dbUser.createdAt,
                  approvedAt: new Date(),
                  approvedBy: 'SYSTEM_ADMIN'
                }
              })
            } catch (error) {
              // Ignore if waitlistInfo table doesn't exist yet
              if (process.env.NODE_ENV === 'development') {
                console.log('WaitlistInfo table not ready yet:', error.message)
              }
            }
          } else if (isNewUser) {
            // Create waitlist info for new users (safely)
            try {
              await prisma.waitlistInfo.create({
                data: {
                  userId: dbUser.id,
                  signupDate: new Date()
                }
              })
            } catch (error) {
              // Ignore if waitlistInfo table doesn't exist yet
              if (process.env.NODE_ENV === 'development') {
                console.log('WaitlistInfo table not ready yet:', error.message)
              }
            }
          }
        }
        
        return true // Allow everyone to sign up for waitlist
      }
      
      return true // Allow all users when waitlist is disabled
    },

    async jwt({ token, user, trigger, session }) {
      // DEBUG: Log what we receive from OAuth
      console.log('[AUTH_DEBUG] JWT callback triggered', {
        hasUser: !!user,
        userRole: user?.role,
        userEmail: user?.email,
        trigger,
        tokenEmail: token?.email
      });

      if (user) {
        token.sub = user.id;
        token.email = user.email;
        token.role = user.role;
        token.displayName = user.displayName || user.name || "";
        token.image = user.image;
        token.waitlistStatus = user.waitlistStatus;

        // If user is admin, ensure they're approved
        if (user.role === 'ADMIN' && user.waitlistStatus === 'WAITLISTED') {
          token.waitlistStatus = 'APPROVED';
          // Update in database
          await prisma.user.update({
            where: { id: user.id },
            data: { waitlistStatus: 'APPROVED' }
          });
        }
      }

      if (trigger === "update") {
        if (session?.displayName) {
          token.displayName = session.displayName;
        }
        if (session?.image) {
          token.image = session.image;
        }
      }

      // ALWAYS refresh user data from database to ensure role changes are reflected
      // This ensures admin status and other permission changes are immediate
      if (token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
          select: { id: true, role: true, displayName: true, image: true, waitlistStatus: true },
        });

        console.log('[AUTH_DEBUG] Database refresh result', {
          email: token.email,
          dbUserFound: !!dbUser,
          dbUserRole: dbUser?.role,
          dbUserStatus: dbUser?.waitlistStatus
        });

        if (dbUser) {
          token.sub = dbUser.id;
          token.role = dbUser.role;
          token.displayName = dbUser.displayName || "";
          token.image = dbUser.image;
          token.waitlistStatus = dbUser.waitlistStatus;

          // If user is admin, ensure they're approved
          if (dbUser.role === 'ADMIN' && dbUser.waitlistStatus !== 'APPROVED') {
            console.log('[AUTH_DEBUG] Updating admin to APPROVED status');
            token.waitlistStatus = 'APPROVED';
            await prisma.user.update({
              where: { id: dbUser.id },
              data: { waitlistStatus: 'APPROVED' }
            });
          }
        }
      }

      console.log('[AUTH_DEBUG] Final token', {
        role: token.role,
        waitlistStatus: token.waitlistStatus,
        email: token.email
      });

      return token;
    },

    async session({ session, token }) {
      if (!token) {
        return null // No valid token, no session
      }
      
      session.user.uid = token.sub;
      session.user.role = token.role || "USER";
      session.user.displayName = token.displayName || "";
      session.user.name = token.displayName || "";
      session.user.image = token.image;
      session.user.waitlistStatus = token.waitlistStatus || "WAITLISTED";
      
      // Ensure admins are never waitlisted in the session
      if (session.user.role === 'ADMIN') {
        session.user.waitlistStatus = 'APPROVED';
      }
      
      return session;
    },
  },
};
