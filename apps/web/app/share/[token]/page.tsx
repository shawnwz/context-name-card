import { notFound } from "next/navigation";
import { Mail, MapPin, Phone } from "lucide-react";
import { getIdentityHeadImage, toCssImageUrl } from "../../../lib/placeholder-heads";

const API_URL = process.env.API_URL ?? "http://localhost:4000";

type Identity = {
  id: string;
  courtesyTitle: string | null;
  displayName: string;
  image: string | null;
  email: string | null;
  description: string | null;
  location: string | null;
  tel: string | null;
};

async function getSharedIdentity(token: string): Promise<Identity | null> {
  const res = await fetch(`${API_URL}/shares/${token}`, { cache: "no-store" });
  if (res.status === 404 || res.status === 410) return null;
  if (!res.ok) return null;
  return res.json();
}

export default async function SharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const identity = await getSharedIdentity(token);

  if (!identity) notFound();

  return (
    <div className="min-h-svh bg-gradient-to-br from-purple-950 via-purple-900 to-violet-800 flex items-center justify-center px-6">
      <div className="w-full max-w-sm bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 shadow-2xl flex flex-col items-center gap-4">

        <div
          className="size-20 rounded-full bg-cover bg-center ring-2 ring-white/20"
          style={{ backgroundImage: toCssImageUrl(getIdentityHeadImage(identity)) }}
        />

        <h1 className="text-2xl font-bold text-white text-center">
          {identity.courtesyTitle && `${identity.courtesyTitle} `}
          {identity.displayName}
        </h1>

        {(identity.location || identity.email || identity.tel) && (
          <div className="flex flex-col items-start gap-1.5 -mt-1">
            {identity.location && (
              <div className="flex items-center gap-2 text-sm text-white/50">
                <MapPin className="size-3.5 shrink-0" />
                {identity.location}
              </div>
            )}
            {identity.email && (
              <a
                href={`mailto:${identity.email}`}
                className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors"
              >
                <Mail className="size-3.5 shrink-0" />
                {identity.email}
              </a>
            )}
            {identity.tel && (
              <a
                href={`tel:${identity.tel}`}
                className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors"
              >
                <Phone className="size-3.5 shrink-0" />
                {identity.tel}
              </a>
            )}
          </div>
        )}

        {identity.description && (
          <p className="text-sm text-white/60 text-center leading-relaxed">
            {identity.description}
          </p>
        )}

      </div>
    </div>
  );
}
