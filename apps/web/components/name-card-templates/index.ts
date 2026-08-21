import { CoverCard, CoverTemplate, coverPageClass } from "./cover";
import { DuotoneCard, DuotoneTemplate, duotonePageClass } from "./duotone";
import { GeometricCard, GeometricTemplate, geometricPageClass } from "./geometric";
import { GradientCard, GradientTemplate, gradientPageClass } from "./gradient";
import { MinimalCard, MinimalTemplate, minimalPageClass } from "./minimal";
import { ProfessionalCard, ProfessionalTemplate, professionalPageClass } from "./professional";
import type { NameCardIdentity } from "./types";

export type { NameCardIdentity };

export const TEMPLATES = {
  gradient: {
    label: "Gradient",
    swatch: "#7c3aed",
    pageClass: gradientPageClass,
    Component: GradientTemplate,
    Card: GradientCard,
  },
  minimal: {
    label: "Minimal",
    swatch: "#e5e5e5",
    pageClass: minimalPageClass,
    Component: MinimalTemplate,
    Card: MinimalCard,
  },
  professional: {
    label: "Professional",
    swatch: "#0f172a",
    pageClass: professionalPageClass,
    Component: ProfessionalTemplate,
    Card: ProfessionalCard,
  },
  duotone: {
    label: "Duotone",
    swatch: "#4338ca",
    pageClass: duotonePageClass,
    Component: DuotoneTemplate,
    Card: DuotoneCard,
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

export const DEFAULT_TEMPLATE: TemplateId = "gradient";

export function isTemplateId(value: string): value is TemplateId {
  return value in TEMPLATES;
}
