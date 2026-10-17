import { ButtonLink } from "@/components/ui/button";
import { PageContainer } from "@/components/ui/page-container";

export default function NotFound() {
  return (
    <main className="flex min-h-[65vh] items-center py-20" id="main-content">
      <PageContainer>
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">404 · Page not found</p>
          <h1 className="mt-5 font-display text-5xl leading-[0.98] tracking-[-0.055em] sm:text-7xl">This page isn’t here.</h1>
          <p className="mt-6 max-w-lg leading-7 text-muted">The address may be incorrect, or the page may have moved.</p>
          <ButtonLink className="mt-8" href="/" variant="secondary">Return home</ButtonLink>
        </div>
      </PageContainer>
    </main>
  );
}
