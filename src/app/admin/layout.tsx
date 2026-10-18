import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Admin | Ajmot Hossain", template: "%s | Admin" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="admin-area min-h-screen">{children}</div>;
}
