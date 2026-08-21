"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

// Below `lg` the sidebar becomes an off-canvas drawer (hidden by default,
// toggled by the mobile top bar) instead of a permanently-visible 224px
// column — on a phone-width screen that column ate a third or more of the
// viewport. At `lg` and up it's back to a normal persistent sidebar.
export function SidebarShell({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <>
      <div className="lg:hidden sticky top-0 z-30 flex items-center gap-3 px-4 h-14 border-b border-white/10 bg-gradient-to-r from-purple-950 to-violet-900">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Open menu"
          className="text-white/80 hover:text-white transition-colors p-1 -ml-1"
        >
          <Menu className="size-5" />
        </button>
        <span className="text-base font-semibold tracking-tight text-white">
          ContextID
        </span>
      </div>

      {isOpen && (
        <div
          aria-hidden="true"
          onClick={() => setIsOpen(false)}
          className="lg:hidden fixed inset-0 z-40 bg-black/40"
        />
      )}

      <aside
        className={`w-56 shrink-0 h-svh fixed lg:sticky top-0 left-0 z-50 lg:z-auto flex flex-col justify-between px-4 py-6 border-r border-white/10 bg-gradient-to-b from-purple-950 to-violet-900 overflow-y-auto transition-transform duration-200 -translate-x-full lg:translate-x-0 ${
          isOpen ? "translate-x-0" : ""
        }`}
      >
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          aria-label="Close menu"
          className="lg:hidden absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
        >
          <X className="size-5" />
        </button>
        {children}
      </aside>
    </>
  );
}
