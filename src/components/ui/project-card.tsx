import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Tag } from "@/components/ui/tag";

type ProjectCardProps = {
  title: string;
  description: string;
  href: string;
  tags?: string[];
  image?: { src: string; alt: string };
  imageLoading?: "eager" | "lazy";
  actionLabel?: string;
  category?: string;
  status?: string;
  featured?: boolean;
  children?: ReactNode;
};

export function ProjectCard({
  actionLabel = "View project",
  children,
  category,
  description,
  featured = false,
  href,
  image,
  imageLoading = "lazy",
  status,
  tags = [],
  title,
}: ProjectCardProps) {
  return (
    <article className={`group ${featured ? "md:col-span-2" : ""}`}>
      <Link
        aria-label={`${actionLabel}: ${title}`}
        className="block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus"
        href={href}
      >
        <div className={`relative overflow-hidden border border-line bg-card ${featured ? "aspect-[16/7]" : "aspect-[4/3]"}`}>
          {image ? (
            <Image
              alt={image.alt}
              className="object-cover transition-transform duration-500 group-hover:scale-[1.02] motion-reduce:transform-none"
              fill
              loading={imageLoading}
              sizes="(max-width: 768px) 100vw, 50vw"
              src={image.src}
            />
          ) : (
            <div aria-label="Approved project screenshots are not available" className="absolute inset-0 flex items-end justify-between gap-6 p-5 sm:p-8" role="img">
              <span aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(135deg,transparent_49.8%,var(--color-line)_50%,transparent_50.2%)]" />
              <span className="relative max-w-[70%] font-display text-3xl leading-none tracking-[-0.05em] text-ink/75 sm:text-5xl">
                {featured ? <>Systems,<br />made useful.</> : title}
              </span>
              <span className="relative max-w-32 text-right text-[0.62rem] font-medium uppercase leading-5 tracking-[0.15em] text-muted sm:max-w-40">
                Project imagery<br />not supplied
              </span>
            </div>
          )}
        </div>
        <div className="mt-5 flex items-start justify-between gap-4">
          <div>
            {category ? <p className="mb-2 text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-accent">{category}</p> : null}
            <h3 className="text-lg font-medium tracking-[-0.02em]">{title}</h3>
            <p className="mt-2 max-w-lg text-sm leading-6 text-muted">{description}</p>
          </div>
          <span aria-hidden="true" className="mt-1 shrink-0 text-accent">
            ↗
          </span>
        </div>
      </Link>
      {status ? <p className="mt-3 text-xs leading-5 text-muted">{status}</p> : null}
      {tags.length > 0 ? (
          <ul aria-label="Project tags" className="mt-4 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <li key={tag}>
              <Tag>{tag}</Tag>
            </li>
          ))}
        </ul>
      ) : null}
      {children ? <div className="mt-4">{children}</div> : null}
    </article>
  );
}
