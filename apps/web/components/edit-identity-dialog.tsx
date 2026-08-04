"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { uploadIdentityHeadImage } from "../lib/upload-identity-head-image";
import { COURTESY_TITLES } from "../lib/courtesy-titles";

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
  email: string | null;
  description: string | null;
  location: string | null;
  tel: string | null;
};

type Props = { identity: EditableIdentity };

const inputClass =
  "w-full border border-black/15 dark:border-white/15 rounded-lg px-3 py-2 text-sm bg-transparent outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 placeholder:text-black/30 dark:placeholder:text-white/30";

const labelClass =
  "block text-xs font-medium text-black/60 dark:text-white/60 mb-1";

function toDateInput(iso: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

export function EditIdentityDialog({ identity }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleClose() {
    setOpen(false);
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
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs border border-black/15 dark:border-white/15 rounded-md px-2.5 py-1 cursor-pointer hover:bg-black/5 dark:hover:bg-white/8 transition-colors"
      >
        Edit
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => e.target === e.currentTarget && handleClose()}
        >
          <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-black/8 dark:border-white/10">
              <div>
                <h2 className="text-base font-semibold">Edit Identity</h2>
                <p className="text-xs text-black/40 dark:text-white/40 mt-0.5">
                  Context: {identity.contextName}
                </p>
              </div>
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
                {/* Name fields */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Given name *</label>
                    <input
                      name="givenName"
                      type="text"
                      required
                      defaultValue={identity.givenName}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Family name *</label>
                    <input
                      name="familyName"
                      type="text"
                      required
                      defaultValue={identity.familyName}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Additional given name</label>
                    <input
                      name="additionalGivenName"
                      type="text"
                      defaultValue={identity.additionalGivenName ?? ""}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Secondary family name</label>
                    <input
                      name="secondaryFamilyName"
                      type="text"
                      defaultValue={identity.secondaryFamilyName ?? ""}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-[100px_1fr] gap-3">
                  <div>
                    <label className={labelClass}>Title</label>
                    <select
                      name="courtesyTitle"
                      defaultValue={identity.courtesyTitle ?? ""}
                      className={inputClass}
                    >
                      <option value="">—</option>
                      {COURTESY_TITLES.map((title) => (
                        <option key={title} value={title}>
                          {title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Display name *</label>
                    <input
                      name="displayName"
                      type="text"
                      required
                      defaultValue={identity.displayName}
                      className={inputClass}
                    />
                  </div>
                </div>

                {/* Validity */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Valid from *</label>
                    <input
                      name="validFrom"
                      type="date"
                      required
                      defaultValue={toDateInput(identity.validFrom)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Valid to</label>
                    <input
                      name="validTo"
                      type="date"
                      defaultValue={toDateInput(identity.validTo)}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Email</label>
                  <input
                    name="email"
                    type="email"
                    defaultValue={identity.email ?? ""}
                    placeholder="jane@example.com"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Description</label>
                  <textarea
                    name="description"
                    defaultValue={identity.description ?? ""}
                    placeholder="A short bio or note about this identity"
                    rows={3}
                    className={`${inputClass} resize-none`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Location</label>
                    <input
                      name="location"
                      type="text"
                      defaultValue={identity.location ?? ""}
                      placeholder="San Francisco, CA"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Phone</label>
                    <input
                      name="tel"
                      type="tel"
                      defaultValue={identity.tel ?? ""}
                      placeholder="+1 555 123 4567"
                      className={inputClass}
                    />
                  </div>
                </div>

                {/* Image */}
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
                  {loading ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
