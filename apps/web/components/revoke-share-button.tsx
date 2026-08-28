"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Props = { token: string; identityName?: string };

export function RevokeShareButton({ token, identityName }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleRevoke() {
    setLoading(true);
    const res = await fetch(`/api/proxy/shares/${token}`, { method: "DELETE" });
    if (res.ok) {
      router.refresh();
    } else {
      setLoading(false);
      setOpen(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <Button variant="destructive" size="xs" onClick={() => setOpen(true)}>
        Revoke
      </Button>

      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>Revoke this share link?</AlertDialogTitle>
          <AlertDialogDescription>
            {identityName ? `Anyone with this link to ${identityName}` : "Anyone with this link"}{" "}
            will immediately lose access. This can&apos;t be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" disabled={loading} onClick={handleRevoke}>
            {loading ? "Revoking…" : "Revoke"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
