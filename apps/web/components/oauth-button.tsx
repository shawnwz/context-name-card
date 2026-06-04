"use client";

import { useFormStatus } from "react-dom";

export function OAuthButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full flex items-center justify-center gap-3 border border-black/15 dark:border-white/15 rounded-lg px-4 py-2.5 text-sm font-medium cursor-pointer hover:bg-black/5 dark:hover:bg-white/8 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {pending ? <Spinner /> : children}
    </button>
  );
}

function Spinner() {
  return (
    <svg
      className="animate-spin h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      aria-label="Loading"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
