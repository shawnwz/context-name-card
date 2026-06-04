const PLACEHOLDER_HEAD_IMAGES = [
  "/placeholder-heads/head-01.svg",
  "/placeholder-heads/head-02.svg",
  "/placeholder-heads/head-03.svg",
  "/placeholder-heads/head-04.svg",
  "/placeholder-heads/head-05.svg",
  "/placeholder-heads/head-06.svg",
] as const;

export function getPlaceholderHeadImage(seed: string): string {
  let hash = 0;

  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }

  return (
    PLACEHOLDER_HEAD_IMAGES[hash % PLACEHOLDER_HEAD_IMAGES.length] ??
    PLACEHOLDER_HEAD_IMAGES[0]
  );
}

export function getIdentityHeadImage(identity: {
  id: string;
  image: string | null;
}): string {
  return identity.image ?? getPlaceholderHeadImage(identity.id);
}

export function toCssImageUrl(src: string): string {
  const escaped = src.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

  return `url("${escaped}")`;
}
