import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "../../../auth";
import { prisma } from "@repo/database";
import { RevokeShareButton } from "../../../components/revoke-share-button";
import { getIdentityHeadImage, toCssImageUrl } from "../../../lib/placeholder-heads";

async function getOrigin() {
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}

export default async function SharesPage() {
  const session = await auth();
  if (!session?.user) redirect("/");

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
    <main className="max-w-2xl mx-auto px-6 py-10 flex flex-col gap-6">
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

            return (
              <li
                key={share.id}
                className="border border-black/8 dark:border-white/10 rounded-xl p-4 flex gap-3"
              >
                {/* Avatar */}
                <div
                  aria-hidden="true"
                  className="size-10 shrink-0 rounded-full bg-cover bg-center ring-1 ring-black/10 dark:ring-white/15"
                  style={{
                    backgroundImage: toCssImageUrl(
                      getIdentityHeadImage(share.identity)
                    ),
                  }}
                />

                <div className="min-w-0 flex-1 flex flex-col gap-1.5">
                  {/* Top row */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-medium truncate text-sm">
                        {share.identity.displayName}
                      </span>
                      <span className="shrink-0 text-xs text-black/40 dark:text-white/40 bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded-full">
                        {share.identity.context.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          status === "active"
                            ? "bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400"
                            : "bg-black/5 dark:bg-white/5 text-black/40 dark:text-white/40"
                        }`}
                      >
                        {status}
                      </span>
                      {isActive && <RevokeShareButton token={share.token} />}
                    </div>
                  </div>

                  {/* Link */}
                  <a
                    href={isActive ? shareUrl : undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-xs font-mono truncate ${
                      isActive
                        ? "text-violet-600 dark:text-violet-400 hover:underline"
                        : "text-black/30 dark:text-white/30 line-through"
                    }`}
                  >
                    {shareUrl}
                  </a>

                  {/* Meta */}
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
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
