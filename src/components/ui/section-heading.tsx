import type { ElementType } from "react";

type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  as?: ElementType;
  compact?: boolean;
  id?: string;
};

export function SectionHeading({
  as: Heading = "h2",
  compact = false,
  eyebrow,
  id,
  title,
}: SectionHeadingProps) {
  return (
    <div>
      {eyebrow ? (
        <p className="mb-3 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-accent">
          {eyebrow}
        </p>
      ) : null}
      <Heading
        className={`${compact ? "text-2xl" : "text-3xl sm:text-4xl"} font-display leading-tight tracking-[-0.04em]`}
        id={id}
      >
        {title}
      </Heading>
    </div>
  );
}
