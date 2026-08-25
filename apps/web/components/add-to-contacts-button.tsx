import { UserPlus } from "lucide-react";

export function AddToContactsButton({ token }: { token: string }) {
  return (
    <a
      href={`/share/${token}/vcard`}
      download
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 rounded-full bg-white/95 dark:bg-neutral-900/95 backdrop-blur px-5 py-2.5 text-sm font-medium text-black dark:text-white shadow-lg border border-black/10 dark:border-white/15 hover:bg-white dark:hover:bg-neutral-900 transition-colors"
    >
      <UserPlus className="size-4" />
      Add to Contacts
    </a>
  );
}
