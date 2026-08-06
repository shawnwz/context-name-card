"use client";

import { useState } from "react";
import type { TemplateId } from "../components/name-card-templates";

type State = "idle" | "loading" | "copied" | "error";

export function useShareIdentity(identityId: string) {
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
      setTimeout(() => setState("idle"), 2000);
    } catch {
      // Clipboard blocked — show fallback URL instead
      setState("error");
    }
  }

  function reset() {
    setState("idle");
    setShareUrl(null);
  }

  return { state, shareUrl, createShare, reset };
}
