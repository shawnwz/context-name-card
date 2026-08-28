"use client";

import { X } from "lucide-react";
import { useShareIdentity } from "../lib/use-share-identity";
import type { TemplateId } from "./name-card-templates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = { identityId: string; templateId: TemplateId };

export function ShareTemplateButton({ identityId, templateId }: Props) {
  const { state, shareUrl, createShare, reset } = useShareIdentity(identityId);

  // Clipboard was blocked — show the URL so user can copy manually
  if (state === "error" && shareUrl) {
    return (
      <div className="flex items-center gap-1.5">
        <Input
          readOnly
          value={shareUrl}
          onFocus={(e) => e.target.select()}
          className="h-7 w-40 text-xs"
        />
        <Button variant="ghost" size="icon-xs" onClick={reset}>
          <X />
        </Button>
      </div>
    );
  }

  const label =
    state === "loading" ? "Sharing…"
    : state === "copied" ? "Link copied!"
    : state === "error"  ? "Failed"
    : "Share";

  return (
    <Button
      type="button"
      variant="outline"
      size="xs"
      onClick={() => createShare(templateId)}
      disabled={state === "loading" || state === "copied"}
    >
      {label}
    </Button>
  );
}
