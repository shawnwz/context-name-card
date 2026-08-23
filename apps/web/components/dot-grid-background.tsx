// Brand dot-grid texture (purple-950/violet-800 gradient chrome) — shared by
// the landing hero and the sidebar so both use the exact same dot color/size.
export function DotGridBackground({
  className = "",
  vignette = false,
}: {
  className?: string;
  vignette?: boolean;
}) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 ${className}`}
      style={{
        backgroundImage:
          "radial-gradient(circle, rgba(196,181,253,0.45) 1.5px, transparent 1.5px)",
        backgroundSize: "28px 28px",
        ...(vignette
          ? {
              maskImage:
                "radial-gradient(ellipse 65% 60% at 50% 45%, black 35%, transparent 95%)",
              WebkitMaskImage:
                "radial-gradient(ellipse 65% 60% at 50% 45%, black 35%, transparent 95%)",
            }
          : {}),
      }}
    />
  );
}
