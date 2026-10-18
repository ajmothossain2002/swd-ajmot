"use client";

import Link from "next/link";

export default function AdminError({ reset }: { error: Error & { digest?: string }; reset(): void }) {
  return (
    <main className="mx-auto max-w-2xl px-5 py-16" id="main-content">
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-accent">Admin workspace</p>
      <h1 className="mt-3 font-display text-3xl tracking-[-0.04em]">The workspace could not be opened</h1>
      <p className="mt-3 text-sm leading-6 text-muted">Check the database and authentication configuration, then try again. Private error details are not displayed.</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <button className="min-h-11 border border-line px-5 text-sm font-medium hover:border-accent" onClick={() => reset()} type="button">Try again</button>
        <Link className="inline-flex min-h-11 items-center border border-line px-5 text-sm hover:border-accent" href="/admin/login">Go to sign in</Link>
      </div>
    </main>
  );
}
