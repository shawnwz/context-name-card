import { CoverCard, CoverTemplate, coverPageClass } from "./cover";
import { GeometricCard, GeometricTemplate, geometricPageClass } from "./geometric";
import { ProfessionalCard, ProfessionalTemplate, professionalPageClass } from "./professional";
import type { NameCardIdentity } from "./types";

export type { NameCardIdentity };

export const TEMPLATES = {
  professional: {
    label: "Professional",
    swatch: "#0f172a",
    pageClass: professionalPageClass,
    Component: ProfessionalTemplate,
    Card: ProfessionalCard,
  },
  geometric: {
    label: "Geometric",
    swatch: "#059669",
    pageClass: geometricPageClass,
    Component: GeometricTemplate,
    Card: GeometricCard,
  },
  cover: {
    label: "Cover",
    swatch: "#0369a1",
    pageClass: coverPageClass,
    Component: CoverTemplate,
    Card: CoverCard,
  },
} as const;

export type TemplateId = keyof typeof TEMPLATES;

export const DEFAULT_TEMPLATE: TemplateId = "professional";

export function isTemplateId(value: string): value is TemplateId {
  return value in TEMPLATES;
}
