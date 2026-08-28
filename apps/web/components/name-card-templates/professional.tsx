import { Mail, MapPin, Phone } from "lucide-react";
import { getIdentityHeadImage, toCssImageUrl } from "../../lib/placeholder-heads";
import type { NameCardIdentity } from "./types";

export const professionalPageClass = "bg-slate-950";

export function ProfessionalCard({
  identity,
  fill = false,
}: {
  identity: NameCardIdentity;
  fill?: boolean;
}) {
  return (
    <div
      className={`${fill ? "w-full flex-1" : "w-full max-w-sm"} bg-slate-900 border border-amber-500/20 rounded-lg p-8 shadow-2xl flex flex-col items-center gap-4`}
    >
      <div
        className="size-20 rounded-full bg-cover bg-center ring-2 ring-amber-500/40"
        style={{ backgroundImage: toCssImageUrl(getIdentityHeadImage(identity)) }}
      />

      <div className="flex flex-col items-center gap-2">
        <h1 className="text-2xl font-bold text-white text-center tracking-wide line-clamp-2">
          {identity.courtesyTitle && `${identity.courtesyTitle} `}
          {identity.displayName}
        </h1>
        <div className="w-10 h-px bg-amber-500/60" />
      </div>

      {(identity.location || identity.email || identity.tel) && (
        <div className="flex flex-col items-start gap-1.5">
          {identity.location && (
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <MapPin className="size-3.5 shrink-0 text-amber-500/70" />
              {identity.location}
            </div>
          )}
          {identity.email && (
            <a
              href={`mailto:${identity.email}`}
              className="flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors"
            >
              <Mail className="size-3.5 shrink-0 text-amber-500/70" />
              {identity.email}
            </a>
          )}
          {identity.tel && (
            <a
              href={`tel:${identity.tel}`}
              className="flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors"
            >
              <Phone className="size-3.5 shrink-0 text-amber-500/70" />
              {identity.tel}
            </a>
          )}
        </div>
      )}

      {identity.description && (
        <p
          className={`text-sm text-slate-400 text-center leading-relaxed italic line-clamp-3 ${fill ? "mt-auto" : ""}`}
        >
          {identity.description}
        </p>
      )}
    </div>
  );
}

export function ProfessionalTemplate({ identity }: { identity: NameCardIdentity }) {
  return (
    <div className={`min-h-svh ${professionalPageClass} flex flex-col px-4 pt-4 pb-24`}>
      <ProfessionalCard identity={identity} fill />
    </div>
  );
}
