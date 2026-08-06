import Link from "next/link";
import { LoginModal } from "./login-modal";
import { SignIn } from "./sign-in";

// Only rendered for signed-out visitors (the landing page) — once signed in,
// the Sidebar takes over as the app's persistent nav/chrome.
export function Header() {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between px-6 h-14 border-b border-white/10 bg-gradient-to-r from-purple-950 to-violet-800">
      <Link
        href="/"
        className="text-base font-semibold tracking-tight text-white hover:opacity-85 transition-opacity"
      >
        ContextID
      </Link>

      <LoginModal>
        <SignIn />
      </LoginModal>
    </header>
  );
}
