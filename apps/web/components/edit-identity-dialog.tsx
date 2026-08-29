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
  familyName: string;
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
        familyName: (form.get("familyName") as string).trim(),
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
                <Label>Given name *</Label>
                <Input
                  name="givenName"
                  type="text"
                  required
                  defaultValue={identity.givenName}
                  maxLength={NAME_MAX_LENGTH}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Family name *</Label>
                <Input
                  name="familyName"
                  type="text"
                  required
                  defaultValue={identity.familyName}
                  maxLength={NAME_MAX_LENGTH}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Additional given name</Label>
                <Input
                  name="additionalGivenName"
                  type="text"
                  defaultValue={identity.additionalGivenName ?? ""}
                  maxLength={NAME_MAX_LENGTH}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Secondary family name</Label>
                <Input
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
                  <SelectTrigger className="w-full">
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
                <Label>Display name *</Label>
                <Input
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
                <Label>Valid from *</Label>
                <Input
                  name="validFrom"
                  type="date"
                  required
                  defaultValue={toDateInput(identity.validFrom)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Valid to</Label>
                <Input name="validTo" type="date" defaultValue={toDateInput(identity.validTo)} />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Email</Label>
              <Input
                name="email"
                type="email"
                defaultValue={identity.email ?? ""}
                placeholder="jane@example.com"
                maxLength={EMAIL_MAX_LENGTH}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Description</Label>
              <Textarea
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
                <Label>Location</Label>
                <Input
                  name="location"
                  type="text"
                  defaultValue={identity.location ?? ""}
                  placeholder="San Francisco, CA"
                  maxLength={LOCATION_MAX_LENGTH}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Phone</Label>
                <Input
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
              <Label>Head image</Label>
              <Input name="headImage" type="file" accept="image/png,image/jpeg,image/webp" />
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
