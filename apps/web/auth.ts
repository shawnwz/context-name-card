import NextAuth, { type NextAuthResult, type DefaultSession } from 'next-auth';
import Resend from "next-auth/providers/resend";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@repo/database";

declare module "next-auth" {
  interface Session {
    user: { id: string } & DefaultSession["user"];
  }
}

const result: NextAuthResult = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Resend({ from: 'onboarding@resend.dev' }),
  ],
  session: {
    maxAge: 5 * 60,  // expire after 5 min of inactivity
    updateAge: 60,   // extend whenever auth() runs and 60s have passed
  },
  callbacks: {
    session({ session, user }) {
      session.user.id = user.id;
      return session;
    },
  },
});

export const { handlers, signIn, signOut, auth } = result;
