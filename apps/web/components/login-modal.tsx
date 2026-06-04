"use client";

import { useState, useEffect } from "react";

export function LoginModal({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      document.body.dataset.modalOpen = "true";
    } else {
      delete document.body.dataset.modalOpen;
    }
    return () => { delete document.body.dataset.modalOpen; };
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-white border border-white/20 rounded-lg px-4 py-1.5 text-sm font-medium cursor-pointer hover:bg-white/10 transition-colors"
      >
        Login
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-xl w-full max-w-sm p-6 flex flex-col gap-2">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-semibold">Sign in</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white text-xl leading-none cursor-pointer"
              >
                ×
              </button>
            </div>
            {children}
          </div>
        </div>
      )}
    </>
  );
}
