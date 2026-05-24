import NextAuth, { type NextAuthResult } from 'next-auth';
import Resend from "next-auth/providers/resend";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@repo/database";

const result: NextAuthResult = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Resend({ from: 'onboarding@resend.dev' }),
  ],
});

export const { handlers, signIn, signOut, auth } = result;
