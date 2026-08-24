import Link from "next/link";
import { DotGridBackground } from "../../../components/dot-grid-background";
import { LogoMark } from "../../../components/logo-mark";

// Sits between the emailed magic link and Auth.js's real callback route.
// Auth.js signs the user in — and consumes the one-time token — on the
// first GET to /api/auth/callback/resend, so email security scanners
// (Microsoft Safe Links, Google Safe Browsing, etc.) that pre-fetch links
// in incoming mail burn the token before the recipient ever clicks it.
// This page just renders an inert confirmation button; only an actual
// click carries the token through to the real callback URL, which
// automated prefetchers don't do.
export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; email?: string; callbackUrl?: string }>;
}) {
  const { token, email, callbackUrl } = await searchParams;
  const isValid = Boolean(token && email);

  const confirmHref = isValid
    ? `/api/auth/callback/resend?${new URLSearchParams({
        token: token!,
        email: email!,
        ...(callbackUrl ? { callbackUrl } : {}),
      })}`
    : undefined;

  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-gradient-to-br from-purple-950 via-purple-900 to-violet-800">
      <DotGridBackground vignette />

      <div
        aria-hidden="true"
        className="absolute size-[420px] rounded-full bg-violet-500/25 blur-[110px]"
      />

      <div className="relative z-10 flex flex-col items-center px-6 py-16 text-center">
        <LogoMark />
        <h1 className="mt-6 text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Confirm it&apos;s you
        </h1>
        <p className="mt-3 max-w-sm text-white/55">
          {isValid
            ? "Click below to finish signing in. This extra step keeps automated email scanners from using up your sign-in link before you do."
            : "This sign-in link is missing some information — it may have been altered. Request a new one to try again."}
        </p>

        {isValid ? (
          <a
            href={confirmHref}
            className="mt-8 bg-white text-purple-950 rounded-lg px-8 py-3 text-base font-semibold cursor-pointer hover:opacity-90 transition-opacity"
          >
            Sign in
          </a>
        ) : (
          <Link
            href="/"
            className="mt-8 bg-white text-purple-950 rounded-lg px-8 py-3 text-base font-semibold hover:opacity-90 transition-opacity"
          >
            Back to sign in
          </Link>
        )}
      </div>
    </div>
  );
}
