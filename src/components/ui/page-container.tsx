import type { HTMLAttributes, ReactNode } from "react";

type PageContainerProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export function PageContainer({ children, className = "", ...props }: PageContainerProps) {
  return (
    <div className={`mx-auto w-full max-w-site px-gutter ${className}`} {...props}>
      {children}
    </div>
  );
}
