"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="glass max-w-md rounded-2xl p-8 text-center">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#ff2e7e]">Something went wrong</p>
        <h1 className="mt-2 text-2xl font-semibold">Unable to load this page</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {error.message || "An unexpected error occurred."}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button onClick={() => reset()} type="button">
            Try again
          </Button>
          <Button onClick={() => window.location.assign("/")} type="button" variant="outline">
            Go home
          </Button>
        </div>
      </div>
    </main>
  );
}
