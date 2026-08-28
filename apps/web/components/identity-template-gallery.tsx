import Link from "next/link";
import { TEMPLATES, type NameCardIdentity, type TemplateId } from "./name-card-templates";
import { ShareTemplateButton } from "./share-template-button";
import { Badge } from "@/components/ui/badge";

type Props = {
  identity: NameCardIdentity;
  activeShareByTemplate: Partial<Record<TemplateId, { token: string }>>;
};

export function IdentityTemplateGallery({ identity, activeShareByTemplate }: Props) {
  return (
    <div className="flex flex-wrap gap-6">
      {(Object.entries(TEMPLATES) as [TemplateId, (typeof TEMPLATES)[TemplateId]][]).map(
        ([id, template]) => {
          const { Card, label } = template;
          const activeShare = activeShareByTemplate[id];
          return (
            <div key={id} className="flex flex-col gap-2 flex-1 min-w-[280px]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-black/50 dark:text-white/50">
                  {label}
                </span>
                {activeShare ? (
                  <Badge
                    variant="outline"
                    render={<Link href={`/shares?token=${activeShare.token}`} />}
                    className="border-green-200 dark:border-green-900 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/40 hover:bg-green-100 dark:hover:bg-green-950/60"
                  >
                    ✓ Shared
                  </Badge>
                ) : (
                  <ShareTemplateButton identityId={identity.id} templateId={id} />
                )}
              </div>
              {/* Thin, light, uniform frame for every template in the
                  gallery — each template's own `pageClass` (its full-bleed
                  page background, some of them dark) is only meant for the
                  standalone share page, not this preview grid. */}
              <div className="rounded-2xl p-2 flex items-center justify-center min-h-[380px] bg-neutral-100 dark:bg-neutral-900">
                <Card identity={identity} />
              </div>
            </div>
          );
        },
      )}
    </div>
  );
}
