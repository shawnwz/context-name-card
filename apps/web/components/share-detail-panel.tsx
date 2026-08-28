import Image from "next/image";
import QRCode from "qrcode";
import { prisma } from "@repo/database";
import { CopyLinkButton } from "./copy-link-button";
import { RevokeShareButton } from "./revoke-share-button";
import { getIdentityHeadImage, toCssImageUrl } from "../lib/placeholder-heads";
import { getOrigin } from "../lib/get-origin";
import { DEFAULT_TEMPLATE, TEMPLATES, isTemplateId } from "./name-card-templates";
import { Badge } from "@/components/ui/badge";

export async function ShareDetailPanel({
  userId,
  token,
}: {
  userId: string;
  token: string;
}) {
  const [share, origin] = await Promise.all([
    prisma.identityShare.findFirst({
      where: { token, identity: { userId } },
      include: { identity: { include: { context: true } } },
    }),
    getOrigin(),
  ]);

  if (!share) {
    return (
      <div className="border border-dashed border-black/10 dark:border-white/10 rounded-2xl p-8 sm:p-16 flex items-center justify-center text-center text-sm text-black/40 dark:text-white/40 min-h-[200px] sm:min-h-[400px]">
        Share not found.
      </div>
    );
  }

  const status = share.revokedAt
    ? ("revoked" as const)
    : share.expiresAt && share.expiresAt < new Date()
      ? ("expired" as const)
      : ("active" as const);
  const isActive = status === "active";

  const templateId = isTemplateId(share.template) ? share.template : DEFAULT_TEMPLATE;
  const { Card, label, swatch } = TEMPLATES[templateId];

  const shareUrl = `${origin}/share/${share.token}`;
  const qrDataUrl = await QRCode.toDataURL(shareUrl, {
    margin: 1,
    width: 240,
    color: { dark: "#4c1d95", light: "#ffffff" },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div
          aria-hidden="true"
          className="size-12 shrink-0 rounded-full bg-cover bg-center ring-1 ring-black/10 dark:ring-white/15"
          style={{ backgroundImage: toCssImageUrl(getIdentityHeadImage(share.identity)) }}
        />
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">
              {share.identity.courtesyTitle && `${share.identity.courtesyTitle} `}
              {share.identity.displayName}
            </h2>
            <Badge variant="secondary">{share.identity.context.name}</Badge>
          </div>
          <Badge
            variant="secondary"
            className={
              isActive
                ? "bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400"
                : ""
            }
          >
            {status}
          </Badge>
        </div>
      </div>

      {/* Uses flex-wrap (not a fixed-column grid) so this stacks cleanly
          when the panel is squeezed into a narrower right-hand column next
          to the shares list, not just on small viewports. */}
      <div className="flex flex-wrap gap-6">
        {/* Preview — plain container, not a link: the card templates
            already render their own mailto/tel links, so wrapping this in
            an <a> would nest anchors. "Open" lives on the QR code below. */}
        <div className="flex-1 min-w-[280px] rounded-2xl p-8 flex items-center justify-center min-h-[380px] bg-neutral-100 dark:bg-neutral-900">
          <Card identity={share.identity} />
        </div>

        {/* QR + share actions */}
        <div className="flex-1 min-w-[280px] border border-black/8 dark:border-white/10 rounded-2xl p-6 flex flex-col items-center gap-4">
          <a href={shareUrl} target="_blank" rel="noopener noreferrer" className="hover:opacity-90 transition-opacity">
            <Image
              src={qrDataUrl}
              alt="QR code linking to this shared card"
              width={192}
              height={192}
              unoptimized
              className="size-48 rounded-lg ring-1 ring-black/10 dark:ring-white/15"
            />
          </a>
          <p className="text-xs text-black/40 dark:text-white/40 -mt-2">
            Scan, or click the QR code to open
          </p>

          <div className="w-full flex flex-col gap-2">
            <CopyLinkButton url={shareUrl} />
            <span className="text-xs font-mono text-black/40 dark:text-white/40 truncate text-center">
              {shareUrl}
            </span>
          </div>

          <div className="w-full flex items-center justify-between mt-2 pt-4 border-t border-black/8 dark:border-white/10">
            <span className="flex items-center gap-1.5 text-xs text-black/40 dark:text-white/40">
              <span
                className="size-2.5 rounded-full ring-1 ring-black/10 dark:ring-white/15"
                style={{ backgroundColor: swatch }}
              />
              {label}
            </span>
            {isActive && (
              <RevokeShareButton token={share.token} identityName={share.identity.displayName} />
            )}
          </div>

          <span className="w-full text-xs text-black/40 dark:text-white/40">
            Created {share.createdAt.toLocaleDateString()}
            {share.expiresAt ? ` · expires ${share.expiresAt.toLocaleDateString()}` : ""}
            {share.revokedAt ? ` · revoked ${share.revokedAt.toLocaleDateString()}` : ""}
          </span>
        </div>
      </div>
    </div>
  );
}
