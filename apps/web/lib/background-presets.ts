export type BackgroundPreset = {
  id: string;
  label: string;
  src: string;
};

export const BACKGROUND_PRESETS: BackgroundPreset[] = [
  { id: "teal-horizon", label: "Teal Horizon", src: "/backgrounds/teal-horizon.webp" },
  { id: "amber-dusk", label: "Amber Dusk", src: "/backgrounds/amber-dusk.webp" },
  { id: "cloud-canopy", label: "Cloud Canopy", src: "/backgrounds/cloud-canopy.webp" },
  { id: "alpine-valley", label: "Alpine Valley", src: "/backgrounds/alpine-valley.webp" },
];

export function isBackgroundPresetId(value: string): boolean {
  return BACKGROUND_PRESETS.some((preset) => preset.id === value);
}

function hashString(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash;
}

// Falls back to a deterministic per-identity pick (same hash pattern as the
// placeholder avatar color) rather than always the same preset, so
// identities that haven't picked one yet still look varied.
export function getIdentityBackgroundSrc(identity: {
  id: string;
  background: string | null;
}): string {
  const chosen = BACKGROUND_PRESETS.find((preset) => preset.id === identity.background);
  if (chosen) return chosen.src;

  return BACKGROUND_PRESETS[hashString(identity.id) % BACKGROUND_PRESETS.length]!.src;
}
