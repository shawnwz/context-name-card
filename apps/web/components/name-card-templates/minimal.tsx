import { Mail, MapPin, Phone } from "lucide-react";
import { getIdentityHeadImage, toCssImageUrl } from "../../lib/placeholder-heads";
import type { NameCardIdentity } from "./types";

export function MinimalTemplate({ identity }: { identity: NameCardIdentity }) {
  return (
    <div className="min-h-svh bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center px-6">
      <div className="w-full max-w-sm bg-white dark:bg-neutral-900 border border-black/10 dark:border-white/10 rounded-2xl p-8 shadow-sm flex flex-col items-center gap-4">
        <div
          className="size-20 rounded-full bg-cover bg-center ring-1 ring-black/10 dark:ring-white/15"
          style={{ backgroundImage: toCssImageUrl(getIdentityHeadImage(identity)) }}
        />

        <h1 className="text-2xl font-semibold text-black dark:text-white text-center">
          {identity.courtesyTitle && `${identity.courtesyTitle} `}
          {identity.displayName}
        </h1>

        {(identity.location || identity.email || identity.tel) && (
          <div className="flex flex-col items-start gap-1.5 -mt-1">
            {identity.location && (
              <div className="flex items-center gap-2 text-sm text-black/50 dark:text-white/50">
                <MapPin className="size-3.5 shrink-0" />
                {identity.location}
              </div>
            )}
            {identity.email && (
              <a
                href={`mailto:${identity.email}`}
                className="flex items-center gap-2 text-sm text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white transition-colors"
              >
                <Mail className="size-3.5 shrink-0" />
                {identity.email}
              </a>
            )}
            {identity.tel && (
              <a
                href={`tel:${identity.tel}`}
                className="flex items-center gap-2 text-sm text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white transition-colors"
              >
                <Phone className="size-3.5 shrink-0" />
                {identity.tel}
              </a>
            )}
          </div>
        )}

        {identity.description && (
          <p className="text-sm text-black/50 dark:text-white/50 text-center leading-relaxed">
            {identity.description}
          </p>
        )}
      </div>
    </div>
  );
}
