"use client";

import { useEffect, useRef, useState } from "react";
import { TEMPLATES, type TemplateId } from "./name-card-templates";

type Props = { identityId: string };
type State = "idle" | "picking" | "loading" | "copied" | "error";

export function ShareIdentityButton({ identityId }: Props) {
  const [state, setState] = useState<State>("idle");
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state !== "picking") return;

    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setState("idle");
      }
    }

    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [state]);

  async function handleCreate(template: TemplateId) {
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
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setState((s) => (s === "picking" ? "idle" : "picking"))}
        disabled={state === "loading" || state === "copied"}
        className="text-xs border border-black/15 dark:border-white/15 rounded-md px-2.5 py-1 cursor-pointer hover:bg-black/5 dark:hover:bg-white/8 transition-colors disabled:opacity-60"
      >
        {label}
      </button>

      {state === "picking" && (
        <div className="absolute right-0 top-full mt-1.5 z-20 w-44 bg-white dark:bg-neutral-900 border border-black/10 dark:border-white/10 rounded-lg shadow-lg p-1.5 flex flex-col gap-0.5">
          <p className="text-[11px] text-black/40 dark:text-white/40 px-2 py-1">
            Choose a look
          </p>
          {(Object.entries(TEMPLATES) as [TemplateId, (typeof TEMPLATES)[TemplateId]][]).map(
            ([id, template]) => (
              <button
                key={id}
                type="button"
                onClick={() => handleCreate(id)}
                className="flex items-center gap-2 text-xs text-left px-2 py-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/8 transition-colors cursor-pointer"
              >
                <span
                  className="size-3 rounded-full shrink-0 ring-1 ring-black/10 dark:ring-white/15"
                  style={{ backgroundColor: template.swatch }}
                />
                {template.label}
              </button>
            ),
          )}
        </div>
      )}
    </div>
  );
}
