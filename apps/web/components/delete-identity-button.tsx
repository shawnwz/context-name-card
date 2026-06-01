"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = { identityId: string };

export function DeleteIdentityButton({ identityId }: Props) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    const res = await fetch(`/api/proxy/identities/${identityId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      router.refresh();
    } else {
      setLoading(false);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-black/50 dark:text-white/50">Sure?</span>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="text-xs text-red-500 dark:text-red-400 cursor-pointer hover:underline disabled:opacity-50"
        >
          {loading ? "Deleting…" : "Yes"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-xs text-black/40 dark:text-white/40 cursor-pointer hover:underline"
        >
          No
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-xs border border-red-200 dark:border-red-900 text-red-500 dark:text-red-400 rounded-md px-2.5 py-1 cursor-pointer hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
    >
      Delete
    </button>
  );
}
