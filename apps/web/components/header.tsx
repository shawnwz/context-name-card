import { auth, signOut } from "../auth";

export async function Header() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between px-6 h-14 border-b border-black/8 bg-white dark:bg-[#0a0a0a] dark:border-white/10">
      <span className="text-base font-semibold tracking-tight">ContextID</span>

      <div className="flex items-center gap-3">
        {session?.user ? (
          <>
            <span className="text-sm text-black/60 dark:text-white/60">
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
                className="text-xs border border-black/15 dark:border-white/15 rounded-md px-3 py-1 cursor-pointer hover:bg-black/5 dark:hover:bg-white/8 transition-colors"
              >
                Sign out
              </button>
            </form>
          </>
        ) : (
          <span className="text-sm text-black/40 dark:text-white/40">
            Not signed in
          </span>
        )}
      </div>
    </header>
  );
}
