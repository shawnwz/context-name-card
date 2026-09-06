"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, PanelLeft, X } from "lucide-react";
import { DotGridBackground } from "./dot-grid-background";

const COLLAPSED_STORAGE_KEY = "sidebar-collapsed";

// Below `lg` the sidebar becomes an off-canvas drawer (hidden by default,
// toggled by the mobile top bar) instead of a permanently-visible 224px
// column — on a phone-width screen that column ate a third or more of the
// viewport. At `lg` and up it's back to a normal persistent sidebar, which
// can additionally be collapsed to a 64px icon rail (Apple Maps-style
// toggle button, top-right of the panel) — descendants react to that via
// the `group-data-[collapsed=true]/sidebar` variant rather than a React
// context, since Sidebar's content is a server component.
export function SidebarShell({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSED_STORAGE_KEY) === "true");
    } catch {
      // localStorage unavailable (private mode, etc.) — stay expanded
    }
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(COLLAPSED_STORAGE_KEY, String(next));
      } catch {
        // ignore — per-viewer convenience only
      }
      return next;
    });
  }

  return (
    <>
      <div className="lg:hidden sticky top-0 z-30 relative flex items-center gap-3 px-4 h-14 border-b border-white/10 bg-gradient-to-r from-purple-950 to-violet-900 overflow-hidden">
        <DotGridBackground />
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Open menu"
          className="relative z-10 text-white/80 hover:text-white transition-colors p-1 -ml-1"
        >
          <Menu className="size-5" />
        </button>
        <span className="relative z-10 text-base font-semibold tracking-tight text-white">
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
        data-collapsed={collapsed}
        className={`group/sidebar w-56 ${collapsed ? "lg:w-16" : "lg:w-56"} shrink-0 h-svh fixed lg:sticky top-0 left-0 z-50 lg:z-auto border-r border-white/10 bg-gradient-to-b from-purple-950 to-violet-900 overflow-y-auto transition-[width,transform] duration-200 -translate-x-full lg:translate-x-0 ${
          isOpen ? "translate-x-0" : ""
        }`}
      >
        <DotGridBackground />
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          aria-label="Close menu"
          className="lg:hidden absolute top-4 right-4 z-20 text-white/60 hover:text-white transition-colors"
        >
          <X className="size-5" />
        </button>
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="hidden lg:flex absolute top-4 right-3 z-20 items-center justify-center size-7 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors lg:group-data-[collapsed=true]/sidebar:right-auto lg:group-data-[collapsed=true]/sidebar:left-1/2 lg:group-data-[collapsed=true]/sidebar:-translate-x-1/2"
        >
          <PanelLeft className="size-4" />
        </button>
        <div className="relative z-10 flex h-full flex-col justify-between px-4 py-6 lg:group-data-[collapsed=true]/sidebar:px-2 lg:group-data-[collapsed=true]/sidebar:pt-14">
          {children}
        </div>
      </aside>
    </>
  );
}
