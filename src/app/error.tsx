"use client";

import Link from "next/link";

export default function PublicErrorBoundary({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-[55vh] max-w-3xl flex-col justify-center px-6 py-20" id="main-content">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Temporarily unavailable</p>
      <h1 className="mt-4 font-display text-4xl tracking-[-0.04em] sm:text-6xl">This page could not load.</h1>
      <p className="mt-5 max-w-xl text-sm leading-7 text-muted">Please try again. If the problem continues, return to the homepage and check back later.</p>
      <div className="mt-8 flex flex-wrap gap-5">
        <button className="text-sm font-medium underline underline-offset-4" onClick={reset} type="button">Try again</button>
        <Link className="text-sm font-medium underline underline-offset-4" href="/">Return home</Link>
      </div>
    </main>
  );
}
