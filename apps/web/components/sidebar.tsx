import Link from "next/link";
import { LogOut } from "lucide-react";
import { auth, signOut } from "../auth";
import { AccountActionsMenu } from "./account-actions-menu";
import { SidebarNavLinks } from "./sidebar-nav-links";
import { SidebarShell } from "./sidebar-shell";

export async function Sidebar() {
  const session = await auth();

  return (
    <SidebarShell>
      <div className="flex flex-col gap-6">
        <Link
          href="/"
          title="ContextID"
          className="px-3 text-base font-semibold tracking-tight text-white hover:opacity-85 transition-opacity lg:group-data-[collapsed=true]/sidebar:hidden"
        >
          ContextID
        </Link>

        <SidebarNavLinks />
      </div>

      {session?.user && (
        <div className="flex flex-col gap-3 px-3 lg:group-data-[collapsed=true]/sidebar:px-0 lg:group-data-[collapsed=true]/sidebar:items-center">
          <div className="flex items-center justify-between gap-2 lg:group-data-[collapsed=true]/sidebar:justify-center">
            <span className="text-xs text-white/50 truncate lg:group-data-[collapsed=true]/sidebar:hidden">
              {session.user.email}
            </span>
            <AccountActionsMenu userId={session.user.id} email={session.user.email!} />
          </div>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
            className="lg:group-data-[collapsed=true]/sidebar:w-full"
          >
            <button
              type="submit"
              title="Sign out"
              className="w-full flex items-center justify-center gap-1.5 text-xs text-white border border-white/20 rounded-md px-3 py-1.5 cursor-pointer hover:bg-white/10 transition-colors"
            >
              <LogOut className="size-3.5 shrink-0" />
              <span className="lg:group-data-[collapsed=true]/sidebar:hidden">Sign out</span>
            </button>
          </form>
        </div>
      )}
    </SidebarShell>
  );
}
