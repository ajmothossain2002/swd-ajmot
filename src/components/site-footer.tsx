import Link from "next/link";
import { siteNavigation } from "@/content/site";
import { PageContainer } from "@/components/ui/page-container";

export function SiteFooter() {
  return (
    <footer className="border-t border-line py-8 sm:py-10">
      <PageContainer>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link className="text-sm font-semibold tracking-tight" href="/">
              Ajmot Hossain
            </Link>
            <p className="mt-2 text-xs text-muted">Web development</p>
          </div>
          <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-5 gap-y-3">
            {siteNavigation.map((item) => (
              <Link
                className="text-xs text-muted transition-colors hover:text-ink"
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </PageContainer>
    </footer>
  );
}
