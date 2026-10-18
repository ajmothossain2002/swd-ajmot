"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createAuthClient } from "better-auth/react";

const authClient = createAuthClient();

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const result = await authClient.signIn.email({ email: email.trim(), password, callbackURL: "/admin" });
      if (result.error) {
        setError("The email or password is incorrect. Please try again.");
        return;
      }
      router.replace("/admin");
      router.refresh();
    } catch {
      setError("Sign-in is unavailable right now. Please try again later.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
      <div>
        <label className="mb-2 block text-sm font-medium" htmlFor="admin-email">Email address</label>
        <input autoComplete="username" className="w-full rounded border border-line bg-surface px-4 py-3 text-ink" id="admin-email" name="email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium" htmlFor="admin-password">Password</label>
        <input autoComplete="current-password" className="w-full rounded border border-line bg-surface px-4 py-3 text-ink" id="admin-password" name="password" onChange={(event) => setPassword(event.target.value)} required type="password" value={password} />
      </div>
      <p aria-live="polite" className="min-h-6 text-sm text-accent" id="login-error" role="status">{error}</p>
      <button className="w-full rounded bg-accent px-5 py-3 font-medium text-accent-ink disabled:cursor-wait disabled:opacity-60" disabled={pending} type="submit">
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
