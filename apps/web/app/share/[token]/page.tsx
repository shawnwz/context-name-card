import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { ShareActions } from "../../../components/share-actions";
import { DEFAULT_TEMPLATE, TEMPLATES, isTemplateId, type NameCardIdentity } from "../../../components/name-card-templates";
import { getOrigin } from "../../../lib/get-origin";
import { getSharedIdentity } from "../../../lib/get-shared-identity";

type SharedIdentity = NameCardIdentity & { template: string };

export default async function SharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const [identity, origin] = await Promise.all([
    getSharedIdentity<SharedIdentity>(token),
    getOrigin(),
  ]);

  if (!identity) notFound();

  const templateId = isTemplateId(identity.template) ? identity.template : DEFAULT_TEMPLATE;
  const { Component } = TEMPLATES[templateId];

  const qrDataUrl = await QRCode.toDataURL(`${origin}/share/${token}`, {
    margin: 1,
    width: 240,
    color: { dark: "#4c1d95", light: "#ffffff" },
  });

  return (
    <>
      <Component identity={identity} />
      <ShareActions token={token} qrDataUrl={qrDataUrl} />
    </>
  );
}
