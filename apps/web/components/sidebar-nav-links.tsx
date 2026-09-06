"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IdCard, Link2 } from "lucide-react";

const LINKS = [
  { href: "/", label: "Identities", icon: IdCard },
  { href: "/shares", label: "Shared links", icon: Link2 },
] as const;

export function SidebarNavLinks() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {LINKS.map((link) => {
        const active = pathname === link.href;
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            title={link.label}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors lg:group-data-[collapsed=true]/sidebar:justify-center lg:group-data-[collapsed=true]/sidebar:px-0 ${
              active
                ? "bg-white/15 text-white"
                : "text-white/60 hover:text-white hover:bg-white/8"
            }`}
          >
            <Icon className="size-4 shrink-0" />
            <span className="lg:group-data-[collapsed=true]/sidebar:hidden">
              {link.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
