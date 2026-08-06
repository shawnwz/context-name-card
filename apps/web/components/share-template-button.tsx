"use client";

import { useShareIdentity } from "../lib/use-share-identity";
import type { TemplateId } from "./name-card-templates";

type Props = { identityId: string; templateId: TemplateId };

export function ShareTemplateButton({ identityId, templateId }: Props) {
  const { state, shareUrl, createShare, reset } = useShareIdentity(identityId);

  // Clipboard was blocked — show the URL so user can copy manually
  if (state === "error" && shareUrl) {
    return (
      <div className="flex items-center gap-1.5">
        <input
          readOnly
          value={shareUrl}
          onFocus={(e) => e.target.select()}
          className="text-xs border border-black/15 dark:border-white/15 rounded-md px-2 py-1 bg-transparent w-40 outline-none focus:ring-1 focus:ring-black/20 dark:focus:ring-white/20"
        />
        <button
          onClick={reset}
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
      type="button"
      onClick={() => createShare(templateId)}
      disabled={state === "loading" || state === "copied"}
      className="text-xs border border-black/15 dark:border-white/15 rounded-md px-2.5 py-1 cursor-pointer hover:bg-black/5 dark:hover:bg-white/8 transition-colors disabled:opacity-60"
    >
      {label}
    </button>
  );
}
