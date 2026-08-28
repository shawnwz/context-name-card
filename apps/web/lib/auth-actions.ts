"use server";

import { signIn } from "../auth";

// Split out into a server-only module (rather than inline actions in
// sign-in.tsx) because sign-in.tsx needs to be a Client Component — it
// tracks one shared "which provider is submitting" state across all three
// sign-in methods, so clicking Google also disables GitHub and the email
// form instead of leaving them clickable while the redirect is in flight.

export async function signInWithGoogle() {
  await signIn("google", { redirectTo: "/" });
}

export async function signInWithGitHub() {
  await signIn("github", { redirectTo: "/" });
}

export async function signInWithEmail(formData: FormData) {
  await signIn("resend", { ...Object.fromEntries(formData), redirectTo: "/" });
}
