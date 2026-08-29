"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

type Props = {
  identityId: string;
  displayName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// Confirmation only — triggered from IdentityActionsMenu's dropdown item,
// not its own button.
export function DeleteIdentityAlert({ identityId, displayName, open, onOpenChange }: Props) {
  const router = useRouter();
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
      onOpenChange(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>
            Delete {displayName ?? "this identity"}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This permanently deletes the identity and revokes every share link
            created for it. This can&apos;t be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" disabled={loading} onClick={handleDelete}>
            {loading ? "Deleting…" : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
