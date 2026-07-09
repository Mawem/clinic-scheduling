"use client";

import { useSyncExternalStore } from "react";

/** Matches Tailwind's `sm` breakpoint: below 640px is "mobile". */
const QUERY = "(max-width: 639px)";

function subscribe(callback: () => void) {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

export function useIsMobile(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false, // server snapshot: render desktop, correct on hydration
  );
}
