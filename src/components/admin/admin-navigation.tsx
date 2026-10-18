import Link from "next/link";
import { SignOutButton } from "@/components/admin/sign-out-button";

const links = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/projects", label: "Projects" },
  { href: "/admin/posts", label: "Blog posts" },
  { href: "/admin/case-studies", label: "Case studies" },
];

export function AdminNavigation() {
  return (
    <header className="border-b border-line pb-5">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <Link className="font-display text-xl tracking-[-0.035em]" href="/admin">Ajmot <span className="text-muted">/ Studio</span></Link>
        <div className="flex items-center gap-4">
          <Link className="text-sm text-muted underline decoration-line underline-offset-4 hover:text-ink" href="/" target="_blank">View portfolio</Link>
          <SignOutButton />
        </div>
      </div>
      <nav aria-label="Admin navigation" className="mt-5 flex flex-wrap gap-2">
        {links.map(({ href, label }) => (
          <Link className="rounded border border-line px-3 py-2 text-sm text-muted transition-colors hover:border-accent hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus" href={href} key={href}>
            {label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
