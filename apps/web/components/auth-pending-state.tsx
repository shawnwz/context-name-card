import { Spinner } from "./spinner";

export type AuthProvider = "google" | "github" | "email";

const LABEL: Record<AuthProvider, string> = {
  google: "Redirecting to Google…",
  github: "Redirecting to GitHub…",
  email: "Sending your sign-in link…",
};

// Swapped in for the whole sign-in method list once one of them is
// submitting — replacing the buttons entirely instead of leaving them all
// visible-but-disabled, so there's nothing left to click while it's in
// flight.
export function AuthPendingState({ provider }: { provider: AuthProvider }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10 text-white/70">
      <Spinner className="h-6 w-6" />
      <p className="text-sm">{LABEL[provider]}</p>
    </div>
  );
}
