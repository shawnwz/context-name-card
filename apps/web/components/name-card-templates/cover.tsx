import { Mail, MapPin, Phone } from "lucide-react";
import { getIdentityHeadImage, toCssImageUrl } from "../../lib/placeholder-heads";
import { getIdentityBackgroundSrc } from "../../lib/background-presets";
import type { NameCardIdentity } from "./types";

export const coverPageClass = "bg-neutral-950";

// The one template that combines both photo sources: a full-bleed curated
// cover photo (picked in the identity editor, or a deterministic default if
// none was chosen) as the backdrop, with the real head image as a small
// avatar overlaid on top — a "cover photo" card, distinct from Duotone
// (which uses the head image itself as the whole background).
export function CoverCard({
  identity,
  fill = false,
}: {
  identity: NameCardIdentity;
  fill?: boolean;
}) {
  return (
    <div
      className={`relative ${fill ? "w-full flex-1" : "w-full max-w-sm aspect-[3/4]"} rounded-3xl overflow-hidden shadow-2xl`}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: toCssImageUrl(getIdentityBackgroundSrc(identity)) }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-black/5"
      />

      {/* Pinned independently of the text block below — its position never
          shifts, no matter how much (or how little) contact info or bio
          text there is. */}
      <div
        className="absolute top-6 left-6 size-16 rounded-full bg-cover bg-center ring-2 ring-white/80 shadow-lg"
        style={{ backgroundImage: toCssImageUrl(getIdentityHeadImage(identity)) }}
      />

      <div className="absolute inset-x-0 bottom-0 p-6 flex flex-col gap-3">
        <h1 className="text-2xl font-bold text-white leading-tight line-clamp-2">
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
          <p className="text-sm text-white/70 leading-relaxed line-clamp-3">
            {identity.description}
          </p>
        )}
      </div>
    </div>
  );
}

export function CoverTemplate({ identity }: { identity: NameCardIdentity }) {
  return (
    <div className={`min-h-svh ${coverPageClass} flex flex-col px-4 pt-4 pb-24`}>
      <CoverCard identity={identity} fill />
    </div>
  );
}
