import type { Metadata } from "next";
import { PageContainer } from "@/components/ui/page-container";
import { LoginForm } from "@/components/admin/login-form";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <main className="py-section" id="main-content">
      <PageContainer className="max-w-xl">
        <section aria-labelledby="admin-login-title" className="border border-line bg-surface p-7 sm:p-10">
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-muted">Private area</p>
          <h1 className="mt-3 font-display text-4xl tracking-[-0.04em] sm:text-5xl" id="admin-login-title">Admin sign in</h1>
          <p className="mt-4 text-muted">Sign in with the provisioned administrator account.</p>
          <LoginForm />
        </section>
      </PageContainer>
    </main>
  );
}
