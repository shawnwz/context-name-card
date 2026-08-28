import { Mail, MapPin, Phone } from "lucide-react";
import { getAccentColor, getIdentityHeadImage, toCssImageUrl } from "../../lib/placeholder-heads";
import type { NameCardIdentity } from "./types";

export const geometricPageClass = "bg-neutral-50 dark:bg-neutral-950";

// Accent color is derived the same way the placeholder avatar's color is,
// so the decorative pattern always matches the identity even when it has no
// photo — Tailwind can't pick up a dynamically-interpolated class (its
// scanner only sees static source text), so accent-dependent styling below
// goes through inline `style`, not arbitrary-value classes.
export function GeometricCard({
  identity,
  fill = false,
}: {
  identity: NameCardIdentity;
  fill?: boolean;
}) {
  const accent = getAccentColor(identity.id);

  return (
    <div
      className={`relative ${fill ? "w-full flex-1" : "w-full max-w-sm"} bg-white dark:bg-neutral-900 border border-black/10 dark:border-white/10 rounded-2xl p-8 shadow-2xl overflow-hidden flex flex-col items-center gap-4`}
    >
      <svg
        aria-hidden="true"
        className="absolute -top-10 -right-16 size-56 opacity-[0.12] pointer-events-none"
        viewBox="0 0 200 200"
      >
        <circle cx="100" cy="100" r="95" fill="none" stroke={accent} strokeWidth="10" />
        <circle cx="100" cy="100" r="65" fill="none" stroke={accent} strokeWidth="10" />
        <circle cx="100" cy="100" r="35" fill={accent} />
      </svg>
      <svg
        aria-hidden="true"
        className="absolute -bottom-14 -left-14 size-40 opacity-[0.10] pointer-events-none"
        viewBox="0 0 200 200"
      >
        <rect
          x="20"
          y="20"
          width="160"
          height="160"
          rx="24"
          fill="none"
          stroke={accent}
          strokeWidth="10"
          transform="rotate(20 100 100)"
        />
      </svg>

      <div
        className="relative size-20 rounded-full bg-cover bg-center"
        style={{
          backgroundImage: toCssImageUrl(getIdentityHeadImage(identity)),
          boxShadow: `0 0 0 3px ${accent}66`,
        }}
      />

      <div className="relative flex flex-col items-center gap-2">
        <h1 className="text-2xl font-bold text-black dark:text-white text-center line-clamp-2">
          {identity.courtesyTitle && `${identity.courtesyTitle} `}
          {identity.displayName}
        </h1>
        <div className="h-1 w-8 rounded-full" style={{ backgroundColor: accent }} />
      </div>

      {(identity.location || identity.email || identity.tel) && (
        <div className="relative flex flex-col items-start gap-1.5">
          {identity.location && (
            <div className="flex items-center gap-2 text-sm text-black/60 dark:text-white/60">
              <MapPin className="size-3.5 shrink-0" style={{ color: accent }} />
              {identity.location}
            </div>
          )}
          {identity.email && (
            <a
              href={`mailto:${identity.email}`}
              className="flex items-center gap-2 text-sm text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white transition-colors"
            >
              <Mail className="size-3.5 shrink-0" style={{ color: accent }} />
              {identity.email}
            </a>
          )}
          {identity.tel && (
            <a
              href={`tel:${identity.tel}`}
              className="flex items-center gap-2 text-sm text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white transition-colors"
            >
              <Phone className="size-3.5 shrink-0" style={{ color: accent }} />
              {identity.tel}
            </a>
          )}
        </div>
      )}

      {identity.description && (
        <p
          className={`relative text-sm text-black/50 dark:text-white/50 text-center leading-relaxed line-clamp-3 ${fill ? "mt-auto" : ""}`}
        >
          {identity.description}
        </p>
      )}
    </div>
  );
}

export function GeometricTemplate({ identity }: { identity: NameCardIdentity }) {
  return (
    <div className={`min-h-svh ${geometricPageClass} flex flex-col px-4 pt-4 pb-24`}>
      <GeometricCard identity={identity} fill />
    </div>
  );
}
