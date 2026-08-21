import { Mail, MapPin, Phone } from "lucide-react";
import { getIdentityHeadImage, toCssImageUrl } from "../../lib/placeholder-heads";
import type { NameCardIdentity } from "./types";

export const duotonePageClass = "bg-neutral-950";

// Photo-forward: the head image fills the whole card as a background (not a
// small avatar), desaturated and tinted so it reads as one deliberate
// duotone image rather than a random photo, with a bottom scrim for text
// legibility regardless of how bright the source photo is.
export function DuotoneCard({ identity }: { identity: NameCardIdentity }) {
  return (
    <div className="relative w-full max-w-sm aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-cover bg-center grayscale contrast-125"
        style={{ backgroundImage: toCssImageUrl(getIdentityHeadImage(identity)) }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-br from-indigo-600/70 via-indigo-900/60 to-black/70 mix-blend-multiply"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"
      />

      <div className="absolute inset-x-0 bottom-0 p-6 flex flex-col gap-3">
        <h1 className="text-2xl font-bold text-white leading-tight">
          {identity.courtesyTitle && `${identity.courtesyTitle} `}
          {identity.displayName}
        </h1>

        {(identity.location || identity.email || identity.tel) && (
          <div className="flex flex-col items-start gap-1.5">
            {identity.location && (
              <div className="flex items-center gap-2 text-sm text-white/80">
                <MapPin className="size-3.5 shrink-0" />
                {identity.location}
              </div>
            )}
            {identity.email && (
              <a
                href={`mailto:${identity.email}`}
                className="flex items-center gap-2 text-sm text-white/80 hover:text-white transition-colors"
              >
                <Mail className="size-3.5 shrink-0" />
                {identity.email}
              </a>
            )}
            {identity.tel && (
              <a
                href={`tel:${identity.tel}`}
                className="flex items-center gap-2 text-sm text-white/80 hover:text-white transition-colors"
              >
                <Phone className="size-3.5 shrink-0" />
                {identity.tel}
              </a>
            )}
          </div>
        )}

        {identity.description && (
          <p className="text-sm text-white/70 leading-relaxed">
            {identity.description}
          </p>
        )}
      </div>
    </div>
  );
}

export function DuotoneTemplate({ identity }: { identity: NameCardIdentity }) {
  return (
    <div className={`min-h-svh ${duotonePageClass} flex items-center justify-center px-6`}>
      <DuotoneCard identity={identity} />
    </div>
  );
}
