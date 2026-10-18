import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page not found | Ajmot Hossain",
  description: "The requested page could not be found.",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main id="main-content" className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-6 py-20 sm:px-10">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-stone-600">
        404 · Page not found
      </p>
      <h1 className="mt-5 text-5xl font-medium tracking-[-0.05em] sm:text-7xl">
        This page isn’t here.
      </h1>
      <p className="mt-6 max-w-lg leading-7 text-stone-600">
        The address may be incorrect, or the page may have moved.
      </p>
      <Link
        className="mt-8 w-fit text-sm font-medium underline decoration-stone-400 underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-stone-900"
        href="/"
      >
        Return home
      </Link>
    </main>
  );
}
