"use client";

export default function AdminWorkspaceError({ reset }: { error: Error & { digest?: string }; reset(): void }) {
  return (
    <main className="mx-auto max-w-2xl py-16" id="main-content">
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-accent">Workspace error</p>
      <h1 className="mt-3 font-display text-3xl tracking-[-0.04em]">This page could not load</h1>
      <p className="mt-3 text-sm leading-6 text-muted">The request may have failed or the database may be temporarily unavailable. No private details are shown here.</p>
      <button className="mt-6 min-h-11 border border-line px-5 text-sm font-medium hover:border-accent" onClick={() => reset()} type="button">Try again</button>
    </main>
  );
}
