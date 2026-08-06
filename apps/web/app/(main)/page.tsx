import Link from "next/link";
import { auth } from "../../auth";
import { CreateIdentityDialog } from "../../components/create-identity-dialog";
import { EditIdentityDialog } from "../../components/edit-identity-dialog";
import { DeleteIdentityButton } from "../../components/delete-identity-button";
import { IdentityTemplateGallery } from "../../components/identity-template-gallery";
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

  const selectedIdentity = selectedId
    ? await prisma.identity.findFirst({
        where: { id: selectedId, userId: session.user.id },
      })
    : null;

  const usedContextIds = new Set(allIdentityContextIds.map((i) => i.contextId));
  const availableSystemContexts = systemContexts.filter(
    (c) => !usedContextIds.has(c.id),
  );
  const availableUserContexts = userContexts.filter(
    (c) => !usedContextIds.has(c.id),
  );

  return (
    <main className="max-w-6xl mx-auto px-6 py-10 flex gap-8 items-start">
      {/* List column */}
      <div className="w-full sm:w-80 shrink-0 flex flex-col gap-4">
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
              const isSelected = identity.id === selectedIdentity?.id;
              return (
                <li
                  key={identity.id}
                  className={`border rounded-xl p-3 flex flex-col gap-2 transition-colors ${
                    isSelected
                      ? "border-black/30 dark:border-white/30 bg-black/[0.03] dark:bg-white/[0.04]"
                      : "border-black/8 dark:border-white/10"
                  }`}
                >
                  <Link href={`?identity=${identity.id}`} className="flex gap-3 min-w-0">
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
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <EditIdentityDialog
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
                        email: identity.email,
                        description: identity.description,
                        location: identity.location,
                        tel: identity.tel,
                      }}
                    />
                    <DeleteIdentityButton identityId={identity.id} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <Link
              href={`?page=${page - 1}`}
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
              href={`?page=${page + 1}`}
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

      {/* Detail column */}
      <div className="flex-1 min-w-0 hidden sm:block">
        {selectedIdentity ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold">
                {selectedIdentity.courtesyTitle && `${selectedIdentity.courtesyTitle} `}
                {selectedIdentity.displayName}
              </h2>
            </div>
            <p className="text-sm text-black/50 dark:text-white/50">
              A preview of every name-card look currently available. More
              templates are on the way.
            </p>
            <IdentityTemplateGallery identity={selectedIdentity} />
          </div>
        ) : (
          <div className="border border-dashed border-black/10 dark:border-white/10 rounded-2xl p-16 flex items-center justify-center text-center text-sm text-black/40 dark:text-white/40 min-h-[400px]">
            Select an identity to preview its name card
          </div>
        )}
      </div>
    </main>
  );
}

function LandingPage() {
  return (
    <div className="blur-on-modal relative min-h-[calc(100svh-56px)] bg-gradient-to-br from-purple-950 via-purple-900 to-violet-800 overflow-hidden">
      {/* Scattered fake identity cards */}
      <FakeCard
        displayName="Emma Wilson"
        context="Professional"
        name="Emma C. Wilson"
        validFrom="Mar 2023"
        className="-left-6 top-[12%] -rotate-[14deg]"
      />
      <FakeCard
        displayName="Alex Chen"
        context="Personal"
        name="Alex K. Chen"
        validFrom="Jan 2024"
        className="-right-4 top-[8%] rotate-[10deg]"
      />
      <FakeCard
        displayName="Sarah Johnson"
        context="Academic"
        name="Dr. Sarah Johnson"
        validFrom="Sep 2022"
        className="left-[4%] bottom-[6%] rotate-[17deg]"
      />
      <FakeCard
        displayName="James Miller"
        context="Social"
        name="James R. Miller"
        validFrom="Jun 2023"
        className="-right-2 bottom-[10%] -rotate-[8deg]"
      />
      <FakeCard
        displayName="Mei-Ling Wei"
        context="Family"
        name="Mei-Ling Wei"
        validFrom="Dec 2021"
        className="left-[30%] -top-4 -rotate-[5deg]"
      />
      <FakeCard
        displayName="María Santos"
        context="Work"
        name="María A. Santos"
        validFrom="Feb 2024"
        className="right-[24%] -bottom-4 rotate-[6deg]"
      />
      <FakeCard
        displayName="Liam O'Brien"
        context="Personal"
        name="Liam P. O'Brien"
        validFrom="Apr 2023"
        className="left-[18%] bottom-[22%] -rotate-[20deg] opacity-50"
      />

      {/* Hero */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10 text-center px-6 pointer-events-none">
        <h1 className="text-6xl font-bold text-white tracking-tight drop-shadow-lg mb-3">
          ContextID
        </h1>
        <p className="text-white/60 text-lg max-w-xs">
          One identity for every context
        </p>
      </div>
    </div>
  );
}

function FakeCard({
  displayName,
  context,
  name,
  validFrom,
  className,
}: {
  displayName: string;
  context: string;
  name: string;
  validFrom: string;
  className: string;
}) {
  return (
    <div
      className={`absolute w-60 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 shadow-2xl select-none ${className}`}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <span className="font-semibold text-white text-sm leading-tight">
          {displayName}
        </span>
        <span className="shrink-0 text-[10px] bg-white/20 text-white/80 px-2 py-0.5 rounded-full">
          {context}
        </span>
      </div>
      <div className="text-white/50 text-xs mb-1">{name}</div>
      <div className="text-white/30 text-[10px]">Valid from {validFrom}</div>
    </div>
  );
}
