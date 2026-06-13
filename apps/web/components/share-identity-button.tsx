"use client";

import { useState } from "react";

type Props = { identityId: string };
type State = "idle" | "loading" | "copied" | "error";

export function ShareIdentityButton({ identityId }: Props) {
  const [state, setState] = useState<State>("idle");
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  async function handleShare() {
    setState("loading");

    const res = await fetch(`/api/proxy/identities/${identityId}/shares`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });

    if (!res.ok) {
      setState("error");
      setTimeout(() => setState("idle"), 2000);
      return;
    }

    const share = await res.json();
    const url = `${window.location.origin}/share/${share.token}`;
    setShareUrl(url);

    try {
      await navigator.clipboard.writeText(url);
      setState("copied");
      setTimeout(() => setState("idle"), 2000);
    } catch {
      // Clipboard blocked — show fallback URL instead
      setState("error");
    }
  }

  // Clipboard was blocked — show the URL so user can copy manually
  if (state === "error" && shareUrl) {
    return (
      <div className="flex items-center gap-1.5">
        <input
          readOnly
          value={shareUrl}
          onFocus={(e) => e.target.select()}
          className="text-xs border border-black/15 dark:border-white/15 rounded-md px-2 py-1 bg-transparent w-44 outline-none focus:ring-1 focus:ring-black/20 dark:focus:ring-white/20"
        />
        <button
          onClick={() => { setState("idle"); setShareUrl(null); }}
          className="text-xs text-black/40 dark:text-white/40 cursor-pointer hover:text-black/70 dark:hover:text-white/70"
        >
          ✕
        </button>
      </div>
    );
  }

  const label =
    state === "loading" ? "Sharing…"
    : state === "copied" ? "Link copied!"
    : state === "error"  ? "Failed"
    : "Share";

  return (
    <button
      onClick={handleShare}
      disabled={state === "loading" || state === "copied"}
      className="text-xs border border-black/15 dark:border-white/15 rounded-md px-2.5 py-1 cursor-pointer hover:bg-black/5 dark:hover:bg-white/8 transition-colors disabled:opacity-60"
    >
      {label}
    </button>
  );
}
