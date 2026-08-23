export function LogoMark() {
  return (
    <svg
      width="56"
      height="56"
      viewBox="0 0 56 56"
      fill="none"
      aria-hidden="true"
      className="drop-shadow-[0_0_28px_rgba(167,139,250,0.5)]"
    >
      <rect
        x="4"
        y="4"
        width="34"
        height="34"
        rx="10"
        stroke="white"
        strokeOpacity="0.35"
        strokeWidth="2"
      />
      <rect x="18" y="18" width="34" height="34" rx="10" fill="url(#logo-mark-gradient)" />
      <defs>
        <linearGradient
          id="logo-mark-gradient"
          x1="18"
          y1="18"
          x2="52"
          y2="52"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#c4b5fd" />
          <stop offset="1" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
    </svg>
  );
}
