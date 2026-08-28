// Shared by every button on the sign-in card (Google, GitHub, email) so
// they all look and behave identically. While a sign-in is in flight, the
// whole button group is replaced by <AuthPendingState> instead — see
// sign-in.tsx — so this component doesn't need its own loading state.
export function AuthSubmitButton({
  variant = "outline",
  type = "button",
  onClick,
  children,
}: {
  variant?: "outline" | "solid";
  type?: "button" | "submit";
  onClick?: () => void;
  children: React.ReactNode;
}) {
  const variantClass =
    variant === "solid"
      ? "bg-white text-purple-950 hover:opacity-90"
      : "border border-white/15 text-white hover:bg-white/10";

  return (
    <button
      type={type}
      onClick={onClick}
      className={`w-full flex items-center justify-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium cursor-pointer transition-colors ${variantClass}`}
    >
      {children}
    </button>
  );
}
