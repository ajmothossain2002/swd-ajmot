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
  actionLabel?: string;
  children?: ReactNode;
};

export function ProjectCard({
  actionLabel = "View project",
  children,
  description,
  href,
  image,
  tags = [],
  title,
}: ProjectCardProps) {
  return (
    <article className="group">
      <Link
        aria-label={`${actionLabel}: ${title}`}
        className="block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus"
        href={href}
      >
        <div className="relative aspect-[4/3] overflow-hidden border border-line bg-accent-soft">
          {image ? (
            <Image
              alt={image.alt}
              className="object-cover transition-transform duration-500 group-hover:scale-[1.02] motion-reduce:transform-none"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              src={image.src}
            />
          ) : (
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-[linear-gradient(135deg,transparent_49.8%,var(--color-line)_50%,transparent_50.2%)]"
            />
          )}
        </div>
        <div className="mt-5 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-medium tracking-[-0.02em]">{title}</h3>
            <p className="mt-2 max-w-lg text-sm leading-6 text-muted">{description}</p>
          </div>
          <span aria-hidden="true" className="mt-1 shrink-0 text-accent">
            ↗
          </span>
        </div>
      </Link>
      {tags.length > 0 ? (
        <ul aria-label="Project technologies" className="mt-4 flex flex-wrap gap-2">
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
