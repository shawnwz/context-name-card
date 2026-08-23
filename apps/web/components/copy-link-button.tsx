"use client";

import { useState } from "react";

export function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked — nothing to fall back to here, the raw URL is
      // already shown next to this button for manual copying.
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="w-full text-sm font-medium border border-black/15 dark:border-white/15 rounded-lg px-4 py-2.5 cursor-pointer hover:bg-black/5 dark:hover:bg-white/8 transition-colors"
    >
      {copied ? "Copied!" : "Copy Link"}
    </button>
  );
}
