import NextAuth, { type NextAuthResult, type DefaultSession } from 'next-auth';
import Resend from "next-auth/providers/resend";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@repo/database";

declare module "next-auth" {
  interface Session {
    user: { id: string } & DefaultSession["user"];
  }
}

const result: NextAuthResult = NextAuth({
  adapter: PrismaAdapter(prisma),
  trustHost: true,
  providers: [
    Google({ allowDangerousEmailAccountLinking: true }),  //google and github are safe to link
    GitHub({ allowDangerousEmailAccountLinking: true }),
    Resend({
      from: 'noreply@contextid.app',
      // Auth.js's default Email/Resend flow signs the user in — and
      // consumes the one-time token — on the very first GET to the
      // callback URL. Email security scanners (Microsoft Safe Links,
      // Google Safe Browsing, etc.) pre-fetch links in incoming mail
      // before the recipient ever opens it, which burns that token before
      // the real click arrives ("sign in link is no longer valid").
      // Sending the emailed link to our own confirmation page instead —
      // which requires an actual click before it ever touches the real
      // callback URL — defeats that: an automated prefetch just loads an
      // inert page, nothing is consumed.
      async sendVerificationRequest({ identifier: to, url, provider }) {
        const { host, search } = new URL(url);
        const confirmUrl = new URL('/verify-email', new URL(url).origin);
        confirmUrl.search = search; // carries token, email, callbackUrl

        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${provider.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: provider.from,
            to,
            subject: `Sign in to ${host}`,
            text: `Sign in to ${host}\n${confirmUrl.toString()}\n\nThis link brings you to a confirmation page — click through there to finish signing in. If you did not request this email you can safely ignore it.\n`,
            html: `
              <body style="background:#f9f9f9;font-family:Helvetica,Arial,sans-serif;">
                <table width="100%" border="0" cellspacing="20" cellpadding="0" style="background:#fff;max-width:600px;margin:auto;border-radius:10px;">
                  <tr><td align="center" style="padding:10px 0;font-size:22px;color:#444;">
                    Sign in to <strong>${host}</strong>
                  </td></tr>
                  <tr><td align="center" style="padding:20px 0;">
                    <a href="${confirmUrl.toString()}" target="_blank"
                      style="font-size:18px;color:#fff;text-decoration:none;border-radius:5px;padding:10px 20px;border:1px solid #346df1;background:#346df1;display:inline-block;font-weight:bold;">
                      Sign in
                    </a>
                  </td></tr>
                  <tr><td align="center" style="padding:0 24px 10px;font-size:14px;line-height:20px;color:#777;">
                    You'll see one more confirmation step before you're signed in.
                  </td></tr>
                  <tr><td align="center" style="padding:0 0 10px;font-size:16px;line-height:22px;color:#444;">
                    If you did not request this email you can safely ignore it.
                  </td></tr>
                </table>
              </body>
            `,
          }),
        });

        if (!res.ok) {
          throw new Error('Resend error: ' + JSON.stringify(await res.json()));
        }
      },
    }),
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
