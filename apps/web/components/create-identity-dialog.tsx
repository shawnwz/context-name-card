"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { uploadIdentityHeadImage } from "../lib/upload-identity-head-image";

type Context = { id: string; name: string };

type Props = {
  userId: string;
  systemContexts: Context[];
  userContexts: Context[];
};

const inputClass =
  "w-full border border-black/15 dark:border-white/15 rounded-lg px-3 py-2 text-sm bg-transparent outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 placeholder:text-black/30 dark:placeholder:text-white/30";

const labelClass =
  "block text-xs font-medium text-black/60 dark:text-white/60 mb-1";

export function CreateIdentityDialog({
  userId,
  systemContexts,
  userContexts,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contextSelection, setContextSelection] = useState<string>(
    systemContexts[0]?.id ?? userContexts[0]?.id ?? "__new__",
  );

  function handleClose() {
    setOpen(false);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget);

    // Resolve contextId — create a new context if needed
    let contextId: string;
    if (contextSelection === "__new__") {
      const contextName = (form.get("contextName") as string).trim();
      const res = await fetch("/api/proxy/identity-contexts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: contextName, userId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to create context");
        setLoading(false);
        return;
      }
      contextId = data.id;
    } else {
      contextId = contextSelection;
    }

    const validTo = (form.get("validTo") as string).trim();
    const additionalGivenName = (
      form.get("additionalGivenName") as string
    ).trim();
    const secondaryFamilyName = (
      form.get("secondaryFamilyName") as string
    ).trim();
    const headImage = form.get("headImage");

    const res = await fetch("/api/proxy/identities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        contextId,
        givenName: (form.get("givenName") as string).trim(),
        familyName: (form.get("familyName") as string).trim(),
        displayName: (form.get("displayName") as string).trim(),
        validFrom: form.get("validFrom") as string,
        ...(additionalGivenName && { additionalGivenName }),
        ...(secondaryFamilyName && { secondaryFamilyName }),
        ...(validTo && { validTo }),
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Failed to create identity");
      setLoading(false);
      return;
    }

    if (headImage instanceof File && headImage.size > 0) {
      try {
        await uploadIdentityHeadImage(data.id, headImage);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to upload head image",
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
        onClick={() => setOpen(true)}
        className="bg-[var(--foreground)] text-[var(--background)] rounded-lg px-4 py-2 text-sm font-medium cursor-pointer hover:opacity-85 transition-opacity"
      >
        + Create Identity
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => e.target === e.currentTarget && handleClose()}
        >
          <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-black/8 dark:border-white/10">
              <h2 className="text-base font-semibold">Create Identity</h2>
              <button
                onClick={handleClose}
                className="text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white text-xl leading-none cursor-pointer"
              >
                ×
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="overflow-y-auto flex-1">
              <div className="px-6 py-4 flex flex-col gap-4">
                {/* Context */}
                <div>
                  <label className={labelClass}>Context</label>
                  <select
                    value={contextSelection}
                    onChange={(e) => setContextSelection(e.target.value)}
                    className={inputClass}
                  >
                    {systemContexts.length > 0 && (
                      <optgroup label="Standard">
                        {systemContexts.map((ctx) => (
                          <option key={ctx.id} value={ctx.id}>
                            {ctx.name}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {userContexts.length > 0 && (
                      <optgroup label="Custom">
                        {userContexts.map((ctx) => (
                          <option key={ctx.id} value={ctx.id}>
                            {ctx.name}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    <option value="__new__">+ New custom context…</option>
                  </select>
                </div>

                {contextSelection === "__new__" && (
                  <div>
                    <label className={labelClass}>Context name</label>
                    <input
                      name="contextName"
                      type="text"
                      required
                      placeholder="e.g. Professional, Personal"
                      className={inputClass}
                    />
                  </div>
                )}

                {/* Name fields */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Given name *</label>
                    <input
                      name="givenName"
                      type="text"
                      required
                      placeholder="Jane"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Family name *</label>
                    <input
                      name="familyName"
                      type="text"
                      required
                      placeholder="Doe"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Additional given name</label>
                    <input
                      name="additionalGivenName"
                      type="text"
                      placeholder="Marie"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Secondary family name</label>
                    <input
                      name="secondaryFamilyName"
                      type="text"
                      placeholder="Smith"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Display name *</label>
                  <input
                    name="displayName"
                    type="text"
                    required
                    placeholder="Jane Doe"
                    className={inputClass}
                  />
                </div>

                {/* Validity */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Valid from *</label>
                    <input
                      name="validFrom"
                      type="date"
                      required
                      defaultValue={new Date().toISOString().split("T")[0]}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Valid to</label>
                    <input name="validTo" type="date" className={inputClass} />
                  </div>
                </div>

                {/* Optional */}
                <div>
                  <label className={labelClass}>Head image</label>
                  <input
                    name="headImage"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className={inputClass}
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-500 dark:text-red-400">
                    {error}
                  </p>
                )}
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-2 px-6 py-4 border-t border-black/8 dark:border-white/10">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-sm rounded-lg border border-black/15 dark:border-white/15 cursor-pointer hover:bg-black/5 dark:hover:bg-white/8 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm rounded-lg bg-[var(--foreground)] text-[var(--background)] font-medium cursor-pointer hover:opacity-85 disabled:opacity-50 transition-opacity"
                >
                  {loading ? "Creating…" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
