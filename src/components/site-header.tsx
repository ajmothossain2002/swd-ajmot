import Link from "next/link";
import { siteNavigation } from "@/content/site";
import { ButtonLink } from "@/components/ui/button";
import { PageContainer } from "@/components/ui/page-container";

export function SiteHeader() {
  return (
    <header className="relative z-10 border-b border-line">
      <PageContainer>
        <div className="flex min-h-20 items-center justify-between gap-5 py-4">
          <Link
            aria-label="Ajmot Hossain — home"
            className="shrink-0 text-sm font-semibold tracking-[-0.03em]"
            href="/"
          >
            Ajmot Hossain
          </Link>

          <nav aria-label="Main navigation" className="hidden items-center gap-5 xl:flex">
            {siteNavigation.map((item) => (
              <Link
                className="text-[0.8rem] text-muted transition-colors hover:text-ink"
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            ))}
            <ButtonLink className="ml-1" href="/contact" size="small" variant="primary">
              Start a project
            </ButtonLink>
          </nav>

          <details className="mobile-navigation group relative xl:hidden">
            <summary
              aria-controls="mobile-navigation-panel"
              aria-label="Toggle navigation menu"
              className="flex min-h-11 cursor-pointer list-none items-center gap-3 rounded-pill border border-line px-4 text-sm font-medium [&::-webkit-details-marker]:hidden"
            >
              <span>Menu</span>
              <span aria-hidden="true" className="menu-icon">
                <span />
                <span />
              </span>
            </summary>
            <nav
              aria-label="Mobile navigation"
              className="absolute right-0 top-[calc(100%+0.75rem)] z-20 w-[min(19rem,calc(100vw-2.5rem))] border border-line bg-surface p-3 shadow-[0_1rem_3rem_rgb(27_28_25_/_0.12)]"
              id="mobile-navigation-panel"
            >
              {siteNavigation.map((item) => (
                <Link
                  className="block border-b border-line px-3 py-3 text-sm last:border-b-0 hover:text-accent"
                  href={item.href}
                  key={item.href}
                >
                  {item.label}
                </Link>
              ))}
              <ButtonLink className="mt-3 w-full" href="/contact" variant="primary">
                Start a project
              </ButtonLink>
            </nav>
          </details>
        </div>
      </PageContainer>
    </header>
  );
}
