import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "../../../auth";
import { prisma } from "@repo/database";
import { ShareDetailPanel } from "../../../components/share-detail-panel";
import { Spinner } from "../../../components/spinner";
import { getIdentityHeadImage, toCssImageUrl } from "../../../lib/placeholder-heads";
import { getOrigin } from "../../../lib/get-origin";
import { DEFAULT_TEMPLATE, TEMPLATES, isTemplateId } from "../../../components/name-card-templates";

export default async function SharesPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/");

  const { token: selectedToken } = await searchParams;

  const [origin, shares] = await Promise.all([
    getOrigin(),
    prisma.identityShare.findMany({
      where: { identity: { userId: session.user.id } },
      include: {
        identity: {
          select: {
            id: true,
            displayName: true,
            image: true,
            context: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const now = new Date();

  function statusOf(share: (typeof shares)[number]) {
    if (share.revokedAt) return "revoked" as const;
    if (share.expiresAt && share.expiresAt < now) return "expired" as const;
    return "active" as const;
  }

  return (
    <main className="px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10 flex flex-col sm:flex-row gap-6 sm:gap-0">
      {/* List column */}
      <div className="w-full sm:w-96 shrink-0 flex flex-col gap-4 sm:pr-8">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-sm text-black/40 dark:text-white/40 hover:text-black/70 dark:hover:text-white/70 transition-colors">
            ← Identities
          </Link>
          <h1 className="text-xl font-semibold">Shared links</h1>
        </div>

        {shares.length === 0 ? (
          <p className="text-sm text-black/40 dark:text-white/40">
            No shared links yet. Use the Share button on an identity card to create one.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {shares.map((share) => {
              const status = statusOf(share);
              const shareUrl = `${origin}/share/${share.token}`;
              const isActive = status === "active";
              const templateId = isTemplateId(share.template)
                ? share.template
                : DEFAULT_TEMPLATE;
              const template = TEMPLATES[templateId];
              const isSelected = share.token === selectedToken;

              return (
                <li
                  key={share.id}
                  className={`relative border rounded-xl p-3 flex flex-col gap-2 transition-colors ${
                    isSelected
                      ? "border-black/30 dark:border-white/30 bg-black/[0.03] dark:bg-white/[0.04]"
                      : "border-black/8 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20 hover:bg-black/[0.015] dark:hover:bg-white/[0.02]"
                  }`}
                >
                  {/* Stretched click target for the whole card */}
                  <Link
                    href={`?token=${share.token}`}
                    aria-label={`Preview shared link for ${share.identity.displayName}`}
                    className="absolute inset-0 rounded-xl"
                  />

                  <div className="flex gap-3 min-w-0">
                    <div
                      aria-hidden="true"
                      className="size-10 shrink-0 rounded-full bg-cover bg-center ring-1 ring-black/10 dark:ring-white/15"
                      style={{
                        backgroundImage: toCssImageUrl(
                          getIdentityHeadImage(share.identity)
                        ),
                      }}
                    />

                    <div className="min-w-0 flex-1 flex flex-col gap-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-medium text-sm truncate">
                          {share.identity.displayName}
                        </span>
                        <span className="shrink-0 text-xs text-black/40 dark:text-white/40 bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded-full">
                          {share.identity.context.name}
                        </span>
                      </div>

                      <span
                        className={`text-xs font-mono truncate ${
                          isActive
                            ? "text-black/50 dark:text-white/50"
                            : "text-black/30 dark:text-white/30 line-through"
                        }`}
                      >
                        {shareUrl}
                      </span>

                      <span className="text-xs text-black/40 dark:text-white/40">
                        Created {share.createdAt.toLocaleDateString()}
                        {share.expiresAt
                          ? ` · expires ${share.expiresAt.toLocaleDateString()}`
                          : ""}
                        {share.revokedAt
                          ? ` · revoked ${share.revokedAt.toLocaleDateString()}`
                          : ""}
                      </span>
                    </div>
                  </div>

                  <span className="flex items-center gap-1.5 text-xs text-black/40 dark:text-white/40">
                    <span
                      className="size-2.5 rounded-full ring-1 ring-black/10 dark:ring-white/15"
                      style={{ backgroundColor: template.swatch }}
                    />
                    {template.label}
                    <span
                      className={`ml-1 px-2 py-0.5 rounded-full ${
                        status === "active"
                          ? "bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400"
                          : "bg-black/5 dark:bg-white/5 text-black/40 dark:text-white/40"
                      }`}
                    >
                      {status}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Divider — only shown once the columns sit side by side */}
      <div
        aria-hidden="true"
        className="hidden sm:block w-px shrink-0 bg-black/10 dark:bg-white/10"
      />

      {/* Detail column */}
      <div className="flex-1 min-w-0 sm:pl-8">
        {selectedToken ? (
          <Suspense
            key={selectedToken}
            fallback={
              <div className="border border-dashed border-black/10 dark:border-white/10 rounded-2xl p-8 sm:p-16 flex items-center justify-center min-h-[200px] sm:min-h-[400px]">
                <Spinner className="h-6 w-6 text-black/30 dark:text-white/30" />
              </div>
            }
          >
            <ShareDetailPanel userId={session.user.id} token={selectedToken} />
          </Suspense>
        ) : (
          <div className="border border-dashed border-black/10 dark:border-white/10 rounded-2xl p-8 sm:p-16 flex items-center justify-center text-center text-sm text-black/40 dark:text-white/40 min-h-[200px] sm:min-h-[400px]">
            Select a shared link to preview it
          </div>
        )}
      </div>
    </main>
  );
}
