import { notFound } from "next/navigation";
import { DEFAULT_TEMPLATE, TEMPLATES, isTemplateId, type NameCardIdentity } from "../../../components/name-card-templates";

const API_URL = process.env.API_URL ?? "http://localhost:4000";

type SharedIdentity = NameCardIdentity & { template: string };

async function getSharedIdentity(token: string): Promise<SharedIdentity | null> {
  const res = await fetch(`${API_URL}/shares/${token}`, { cache: "no-store" });
  if (res.status === 404 || res.status === 410) return null;
  if (!res.ok) return null;
  return res.json();
}

export default async function SharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const identity = await getSharedIdentity(token);

  if (!identity) notFound();

  const templateId = isTemplateId(identity.template) ? identity.template : DEFAULT_TEMPLATE;
  const { Component } = TEMPLATES[templateId];

  return <Component identity={identity} />;
}
