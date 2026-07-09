"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/Toaster";

/**
 * Boots the in-browser mock REST API (MSW) before rendering the app so the
 * first data fetches are always intercepted. In tests the node server from
 * vitest.setup.ts is already listening, so the worker is skipped.
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  const [mockApiReady, setMockApiReady] = useState(process.env.NODE_ENV === "test");
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: 1, staleTime: 15_000, refetchOnWindowFocus: false },
        },
      }),
  );

  useEffect(() => {
    if (mockApiReady) return;
    let cancelled = false;
    import("@/lib/msw/browser")
      .then(({ startMockApi }) => startMockApi())
      .then(() => {
        if (!cancelled) setMockApiReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [mockApiReady]);

  if (!mockApiReady) {
    return (
      <div className="flex min-h-screen items-center justify-center" role="status">
        <p className="text-sm text-slate-500">Starting mock API…</p>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster />
    </QueryClientProvider>
  );
}
