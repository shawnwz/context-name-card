import Link from "next/link";
import { auth, signOut } from "../auth";
import { SidebarNavLinks } from "./sidebar-nav-links";
import { SidebarShell } from "./sidebar-shell";

export async function Sidebar() {
  const session = await auth();

  return (
    <SidebarShell>
      <div className="flex flex-col gap-6">
        <Link
          href="/"
          className="px-3 text-base font-semibold tracking-tight text-white hover:opacity-85 transition-opacity"
        >
          ContextID
        </Link>

        <SidebarNavLinks />
      </div>

      {session?.user && (
        <div className="flex flex-col gap-3 px-3">
          <span className="text-xs text-white/50 truncate">{session.user.email}</span>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="w-full text-xs text-white border border-white/20 rounded-md px-3 py-1.5 cursor-pointer hover:bg-white/10 transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      )}
    </SidebarShell>
  );
}
