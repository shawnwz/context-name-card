import { notFound } from "next/navigation";
import { AddToContactsButton } from "../../../components/add-to-contacts-button";
import { DEFAULT_TEMPLATE, TEMPLATES, isTemplateId, type NameCardIdentity } from "../../../components/name-card-templates";
import { getSharedIdentity } from "../../../lib/get-shared-identity";

type SharedIdentity = NameCardIdentity & { template: string };

export default async function SharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const identity = await getSharedIdentity<SharedIdentity>(token);

  if (!identity) notFound();

  const templateId = isTemplateId(identity.template) ? identity.template : DEFAULT_TEMPLATE;
  const { Component } = TEMPLATES[templateId];

  return (
    <>
      <Component identity={identity} />
      <AddToContactsButton token={token} />
    </>
  );
}
