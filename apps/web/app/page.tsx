import { auth } from "../auth";
import { SignIn } from "../components/sign-in";
import { CreateIdentityDialog } from "../components/create-identity-dialog";
import { EditIdentityDialog } from "../components/edit-identity-dialog";
import { DeleteIdentityButton } from "../components/delete-identity-button";
import { prisma } from "@repo/database";

export default async function Home() {
  const session = await auth();

  if (!session?.user) {
    return (
      <main className="flex flex-col items-center justify-center min-h-[calc(100svh-56px)] gap-4 p-8">
        <SignIn />
      </main>
    );
  }

  const [systemContexts, userContexts, identities] = await Promise.all([
    prisma.identityContext.findMany({ where: { userId: null }, orderBy: { name: "asc" } }),
    prisma.identityContext.findMany({ where: { userId: session.user.id }, orderBy: { name: "asc" } }),
    prisma.identity.findMany({
      where: { userId: session.user.id },
      include: { context: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const usedContextIds = new Set(identities.map((i) => i.contextId));
  const availableSystemContexts = systemContexts.filter((c) => !usedContextIds.has(c.id));
  const availableUserContexts = userContexts.filter((c) => !usedContextIds.has(c.id));

  return (
    <main className="max-w-2xl mx-auto px-6 py-10 flex flex-col gap-6">
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
          {identities.map((identity) => (
            <li
              key={identity.id}
              className="border border-black/8 dark:border-white/10 rounded-xl p-4 flex flex-col gap-1"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{identity.displayName}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-black/40 dark:text-white/40 bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded-full">
                    {identity.context.name}
                  </span>
                  <EditIdentityDialog
                    identity={{
                      id: identity.id,
                      contextName: identity.context.name,
                      givenName: identity.givenName,
                      familyName: identity.familyName,
                      additionalGivenName: identity.additionalGivenName,
                      secondaryFamilyName: identity.secondaryFamilyName,
                      displayName: identity.displayName,
                      validFrom: identity.validFrom.toISOString(),
                      validTo: identity.validTo?.toISOString() ?? null,
                      image: identity.image,
                    }}
                  />
                  <DeleteIdentityButton identityId={identity.id} />
                </div>
              </div>
              <span className="text-sm text-black/60 dark:text-white/60">
                {identity.givenName} {identity.additionalGivenName ?? ""} {identity.familyName}
                {identity.secondaryFamilyName ? ` (${identity.secondaryFamilyName})` : ""}
              </span>
              <span className="text-xs text-black/40 dark:text-white/40">
                Valid from {identity.validFrom.toLocaleDateString()}
                {identity.validTo ? ` · until ${identity.validTo.toLocaleDateString()}` : ""}
              </span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
