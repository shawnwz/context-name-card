"use client";

import { useState } from "react";
import { LogoMark } from "./logo-mark";

// The sign-in card is a server component (its forms call server actions),
// so it's passed in as children rather than imported here — this component
// only toggles which view is visible.
export function LandingHero({ children }: { children: React.ReactNode }) {
  const [showSignIn, setShowSignIn] = useState(false);

  if (showSignIn) {
    return (
      <div className="relative z-10 flex flex-col items-center px-6 py-16 text-center">
        <button
          type="button"
          onClick={() => setShowSignIn(false)}
          className="mb-6 text-sm text-white/50 hover:text-white transition-colors cursor-pointer"
        >
          ← Back
        </button>
        <div className="w-full max-w-sm rounded-2xl border border-white/15 bg-white/[0.06] p-6 shadow-2xl backdrop-blur-xl sm:p-7">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-10 flex flex-col items-center px-6 py-16 text-center">
      <LogoMark />
      <h1 className="mt-6 text-5xl font-bold tracking-tight text-white sm:text-6xl">
        ContextID
      </h1>
      <p className="mt-3 max-w-xs text-lg text-white/55">
        One identity for every context
      </p>
      <button
        type="button"
        onClick={() => setShowSignIn(true)}
        className="mt-10 bg-white text-purple-950 rounded-lg px-8 py-3 text-base font-semibold cursor-pointer hover:opacity-90 transition-opacity"
      >
        Get Started
      </button>
    </div>
  );
}
