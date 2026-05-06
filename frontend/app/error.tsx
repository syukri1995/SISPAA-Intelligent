"use client";

import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
          <div className="max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">SISPAA</div>
            <h1 className="mt-3 text-2xl font-bold text-slate-900">Something went wrong</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              The page hit a runtime error while loading. Try again, or refresh the app if the problem persists.
            </p>
            <button
              onClick={reset}
              className="mt-6 inline-flex items-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
