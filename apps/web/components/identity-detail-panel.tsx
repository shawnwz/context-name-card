import { prisma } from "@repo/database";
import { IdentityTemplateGallery } from "./identity-template-gallery";

export async function IdentityDetailPanel({
  userId,
  identityId,
}: {
  userId: string;
  identityId: string;
}) {
  const identity = await prisma.identity.findFirst({
    where: { id: identityId, userId },
  });

  if (!identity) {
    return (
      <div className="border border-dashed border-black/10 dark:border-white/10 rounded-2xl p-8 sm:p-16 flex items-center justify-center text-center text-sm text-black/40 dark:text-white/40 min-h-[200px] sm:min-h-[400px]">
        Identity not found.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">
        {identity.courtesyTitle && `${identity.courtesyTitle} `}
        {identity.displayName}
      </h2>
      <p className="text-sm text-black/50 dark:text-white/50">
        A preview of every name-card look currently available. More
        templates are on the way.
      </p>
      <IdentityTemplateGallery identity={identity} />
    </div>
  );
}
