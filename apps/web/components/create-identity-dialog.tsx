"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { uploadIdentityHeadImage } from "../lib/upload-identity-head-image";
import { COURTESY_TITLES } from "../lib/courtesy-titles";
import {
  DESCRIPTION_MAX_LENGTH,
  NAME_MAX_LENGTH,
  LOCATION_MAX_LENGTH,
  EMAIL_MAX_LENGTH,
  TEL_MAX_LENGTH,
  CONTEXT_NAME_MAX_LENGTH,
} from "../lib/identity-limits";
import { BackgroundPicker } from "./background-picker";
import {
  TEMPLATES,
  DEFAULT_TEMPLATE,
  type TemplateId,
  type NameCardIdentity,
} from "./name-card-templates";
import {
  getPlaceholderHeadImage,
  toCssImageUrl,
} from "../lib/placeholder-heads";
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
  DialogHeader,
} from "@/components/ui/dialog";

type Context = { id: string; name: string };

type Props = {
  userId: string;
  systemContexts: Context[];
  userContexts: Context[];
};

type ContextStep = {
  contextId: string; // "__new__" when creating
  newContextName: string;
};

type NamesStep = {
  courtesyTitle: string;
  givenName: string;
  familyName: string;
  additionalGivenName: string;
  secondaryFamilyName: string;
  displayName: string;
  displayNameTouched: boolean;
  email: string;
  description: string;
  location: string;
  tel: string;
  validFrom: string;
  validTo: string;
};

// Small group captions that aren't a single field's <label> (e.g. "Legal
// name" above a 2x2 grid of inputs) — real field labels use <Label>.
const captionClass =
  "block text-xs font-medium text-black/60 dark:text-white/60 mb-1";

// ─── Step indicator ──────────────────────────────────────────────────────────

function Steps({ current }: { current: 1 | 2 }) {
  const labels = ["Context", "Name card"];
  return (
    <div className="flex items-center gap-2">
      {labels.map((label, i) => {
        const step = (i + 1) as 1 | 2;
        const done = step < current;
        const active = step === current;
        return (
          <div key={step} className="flex items-center gap-2">
            {i > 0 && (
              <div
                className={`h-px w-6 ${done ? "bg-black/40 dark:bg-white/40" : "bg-black/10 dark:bg-white/10"}`}
              />
            )}
            <div className="flex items-center gap-1.5">
              <div
                className={`size-5 rounded-full flex items-center justify-center text-[11px] font-semibold transition-colors ${
                  active
                    ? "bg-[var(--foreground)] text-[var(--background)]"
                    : done
                      ? "bg-black/15 dark:bg-white/15 text-black/60 dark:text-white/60"
                      : "bg-black/8 dark:bg-white/8 text-black/30 dark:text-white/30"
                }`}
              >
                {done ? "✓" : step}
              </div>
              <span
                className={`text-xs ${active ? "font-medium" : "text-black/40 dark:text-white/40"}`}
              >
                {label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Step 1: Context ─────────────────────────────────────────────────────────

function ContextStep({
  systemContexts,
  userContexts,
  data,
  onChange,
}: {
  systemContexts: Context[];
  userContexts: Context[];
  data: ContextStep;
  onChange: (d: ContextStep) => void;
}) {
  const allContexts = [
    ...systemContexts.map((c) => ({ ...c, group: "Standard" })),
    ...userContexts.map((c) => ({ ...c, group: "Custom" })),
  ];

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-black/50 dark:text-white/50">
        Choose the context this identity belongs to.
      </p>

      <div className="grid grid-cols-2 gap-2">
        {allContexts.map((ctx) => (
          <button
            key={ctx.id}
            type="button"
            onClick={() => onChange({ ...data, contextId: ctx.id })}
            className={`text-left px-4 py-3 rounded-xl border text-sm font-medium transition-colors cursor-pointer ${
              data.contextId === ctx.id
                ? "border-black/50 dark:border-white/50 bg-black/5 dark:bg-white/5"
                : "border-black/10 dark:border-white/10 hover:border-black/25 dark:hover:border-white/25"
            }`}
          >
            <span>{ctx.name}</span>
            <span className="block text-[11px] font-normal text-black/30 dark:text-white/30 mt-0.5">
              {ctx.group}
            </span>
          </button>
        ))}

        {/* New context card */}
        <button
          type="button"
          onClick={() => onChange({ ...data, contextId: "__new__" })}
          className={`text-left px-4 py-3 rounded-xl border text-sm font-medium transition-colors cursor-pointer ${
            data.contextId === "__new__"
              ? "border-black/50 dark:border-white/50 bg-black/5 dark:bg-white/5"
              : "border-dashed border-black/20 dark:border-white/20 hover:border-black/40 dark:hover:border-white/40 text-black/50 dark:text-white/50"
          }`}
        >
          + New context
        </button>
      </div>

      {data.contextId === "__new__" && (
        <div className="flex flex-col gap-1.5">
          <Label>Context name</Label>
          <Input
            autoFocus
            type="text"
            value={data.newContextName}
            onChange={(e) =>
              onChange({ ...data, newContextName: e.target.value })
            }
            placeholder="e.g. Freelance, Gaming"
            maxLength={CONTEXT_NAME_MAX_LENGTH}
          />
        </div>
      )}
    </div>
  );
}

// ─── Step 2: Name card ──────────────────────────────────────────────────────

function NameCardStep({
  identityId,
  data,
  onChange,
  file,
  onFileChange,
  background,
  onBackgroundChange,
}: {
  identityId: string;
  data: NamesStep;
  onChange: (d: NamesStep) => void;
  file: File | null;
  onFileChange: (f: File | null) => void;
  background: string | null;
  onBackgroundChange: (b: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<TemplateId>(DEFAULT_TEMPLATE);

  useEffect(() => {
    if (!file) { setPreview(null); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const avatarSrc = preview ?? getPlaceholderHeadImage(identityId, data.displayName);

  function set(field: keyof NamesStep, value: string | boolean) {
    const next = { ...data, [field]: value };

    // Auto-fill display name until the user edits it manually
    if (
      (field === "givenName" || field === "familyName") &&
      !next.displayNameTouched
    ) {
      next.displayName = [next.givenName, next.familyName]
        .filter(Boolean)
        .join(" ");
    }

    onChange(next);
  }

  // Feeds the live preview below — the exact same component the public
  // share page renders for this template, so it can't drift from reality.
  const draftIdentity: NameCardIdentity = {
    id: identityId,
    courtesyTitle: data.courtesyTitle || null,
    displayName: data.displayName.trim() || "Display name",
    image: preview,
    background,
    email: data.email.trim() || null,
    description: data.description.trim() || null,
    location: data.location.trim() || null,
    tel: data.tel.trim() || null,
  };

  const { Card, pageClass } = TEMPLATES[previewTemplate];

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-black/50 dark:text-white/50">
        This is exactly how the card looks when shared. The template below is
        just a preview — you pick which one to actually share later.
      </p>

      {/* Template switcher — preview only, doesn't set the identity's template */}
      <div className="flex gap-1.5">
        {(Object.keys(TEMPLATES) as TemplateId[]).map((id) => {
          const active = id === previewTemplate;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setPreviewTemplate(id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                active
                  ? "border-black/50 dark:border-white/50 bg-black/5 dark:bg-white/5"
                  : "border-black/10 dark:border-white/10 text-black/50 dark:text-white/50 hover:border-black/25 dark:hover:border-white/25"
              }`}
            >
              {TEMPLATES[id].label}
            </button>
          );
        })}
      </div>

      {/* Live preview — the real template component */}
      <div className={`rounded-2xl p-6 flex items-center justify-center ${pageClass}`}>
        <Card identity={draftIdentity} />
      </div>

      {/* Photo */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="relative group cursor-pointer shrink-0"
        >
          <div
            className="size-14 rounded-full bg-cover bg-center ring-1 ring-black/10 dark:ring-white/15"
            style={{ backgroundImage: toCssImageUrl(avatarSrc) }}
          />
          <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[9px] font-medium text-center px-1">
            {file ? "Change" : "Add photo"}
          </div>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
        />
        {file && (
          <button
            type="button"
            onClick={() => onFileChange(null)}
            className="text-xs text-black/40 dark:text-white/40 hover:text-black/70 dark:hover:text-white/70 cursor-pointer"
          >
            Remove photo
          </button>
        )}
      </div>

      {previewTemplate === "cover" && (
        <div>
          <p className={captionClass}>Card background</p>
          <BackgroundPicker value={background} onChange={onBackgroundChange} />
        </div>
      )}

      {/* Card content */}
      <div className="grid grid-cols-[100px_1fr] gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>Title</Label>
          <Select
            value={data.courtesyTitle}
            onValueChange={(value) => onChange({ ...data, courtesyTitle: value ?? "" })}
          >
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
            type="text"
            value={data.displayName}
            onChange={(e) =>
              onChange({
                ...data,
                displayName: e.target.value,
                displayNameTouched: true,
              })
            }
            placeholder="Display name"
            maxLength={NAME_MAX_LENGTH}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Location</Label>
        <Input
          type="text"
          value={data.location}
          onChange={(e) => onChange({ ...data, location: e.target.value })}
          placeholder="San Francisco, CA"
          maxLength={LOCATION_MAX_LENGTH}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>Email</Label>
          <Input
            type="email"
            value={data.email}
            onChange={(e) => onChange({ ...data, email: e.target.value })}
            placeholder="jane@example.com"
            maxLength={EMAIL_MAX_LENGTH}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Phone</Label>
          <Input
            type="tel"
            value={data.tel}
            onChange={(e) => onChange({ ...data, tel: e.target.value })}
            placeholder="+1 555 123 4567"
            maxLength={TEL_MAX_LENGTH}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between">
          <Label>Description</Label>
          <span className="text-xs text-black/40 dark:text-white/40">
            {data.description.length}/{DESCRIPTION_MAX_LENGTH}
          </span>
        </div>
        <Textarea
          value={data.description}
          onChange={(e) => onChange({ ...data, description: e.target.value })}
          placeholder="A short bio or note about this identity"
          rows={2}
          maxLength={DESCRIPTION_MAX_LENGTH}
          className="resize-none"
        />
      </div>

      {/* Legal name — required for the identity record, kept secondary to the card */}
      <div>
        <p className={captionClass}>Legal name</p>
        <div className="grid grid-cols-2 gap-3">
          <Input
            type="text"
            value={data.givenName}
            onChange={(e) => set("givenName", e.target.value)}
            placeholder="Given name *"
            maxLength={NAME_MAX_LENGTH}
          />
          <Input
            type="text"
            value={data.familyName}
            onChange={(e) => set("familyName", e.target.value)}
            placeholder="Family name *"
            maxLength={NAME_MAX_LENGTH}
          />
          <Input
            type="text"
            value={data.additionalGivenName}
            onChange={(e) => set("additionalGivenName", e.target.value)}
            placeholder="Additional given name"
            maxLength={NAME_MAX_LENGTH}
          />
          <Input
            type="text"
            value={data.secondaryFamilyName}
            onChange={(e) => set("secondaryFamilyName", e.target.value)}
            placeholder="Secondary family name"
            maxLength={NAME_MAX_LENGTH}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>Valid from *</Label>
          <Input
            type="date"
            value={data.validFrom}
            onChange={(e) => onChange({ ...data, validFrom: e.target.value })}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Valid to</Label>
          <Input
            type="date"
            value={data.validTo}
            onChange={(e) => onChange({ ...data, validTo: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Main dialog ──────────────────────────────────────────────────────────────

export function CreateIdentityDialog({
  userId,
  systemContexts,
  userContexts,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [contextData, setContextData] = useState<ContextStep>({
    contextId: systemContexts[0]?.id ?? userContexts[0]?.id ?? "__new__",
    newContextName: "",
  });

  const [namesData, setNamesData] = useState<NamesStep>({
    courtesyTitle: "",
    givenName: "",
    familyName: "",
    additionalGivenName: "",
    secondaryFamilyName: "",
    displayName: "",
    displayNameTouched: false,
    email: "",
    description: "",
    location: "",
    tel: "",
    validFrom: new Date().toISOString().split("T")[0]!,
    validTo: "",
  });

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [background, setBackground] = useState<string | null>(null);

  // Stable placeholder seed before we have a real identity id
  const placeholderSeed = `${userId}-new`;

  function handleOpen() {
    setStep(1);
    setError(null);
    setContextData({
      contextId: systemContexts[0]?.id ?? userContexts[0]?.id ?? "__new__",
      newContextName: "",
    });
    setNamesData({
      courtesyTitle: "",
      givenName: "",
      familyName: "",
      additionalGivenName: "",
      secondaryFamilyName: "",
      displayName: "",
      displayNameTouched: false,
      email: "",
      description: "",
      location: "",
      tel: "",
      validFrom: new Date().toISOString().split("T")[0]!,
      validTo: "",
    });
    setPhotoFile(null);
    setBackground(null);
    setOpen(true);
  }

  function handleClose() {
    setOpen(false);
    setError(null);
  }

  function canAdvanceStep1() {
    if (contextData.contextId === "__new__")
      return contextData.newContextName.trim().length > 0;
    return !!contextData.contextId;
  }

  function canAdvanceStep2() {
    return (
      namesData.givenName.trim().length > 0 &&
      namesData.familyName.trim().length > 0 &&
      namesData.displayName.trim().length > 0
    );
  }

  async function handleCreate() {
    setLoading(true);
    setError(null);

    // 1. Resolve context
    let contextId: string;
    if (contextData.contextId === "__new__") {
      const res = await fetch("/api/proxy/identity-contexts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: contextData.newContextName.trim(),
          userId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to create context");
        setLoading(false);
        return;
      }
      contextId = data.id;
    } else {
      contextId = contextData.contextId;
    }

    // 2. Create identity
    const res = await fetch("/api/proxy/identities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        contextId,
        givenName: namesData.givenName.trim(),
        familyName: namesData.familyName.trim(),
        displayName: namesData.displayName.trim(),
        validFrom: namesData.validFrom,
        ...(namesData.courtesyTitle && {
          courtesyTitle: namesData.courtesyTitle,
        }),
        ...(namesData.additionalGivenName.trim() && {
          additionalGivenName: namesData.additionalGivenName.trim(),
        }),
        ...(namesData.secondaryFamilyName.trim() && {
          secondaryFamilyName: namesData.secondaryFamilyName.trim(),
        }),
        ...(namesData.validTo && { validTo: namesData.validTo }),
        ...(namesData.email.trim() && { email: namesData.email.trim() }),
        ...(namesData.description.trim() && {
          description: namesData.description.trim(),
        }),
        ...(namesData.location.trim() && {
          location: namesData.location.trim(),
        }),
        ...(namesData.tel.trim() && { tel: namesData.tel.trim() }),
        ...(background && { background }),
      }),
    });

    const identity = await res.json();
    if (!res.ok) {
      setError(identity.error ?? "Failed to create identity");
      setLoading(false);
      return;
    }

    // 3. Upload photo if provided
    if (photoFile) {
      try {
        await uploadIdentityHeadImage(identity.id, photoFile);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to upload photo",
        );
        setLoading(false);
        router.refresh();
        return;
      }
    }

    handleClose();
    setLoading(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? handleOpen() : handleClose())}>
      <Button onClick={handleOpen}>+ Create Identity</Button>

      <DialogContent className="grid-rows-[auto_1fr_auto] gap-0 p-0 sm:max-w-lg max-h-[90vh]">
        <DialogHeader className="flex-row items-center justify-between space-y-0 border-b px-6 py-4">
          <Steps current={step} />
        </DialogHeader>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {step === 1 && (
            <ContextStep
              systemContexts={systemContexts}
              userContexts={userContexts}
              data={contextData}
              onChange={setContextData}
            />
          )}
          {step === 2 && (
            <NameCardStep
              identityId={placeholderSeed}
              data={namesData}
              onChange={setNamesData}
              file={photoFile}
              onFileChange={setPhotoFile}
              background={background}
              onBackgroundChange={setBackground}
            />
          )}

          {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex justify-between gap-2 border-t bg-muted/50 px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={step === 1 ? handleClose : () => setStep(1)}
          >
            {step === 1 ? "Cancel" : "← Back"}
          </Button>

          {step === 1 ? (
            <Button type="button" disabled={!canAdvanceStep1()} onClick={() => setStep(2)}>
              Next →
            </Button>
          ) : (
            <Button type="button" disabled={loading || !canAdvanceStep2()} onClick={handleCreate}>
              {loading ? "Creating…" : "Create"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
