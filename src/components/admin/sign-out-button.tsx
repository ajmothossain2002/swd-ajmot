"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createAuthClient } from "better-auth/react";

const authClient = createAuthClient();

export function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function signOut() {
    setPending(true);
    setError("");
    try {
      const result = await authClient.signOut();
      if (result.error) throw new Error("Sign out could not be completed.");
      router.replace("/admin/login");
      router.refresh();
    } catch {
      setError("Sign out could not be completed.");
    } finally {
      setPending(false);
    }
  }

  return <div className="flex items-center gap-2"><span aria-live="polite" className="text-xs text-accent" role="status">{error}</span><button className="min-h-10 rounded border border-line px-4 py-2 text-sm font-medium hover:bg-surface disabled:opacity-60" disabled={pending} onClick={() => void signOut()} type="button">{pending ? "Signing out…" : "Sign out"}</button></div>;
}
