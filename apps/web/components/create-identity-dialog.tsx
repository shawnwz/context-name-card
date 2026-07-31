"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Mail, MapPin, Phone } from "lucide-react";
import { uploadIdentityHeadImage } from "../lib/upload-identity-head-image";
import {
  getPlaceholderHeadImage,
  toCssImageUrl,
} from "../lib/placeholder-heads";

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

const inputClass =
  "w-full border border-black/15 dark:border-white/15 rounded-lg px-3 py-2 text-sm bg-transparent outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 placeholder:text-black/30 dark:placeholder:text-white/30";

const labelClass =
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
        <div>
          <label className={labelClass}>Context name</label>
          <input
            autoFocus
            type="text"
            value={data.newContextName}
            onChange={(e) =>
              onChange({ ...data, newContextName: e.target.value })
            }
            placeholder="e.g. Freelance, Gaming"
            className={inputClass}
          />
        </div>
      )}
    </div>
  );
}

// ─── Step 2: Name card (WYSIWYG) ───────────────────────────────────────────────

const cardTextInputClass =
  "bg-transparent text-center outline-none border-b border-transparent hover:border-white/25 focus:border-white/40 transition-colors w-full";

const cardRowInputClass =
  "bg-transparent outline-none border-b border-transparent hover:border-white/25 focus:border-white/40 transition-colors w-full";

function NameCardStep({
  identityId,
  data,
  onChange,
  file,
  onFileChange,
}: {
  identityId: string;
  data: NamesStep;
  onChange: (d: NamesStep) => void;
  file: File | null;
  onFileChange: (f: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!file) { setPreview(null); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const avatarSrc = preview ?? getPlaceholderHeadImage(identityId);

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

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-black/50 dark:text-white/50">
        Edit the card directly — this is exactly how it will look when shared.
      </p>

      {/* WYSIWYG card, styled to match the real share card */}
      <div className="w-full bg-gradient-to-br from-purple-950 via-purple-900 to-violet-800 rounded-3xl p-8 flex flex-col items-center gap-3 shadow-lg">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="relative group cursor-pointer"
        >
          <div
            className="size-20 rounded-full bg-cover bg-center ring-2 ring-white/20"
            style={{ backgroundImage: toCssImageUrl(avatarSrc) }}
          />
          <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-medium text-center px-1">
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
            className="text-[11px] text-white/40 hover:text-white/70 cursor-pointer -mt-1"
          >
            Remove photo
          </button>
        )}

        <input
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
          className={`${cardTextInputClass} text-2xl font-bold text-white placeholder:text-white/40`}
        />

        <div className="flex flex-col items-start gap-1.5 w-full -mt-1">
          <div className="flex items-center gap-2 w-full">
            <MapPin className="size-3.5 shrink-0 text-white/40" />
            <input
              type="text"
              value={data.location}
              onChange={(e) => onChange({ ...data, location: e.target.value })}
              placeholder="San Francisco, CA"
              className={`${cardRowInputClass} text-sm text-white/50 placeholder:text-white/30`}
            />
          </div>

          <div className="flex items-center gap-2 w-full">
            <Mail className="size-3.5 shrink-0 text-white/40" />
            <input
              type="email"
              value={data.email}
              onChange={(e) => onChange({ ...data, email: e.target.value })}
              placeholder="jane@example.com"
              className={`${cardRowInputClass} text-sm text-white/70 placeholder:text-white/30`}
            />
          </div>

          <div className="flex items-center gap-2 w-full">
            <Phone className="size-3.5 shrink-0 text-white/40" />
            <input
              type="tel"
              value={data.tel}
              onChange={(e) => onChange({ ...data, tel: e.target.value })}
              placeholder="+1 555 123 4567"
              className={`${cardRowInputClass} text-sm text-white/70 placeholder:text-white/30`}
            />
          </div>
        </div>

        <textarea
          value={data.description}
          onChange={(e) => onChange({ ...data, description: e.target.value })}
          placeholder="A short bio or note about this identity"
          rows={2}
          className={`${cardTextInputClass} resize-none text-sm text-white/60 placeholder:text-white/30 leading-relaxed`}
        />
      </div>

      {/* Legal name — required for the identity record, kept secondary to the card */}
      <div>
        <p className={labelClass}>Legal name</p>
        <div className="grid grid-cols-2 gap-3">
          <input
            type="text"
            value={data.givenName}
            onChange={(e) => set("givenName", e.target.value)}
            placeholder="Given name *"
            className={inputClass}
          />
          <input
            type="text"
            value={data.familyName}
            onChange={(e) => set("familyName", e.target.value)}
            placeholder="Family name *"
            className={inputClass}
          />
          <input
            type="text"
            value={data.additionalGivenName}
            onChange={(e) => set("additionalGivenName", e.target.value)}
            placeholder="Additional given name"
            className={inputClass}
          />
          <input
            type="text"
            value={data.secondaryFamilyName}
            onChange={(e) => set("secondaryFamilyName", e.target.value)}
            placeholder="Secondary family name"
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Valid from *</label>
          <input
            type="date"
            value={data.validFrom}
            onChange={(e) => onChange({ ...data, validFrom: e.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Valid to</label>
          <input
            type="date"
            value={data.validTo}
            onChange={(e) => onChange({ ...data, validTo: e.target.value })}
            className={inputClass}
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
    <>
      <button
        onClick={handleOpen}
        className="bg-[var(--foreground)] text-[var(--background)] rounded-lg px-4 py-2 text-sm font-medium cursor-pointer hover:opacity-85 transition-opacity"
      >
        + Create Identity
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => e.target === e.currentTarget && handleClose()}
        >
          <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-xl w-full max-w-lg flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-black/8 dark:border-white/10">
              <Steps current={step} />
              <button
                onClick={handleClose}
                className="text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white text-xl leading-none cursor-pointer"
              >
                ×
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5">
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
                />
              )}

              {error && (
                <p className="text-sm text-red-500 dark:text-red-400 mt-4">
                  {error}
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-between gap-2 px-6 py-4 border-t border-black/8 dark:border-white/10">
              <button
                type="button"
                onClick={step === 1 ? handleClose : () => setStep(1)}
                className="px-4 py-2 text-sm rounded-lg border border-black/15 dark:border-white/15 cursor-pointer hover:bg-black/5 dark:hover:bg-white/8 transition-colors"
              >
                {step === 1 ? "Cancel" : "← Back"}
              </button>

              {step === 1 ? (
                <button
                  type="button"
                  disabled={!canAdvanceStep1()}
                  onClick={() => setStep(2)}
                  className="px-4 py-2 text-sm rounded-lg bg-[var(--foreground)] text-[var(--background)] font-medium cursor-pointer hover:opacity-85 disabled:opacity-40 transition-opacity"
                >
                  Next →
                </button>
              ) : (
                <button
                  type="button"
                  disabled={loading || !canAdvanceStep2()}
                  onClick={handleCreate}
                  className="px-4 py-2 text-sm rounded-lg bg-[var(--foreground)] text-[var(--background)] font-medium cursor-pointer hover:opacity-85 disabled:opacity-50 transition-opacity"
                >
                  {loading ? "Creating…" : "Create"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
