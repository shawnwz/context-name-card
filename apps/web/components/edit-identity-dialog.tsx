"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { uploadIdentityHeadImage } from "../lib/upload-identity-head-image";
import { COURTESY_TITLES } from "../lib/courtesy-titles";
import {
  DESCRIPTION_MAX_LENGTH,
  NAME_MAX_LENGTH,
  LOCATION_MAX_LENGTH,
  EMAIL_MAX_LENGTH,
  TEL_MAX_LENGTH,
} from "../lib/identity-limits";
import { BackgroundPicker } from "./background-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type EditableIdentity = {
  id: string;
  contextName: string;
  courtesyTitle: string | null;
  givenName: string;
  familyName: string | null;
  additionalGivenName: string | null;
  secondaryFamilyName: string | null;
  displayName: string;
  validFrom: string;
  validTo: string | null;
  image: string | null;
  background: string | null;
  email: string | null;
  description: string | null;
  location: string | null;
  tel: string | null;
};

type Props = {
  identity: EditableIdentity;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function toDateInput(iso: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

// Triggered from IdentityActionsMenu's dropdown item, not its own button.
export function EditIdentityDialog({ identity, open, onOpenChange }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleClose() {
    onOpenChange(false);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget);

    const validTo = (form.get("validTo") as string).trim();
    const familyName = (form.get("familyName") as string).trim();
    const additionalGivenName = (form.get("additionalGivenName") as string).trim();
    const secondaryFamilyName = (form.get("secondaryFamilyName") as string).trim();
    const email = (form.get("email") as string).trim();
    const description = (form.get("description") as string).trim();
    const location = (form.get("location") as string).trim();
    const tel = (form.get("tel") as string).trim();
    const background = (form.get("background") as string) || null;
    const headImage = form.get("headImage");

    const res = await fetch(`/api/proxy/identities/${identity.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        courtesyTitle: (form.get("courtesyTitle") as string) || null,
        givenName: (form.get("givenName") as string).trim(),
        familyName: familyName || null,
        displayName: (form.get("displayName") as string).trim(),
        validFrom: form.get("validFrom") as string,
        additionalGivenName: additionalGivenName || null,
        secondaryFamilyName: secondaryFamilyName || null,
        validTo: validTo || null,
        email: email || null,
        description: description || null,
        location: location || null,
        tel: tel || null,
        background,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Failed to update identity");
      setLoading(false);
      return;
    }

    if (headImage instanceof File && headImage.size > 0) {
      try {
        await uploadIdentityHeadImage(identity.id, headImage);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to upload head image",
        );
        setLoading(false);
        return;
      }
    }

    handleClose();
    setLoading(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : handleClose())}>
      <DialogContent className="grid-rows-[auto_1fr] gap-0 p-0 sm:max-w-lg max-h-[90vh]">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle>Edit Identity</DialogTitle>
          <DialogDescription>Context: {identity.contextName}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-col">
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 py-4">
            {/* Name fields */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-given-name">Given name *</Label>
                <Input
                  id="edit-given-name"
                  name="givenName"
                  type="text"
                  required
                  defaultValue={identity.givenName}
                  maxLength={NAME_MAX_LENGTH}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-family-name">Family name</Label>
                <Input
                  id="edit-family-name"
                  name="familyName"
                  type="text"
                  defaultValue={identity.familyName ?? ""}
                  maxLength={NAME_MAX_LENGTH}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-additional-given-name">Additional given name</Label>
                <Input
                  id="edit-additional-given-name"
                  name="additionalGivenName"
                  type="text"
                  defaultValue={identity.additionalGivenName ?? ""}
                  maxLength={NAME_MAX_LENGTH}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-secondary-family-name">Secondary family name</Label>
                <Input
                  id="edit-secondary-family-name"
                  name="secondaryFamilyName"
                  type="text"
                  defaultValue={identity.secondaryFamilyName ?? ""}
                  maxLength={NAME_MAX_LENGTH}
                />
              </div>
            </div>

            <div className="grid grid-cols-[100px_1fr] gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Title</Label>
                <Select name="courtesyTitle" defaultValue={identity.courtesyTitle ?? ""}>
                  <SelectTrigger className="w-full" aria-label="Title">
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">—</SelectItem>
                    {COURTESY_TITLES.map((title) => (
                      <SelectItem key={title} value={title}>
                        {title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-display-name">Display name *</Label>
                <Input
                  id="edit-display-name"
                  name="displayName"
                  type="text"
                  required
                  defaultValue={identity.displayName}
                  maxLength={NAME_MAX_LENGTH}
                />
              </div>
            </div>

            {/* Validity */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-valid-from">Valid from *</Label>
                <Input
                  id="edit-valid-from"
                  name="validFrom"
                  type="date"
                  required
                  defaultValue={toDateInput(identity.validFrom)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-valid-to">Valid to</Label>
                <Input id="edit-valid-to" name="validTo" type="date" defaultValue={toDateInput(identity.validTo)} />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                name="email"
                type="email"
                defaultValue={identity.email ?? ""}
                placeholder="jane@example.com"
                maxLength={EMAIL_MAX_LENGTH}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                name="description"
                defaultValue={identity.description ?? ""}
                placeholder="A short bio or note about this identity"
                rows={3}
                maxLength={DESCRIPTION_MAX_LENGTH}
                className="resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-location">Location</Label>
                <Input
                  id="edit-location"
                  name="location"
                  type="text"
                  defaultValue={identity.location ?? ""}
                  placeholder="San Francisco, CA"
                  maxLength={LOCATION_MAX_LENGTH}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-tel">Phone</Label>
                <Input
                  id="edit-tel"
                  name="tel"
                  type="tel"
                  defaultValue={identity.tel ?? ""}
                  placeholder="+1 555 123 4567"
                  maxLength={TEL_MAX_LENGTH}
                />
              </div>
            </div>

            {/* Image */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-head-image">Head image</Label>
              <Input id="edit-head-image" name="headImage" type="file" accept="image/png,image/jpeg,image/webp" />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Card background (used by the Cover template)</Label>
              <BackgroundPicker defaultValue={identity.background} />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 border-t bg-muted/50 px-6 py-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
