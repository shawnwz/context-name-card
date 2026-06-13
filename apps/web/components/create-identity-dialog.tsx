"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  validFrom: string;
  validTo: string;
};

const inputClass =
  "w-full border border-black/15 dark:border-white/15 rounded-lg px-3 py-2 text-sm bg-transparent outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 placeholder:text-black/30 dark:placeholder:text-white/30";

const labelClass =
  "block text-xs font-medium text-black/60 dark:text-white/60 mb-1";

// ─── Step indicator ──────────────────────────────────────────────────────────

function Steps({ current }: { current: 1 | 2 | 3 }) {
  const labels = ["Context", "Names", "Photo"];
  return (
    <div className="flex items-center gap-2">
      {labels.map((label, i) => {
        const step = (i + 1) as 1 | 2 | 3;
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

// ─── Step 2: Names ────────────────────────────────────────────────────────────

function NamesStep({
  data,
  onChange,
}: {
  data: NamesStep;
  onChange: (d: NamesStep) => void;
}) {
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
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Given name *</label>
          <input
            autoFocus
            type="text"
            value={data.givenName}
            onChange={(e) => set("givenName", e.target.value)}
            placeholder="Jane"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Family name *</label>
          <input
            type="text"
            value={data.familyName}
            onChange={(e) => set("familyName", e.target.value)}
            placeholder="Doe"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Additional given name</label>
          <input
            type="text"
            value={data.additionalGivenName}
            onChange={(e) => set("additionalGivenName", e.target.value)}
            placeholder="Marie"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Secondary family name</label>
          <input
            type="text"
            value={data.secondaryFamilyName}
            onChange={(e) => set("secondaryFamilyName", e.target.value)}
            placeholder="Smith"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Display name *</label>
        <input
          type="text"
          value={data.displayName}
          onChange={(e) => {
            onChange({
              ...data,
              displayName: e.target.value,
              displayNameTouched: true,
            });
          }}
          placeholder="Jane Doe"
          className={inputClass}
        />
        {!data.displayNameTouched && (
          <p className="text-[11px] text-black/30 dark:text-white/30 mt-1">
            Auto-filled from your name — edit to customise
          </p>
        )}
      </div>

      <div>
        <label className={labelClass}>Email</label>
        <input
          type="email"
          value={data.email}
          onChange={(e) => onChange({ ...data, email: e.target.value })}
          placeholder="jane@example.com"
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Description</label>
        <textarea
          value={data.description}
          onChange={(e) => onChange({ ...data, description: e.target.value })}
          placeholder="A short bio or note about this identity"
          rows={3}
          className={`${inputClass} resize-none`}
        />
      </div>
    </div>
  );
}

// ─── Step 3: Photo ────────────────────────────────────────────────────────────

function PhotoStep({
  identityId,
  displayName,
  file,
  onFileChange,
  validFrom,
  validTo,
  onValidFromChange,
  onValidToChange,
}: {
  identityId: string;
  displayName: string;
  file: File | null;
  onFileChange: (f: File | null) => void;
  validFrom: string;
  validTo: string;
  onValidFromChange: (v: string) => void;
  onValidToChange: (v: string) => void;
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

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Preview card */}
      <div className="w-48 bg-black/5 dark:bg-white/5 border border-black/8 dark:border-white/10 rounded-2xl p-5 flex flex-col items-center gap-3">
        <div
          className="size-16 rounded-full bg-cover bg-center ring-1 ring-black/10 dark:ring-white/15"
          style={{ backgroundImage: toCssImageUrl(avatarSrc) }}
        />
        <span className="text-sm font-medium text-center leading-tight">
          {displayName || "Display name"}
        </span>
      </div>

      <div className="flex flex-col items-center gap-2 w-full">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="px-4 py-2 text-sm rounded-lg border border-black/15 dark:border-white/15 cursor-pointer hover:bg-black/5 dark:hover:bg-white/8 transition-colors"
        >
          {file ? "Change photo" : "Choose photo"}
        </button>

        {file && (
          <button
            type="button"
            onClick={() => onFileChange(null)}
            className="text-xs text-black/40 dark:text-white/40 hover:text-black/60 dark:hover:text-white/60 cursor-pointer"
          >
            Remove
          </button>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
        />

        <p className="text-xs text-black/30 dark:text-white/30">
          JPEG, PNG or WebP · max 2 MB · optional
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 w-full">
        <div>
          <label className={labelClass}>Valid from *</label>
          <input
            type="date"
            value={validFrom}
            onChange={(e) => onValidFromChange(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Valid to</label>
          <input
            type="date"
            value={validTo}
            onChange={(e) => onValidToChange(e.target.value)}
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
  const [step, setStep] = useState<1 | 2 | 3>(1);
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
                <NamesStep data={namesData} onChange={setNamesData} />
              )}
              {step === 3 && (
                <PhotoStep
                  identityId={placeholderSeed}
                  displayName={namesData.displayName}
                  file={photoFile}
                  onFileChange={setPhotoFile}
                  validFrom={namesData.validFrom}
                  validTo={namesData.validTo}
                  onValidFromChange={(v) =>
                    setNamesData((d) => ({ ...d, validFrom: v }))
                  }
                  onValidToChange={(v) =>
                    setNamesData((d) => ({ ...d, validTo: v }))
                  }
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
                onClick={step === 1 ? handleClose : () => setStep((s) => (s - 1) as 1 | 2 | 3)}
                className="px-4 py-2 text-sm rounded-lg border border-black/15 dark:border-white/15 cursor-pointer hover:bg-black/5 dark:hover:bg-white/8 transition-colors"
              >
                {step === 1 ? "Cancel" : "← Back"}
              </button>

              {step < 3 ? (
                <button
                  type="button"
                  disabled={step === 1 ? !canAdvanceStep1() : !canAdvanceStep2()}
                  onClick={() => setStep((s) => (s + 1) as 2 | 3)}
                  className="px-4 py-2 text-sm rounded-lg bg-[var(--foreground)] text-[var(--background)] font-medium cursor-pointer hover:opacity-85 disabled:opacity-40 transition-opacity"
                >
                  Next →
                </button>
              ) : (
                <button
                  type="button"
                  disabled={loading}
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
