import { Suspense } from "react";
import Link from "next/link";
import { auth } from "../../auth";
import { CreateIdentityDialog } from "../../components/create-identity-dialog";
import { IdentityActionsMenu } from "../../components/identity-actions-menu";
import { DotGridBackground } from "../../components/dot-grid-background";
import { IdentityDetailPanel } from "../../components/identity-detail-panel";
import { LandingHero } from "../../components/landing-hero";
import { SignIn } from "../../components/sign-in";
import { Spinner } from "../../components/spinner";
import { prisma } from "@repo/database";
import { getIdentityHeadImage, toCssImageUrl } from "../../lib/placeholder-heads";

const PAGE_SIZE = 5;

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; identity?: string }>;
}) {
  const session = await auth();

  if (!session?.user) {
    return <LandingPage />;
  }

  const { page: pageParam, identity: selectedId } = await searchParams;

  // Fetched separately from the paginated list below — this needs to reflect
  // ALL of the user's identities, not just the current page, otherwise a
  // context used only by an identity on another page would wrongly show as
  // "available" when creating a new identity.
  const [systemContexts, userContexts, allIdentityContextIds, totalCount] =
    await Promise.all([
      prisma.identityContext.findMany({
        where: { userId: null },
        orderBy: { name: "asc" },
      }),
      prisma.identityContext.findMany({
        where: { userId: session.user.id },
        orderBy: { name: "asc" },
      }),
      prisma.identity.findMany({
        where: { userId: session.user.id },
        select: { contextId: true },
      }),
      prisma.identity.count({ where: { userId: session.user.id } }),
    ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const page = Math.min(Math.max(1, Number(pageParam) || 1), totalPages);

  const identities = await prisma.identity.findMany({
    where: { userId: session.user.id },
    include: { context: true },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });

  const usedContextIds = new Set(allIdentityContextIds.map((i) => i.contextId));
  const availableSystemContexts = systemContexts.filter(
    (c) => !usedContextIds.has(c.id),
  );
  const availableUserContexts = userContexts.filter(
    (c) => !usedContextIds.has(c.id),
  );

  // Nothing explicitly selected (e.g. landing on the page fresh from the
  // sidebar) — default to the first identity on this page instead of
  // leaving the detail column empty.
  const effectiveSelectedId = selectedId ?? identities[0]?.id;

  return (
    <main className="px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10 flex flex-col sm:flex-row gap-6 sm:gap-0">
      {/* List column */}
      <div className="w-full sm:w-80 shrink-0 flex flex-col gap-4 sm:pr-8">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Identities</h1>
          <CreateIdentityDialog
            userId={session.user.id}
            systemContexts={availableSystemContexts}
            userContexts={availableUserContexts}
          />
        </div>

        {identities.length === 0 ? (
          <p className="text-sm text-black/40 dark:text-white/40">
            No identities yet. Create one to get started.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {identities.map((identity) => {
              const isSelected = identity.id === effectiveSelectedId;
              return (
                <li
                  key={identity.id}
                  className={`relative border rounded-xl p-3 flex flex-col gap-2 transition-colors ${
                    isSelected
                      ? "border-violet-400 dark:border-violet-500/70 bg-violet-50 dark:bg-violet-500/10 shadow-lg shadow-violet-500/15 dark:shadow-violet-900/40"
                      : "border-black/8 dark:border-white/10"
                  }`}
                >
                  <Link
                    href={`?page=${page}&identity=${identity.id}`}
                    className="flex gap-3 min-w-0 pr-8"
                  >
                    <div
                      aria-hidden="true"
                      className="size-10 shrink-0 rounded-full bg-cover bg-center ring-1 ring-black/10 dark:ring-white/15"
                      style={{
                        backgroundImage: toCssImageUrl(
                          getIdentityHeadImage(identity),
                        ),
                      }}
                    />
                    <div className="min-w-0 flex-1 flex flex-col">
                      <span className="font-medium text-sm truncate hover:underline">
                        {identity.courtesyTitle && `${identity.courtesyTitle} `}
                        {identity.displayName}
                      </span>
                      <span className="text-xs text-black/40 dark:text-white/40 truncate">
                        {identity.context.name}
                      </span>
                    </div>
                  </Link>
                  <div className="absolute top-2 right-2">
                    <IdentityActionsMenu
                      identity={{
                        id: identity.id,
                        contextName: identity.context.name,
                        courtesyTitle: identity.courtesyTitle,
                        givenName: identity.givenName,
                        familyName: identity.familyName,
                        additionalGivenName: identity.additionalGivenName,
                        secondaryFamilyName: identity.secondaryFamilyName,
                        displayName: identity.displayName,
                        validFrom: identity.validFrom.toISOString(),
                        validTo: identity.validTo?.toISOString() ?? null,
                        image: identity.image,
                        background: identity.background,
                        email: identity.email,
                        description: identity.description,
                        location: identity.location,
                        tel: identity.tel,
                      }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <Link
              href={`?page=${page - 1}${selectedId ? `&identity=${selectedId}` : ""}`}
              aria-disabled={page <= 1}
              className={`text-sm transition-colors ${
                page <= 1
                  ? "text-black/25 dark:text-white/25 pointer-events-none"
                  : "text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white"
              }`}
            >
              ← Previous
            </Link>
            <span className="text-xs text-black/40 dark:text-white/40">
              Page {page} of {totalPages}
            </span>
            <Link
              href={`?page=${page + 1}${selectedId ? `&identity=${selectedId}` : ""}`}
              aria-disabled={page >= totalPages}
              className={`text-sm transition-colors ${
                page >= totalPages
                  ? "text-black/25 dark:text-white/25 pointer-events-none"
                  : "text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white"
              }`}
            >
              Next →
            </Link>
          </div>
        )}
      </div>

      {/* Divider — only shown once the columns sit side by side */}
      <div
        aria-hidden="true"
        className="hidden sm:block w-px shrink-0 bg-black/10 dark:bg-white/10"
      />

      {/* Detail column */}
      <div className="flex-1 min-w-0 sm:pl-8">
        {effectiveSelectedId ? (
          <Suspense
            key={effectiveSelectedId}
            fallback={
              <div className="border border-dashed border-black/10 dark:border-white/10 rounded-2xl p-8 sm:p-16 flex items-center justify-center min-h-[200px] sm:min-h-[400px]">
                <Spinner className="h-6 w-6 text-black/30 dark:text-white/30" />
              </div>
            }
          >
            <IdentityDetailPanel userId={session.user.id} identityId={effectiveSelectedId} />
          </Suspense>
        ) : (
          <div className="border border-dashed border-black/10 dark:border-white/10 rounded-2xl p-8 sm:p-16 flex items-center justify-center text-center text-sm text-black/40 dark:text-white/40 min-h-[200px] sm:min-h-[400px]">
            Select an identity to preview its name card
          </div>
        )}
      </div>
    </main>
  );
}

function LandingPage() {
  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-gradient-to-br from-purple-950 via-purple-900 to-violet-800">
      {/* Dot grid, brand purple, softly vignetted around the hero */}
      <DotGridBackground vignette />

      {/* Ambient glow behind the mark */}
      <div
        aria-hidden="true"
        className="absolute size-[420px] rounded-full bg-violet-500/25 blur-[110px]"
      />

      {/* Hero */}
      <LandingHero>
        <SignIn />
      </LandingHero>
    </div>
  );
}
