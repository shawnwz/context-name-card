import { TEMPLATES, type NameCardIdentity, type TemplateId } from "./name-card-templates";
import { ShareTemplateButton } from "./share-template-button";

export function IdentityTemplateGallery({ identity }: { identity: NameCardIdentity }) {
  return (
    <div className="grid sm:grid-cols-2 gap-6">
      {(Object.entries(TEMPLATES) as [TemplateId, (typeof TEMPLATES)[TemplateId]][]).map(
        ([id, template]) => {
          const { Card, label, pageClass } = template;
          return (
            <div key={id} className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-black/50 dark:text-white/50">
                  {label}
                </span>
                <ShareTemplateButton identityId={identity.id} templateId={id} />
              </div>
              <div
                className={`${pageClass} rounded-2xl p-8 flex items-center justify-center min-h-[380px]`}
              >
                <Card identity={identity} />
              </div>
            </div>
          );
        },
      )}
    </div>
  );
}
