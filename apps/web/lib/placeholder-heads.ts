// Professional, muted-but-distinct palette (Tailwind ~600 shades) — the
// same class of colors LinkedIn/Slack/Notion use for initials avatars.
const AVATAR_COLORS = [
  "#2563EB", // blue
  "#059669", // emerald
  "#7C3AED", // violet
  "#E11D48", // rose
  "#D97706", // amber
  "#0891B2", // cyan
  "#475569", // slate
  "#C026D3", // fuchsia
  "#EA580C", // orange
  "#0D9488", // teal
] as const;

function hashString(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

function svgToDataUri(svg: string): string {
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

// Deterministic per-identity: color from `seed` (stable even if the name
// changes later), initials from `name`.
export function getPlaceholderHeadImage(seed: string, name?: string): string {
  const color = AVATAR_COLORS[hashString(seed) % AVATAR_COLORS.length];
  const initials = getInitials(name?.trim() || seed);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" role="img" aria-label="${initials}">
  <rect width="160" height="160" fill="${color}"/>
  <text x="80" y="82" text-anchor="middle" dominant-baseline="central" font-family="system-ui, -apple-system, 'Segoe UI', sans-serif" font-size="64" font-weight="600" fill="#ffffff">${initials}</text>
</svg>`;

  return svgToDataUri(svg);
}

// Same deterministic hash as the placeholder avatar, exposed so templates
// can theme accents (patterns, rules, icon tints) to match — an identity's
// accent color stays consistent whether or not it has a real photo.
export function getAccentColor(seed: string): string {
  return AVATAR_COLORS[hashString(seed) % AVATAR_COLORS.length]!;
}

export function getIdentityHeadImage(identity: {
  id: string;
  image: string | null;
  displayName: string;
}): string {
  return identity.image ?? getPlaceholderHeadImage(identity.id, identity.displayName);
}

export function toCssImageUrl(src: string): string {
  const escaped = src.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

  return `url("${escaped}")`;
}
