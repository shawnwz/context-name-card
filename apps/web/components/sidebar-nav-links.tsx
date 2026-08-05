"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Identities" },
  { href: "/shares", label: "Shared links" },
] as const;

export function SidebarNavLinks() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {LINKS.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              active
                ? "bg-white/15 text-white"
                : "text-white/60 hover:text-white hover:bg-white/8"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
