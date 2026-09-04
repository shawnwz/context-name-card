"use client";

import { useId, useState } from "react";
import { signOut } from "next-auth/react";
import { TriangleAlert } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  userId: string;
  email: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// Confirmation only — triggered from AccountActionsMenu's dropdown item,
// not its own button (matches DeleteIdentityAlert's pattern).
export function DeleteAccountAlert({ userId, email, open, onOpenChange }: Props) {
  const confirmInputId = useId();
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const confirmed = confirmText === email;

  function handleOpenChange(next: boolean) {
    if (!next) {
      setConfirmText("");
      setLoading(false);
      setError(false);
    }
    onOpenChange(next);
  }

  async function handleDelete() {
    if (!confirmed) return;
    setLoading(true);
    setError(false);
    const res = await fetch(`/api/proxy/users/${userId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      await signOut({ redirectTo: "/" });
    } else {
      setLoading(false);
      setError(true);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive">
            <TriangleAlert />
          </AlertDialogMedia>
          <AlertDialogTitle>Delete your account?</AlertDialogTitle>
          <AlertDialogDescription>
            <span className="block font-medium text-destructive">
              This cannot be undone.
            </span>
            Your account, every identity, every share link, and every
            uploaded photo will be permanently deleted immediately — nothing
            is recoverable after this, and revoked share links stop working
            right away.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="grid gap-1.5">
          <Label htmlFor={confirmInputId}>
            Type <span className="font-semibold">{email}</span> to confirm
          </Label>
          <Input
            id={confirmInputId}
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
          />
          {error && (
            <p className="text-sm text-destructive">
              Something went wrong. Please try again.
            </p>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={!confirmed || loading}
            onClick={handleDelete}
          >
            {loading ? "Deleting…" : "Delete account"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
