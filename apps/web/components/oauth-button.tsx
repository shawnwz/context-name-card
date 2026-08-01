"use client";

import { useFormStatus } from "react-dom";
import { Spinner } from "./spinner";

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
