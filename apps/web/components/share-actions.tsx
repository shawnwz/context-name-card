"use client";

import { useState } from "react";
import Image from "next/image";
import { QrCode, UserPlus, X } from "lucide-react";

export function ShareActions({ token, qrDataUrl }: { token: string; qrDataUrl: string }) {
  const [showQr, setShowQr] = useState(false);

  return (
    <>
      <div className="fixed bottom-6 inset-x-0 z-10 flex items-center justify-center gap-3 px-6">
        <a
          href={`/share/${token}/vcard`}
          download
          className="flex items-center gap-2 rounded-full bg-white/95 dark:bg-neutral-900/95 backdrop-blur px-5 py-2.5 text-sm font-medium text-black dark:text-white shadow-lg border border-black/10 dark:border-white/15 hover:bg-white dark:hover:bg-neutral-900 transition-colors"
        >
          <UserPlus className="size-4" />
          Add to Contacts
        </a>
        <button
          type="button"
          onClick={() => setShowQr(true)}
          aria-label="Show QR code"
          className="flex items-center justify-center size-11 shrink-0 rounded-full bg-white/95 dark:bg-neutral-900/95 backdrop-blur text-black dark:text-white shadow-lg border border-black/10 dark:border-white/15 hover:bg-white dark:hover:bg-neutral-900 transition-colors"
        >
          <QrCode className="size-4" />
        </button>
      </div>

      {showQr && (
        <div
          className="fixed inset-0 z-20 flex items-center justify-center bg-black/70 backdrop-blur-sm px-6"
          onClick={() => setShowQr(false)}
        >
          <div
            className="relative bg-white rounded-2xl p-6 pt-10 flex flex-col items-center gap-3 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowQr(false)}
              aria-label="Close"
              className="absolute top-3 right-3 flex items-center justify-center size-7 rounded-full text-black/50 hover:bg-black/5 transition-colors"
            >
              <X className="size-4" />
            </button>
            <Image
              src={qrDataUrl}
              alt="QR code linking to this shared card"
              width={224}
              height={224}
              unoptimized
              className="size-56 rounded-lg"
            />
            <p className="text-xs text-black/50 text-center">Scan to open this card</p>
          </div>
        </div>
      )}
    </>
  );
}
