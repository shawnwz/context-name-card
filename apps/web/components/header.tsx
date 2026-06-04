import { auth, signOut } from "../auth";
import { LoginModal } from "./login-modal";
import { SignIn } from "./sign-in";

export async function Header() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between px-6 h-14 border-b border-white/10 bg-gradient-to-r from-purple-950 to-violet-800">
      <span className="text-base font-semibold tracking-tight text-white">ContextID</span>

      <div className="flex items-center gap-3">
        {session?.user ? (
          <>
            <span className="text-sm text-white/60">
              {session.user.email}
            </span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button
                type="submit"
                className="text-xs text-white border border-white/20 rounded-md px-3 py-1 cursor-pointer hover:bg-white/10 transition-colors"
              >
                Sign out
              </button>
            </form>
          </>
        ) : (
          <LoginModal>
            <SignIn />
          </LoginModal>
        )}
      </div>
    </header>
  );
}
