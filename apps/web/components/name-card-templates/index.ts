import { GradientTemplate } from "./gradient";
import { MinimalTemplate } from "./minimal";
import { ProfessionalTemplate } from "./professional";
import type { NameCardIdentity } from "./types";

export type { NameCardIdentity };

export const TEMPLATES = {
  gradient: { label: "Gradient", swatch: "#7c3aed", Component: GradientTemplate },
  minimal: { label: "Minimal", swatch: "#e5e5e5", Component: MinimalTemplate },
  professional: { label: "Professional", swatch: "#0f172a", Component: ProfessionalTemplate },
} as const;

export type TemplateId = keyof typeof TEMPLATES;

export const DEFAULT_TEMPLATE: TemplateId = "gradient";

export function isTemplateId(value: string): value is TemplateId {
  return value in TEMPLATES;
}
