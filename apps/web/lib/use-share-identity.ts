"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { TemplateId } from "../components/name-card-templates";

type State = "idle" | "loading" | "copied" | "error";

export function useShareIdentity(identityId: string) {
  const router = useRouter();
  const [state, setState] = useState<State>("idle");
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  async function createShare(template: TemplateId) {
    setState("loading");

    const res = await fetch(`/api/proxy/identities/${identityId}/shares`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ template }),
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
      // Refresh once the "copied" confirmation has had its moment — the
      // gallery is server-rendered, so this is what flips the button to
      // "✓ Shared" now that a share actually exists for this template.
      setTimeout(() => {
        setState("idle");
        router.refresh();
      }, 2000);
    } catch {
      // Clipboard blocked — show fallback URL instead. The share still
      // exists, so refresh happens on `reset` once the user dismisses it.
      setState("error");
    }
  }

  function reset() {
    setState("idle");
    setShareUrl(null);
    router.refresh();
  }

  return { state, shareUrl, createShare, reset };
}
