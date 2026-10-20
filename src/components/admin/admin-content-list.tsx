"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Resource = "projects" | "posts" | "case-studies";
type ContentRow = {
  id: string;
  slug: string;
  title?: string;
  summary?: string;
  description?: string;
  category?: string;
  visibility?: "PUBLIC" | "PRIVATE";
  status?: "DRAFT" | "PUBLISHED" | string;
  updatedAt: string;
  project?: { title: string };
};
type ListResponse = {
  data: ContentRow[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
};

const resourceLabels: Record<Resource, string> = {
  projects: "Projects",
  posts: "Blog posts",
  "case-studies": "Case studies",
};

function editHref(resource: Resource, id: string) {
  return `/admin/${resource}/${id}/edit`;
}

export function AdminContentList({ resource }: { resource: Resource }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingId, setPendingId] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ page: String(page), pageSize: "20" });
    if (query) params.set("q", query);
    if (statusFilter) params.set(resource === "projects" ? "visibility" : "status", statusFilter);
    try {
      const response = await fetch(`/api/admin/${resource}?${params}`, { cache: "no-store", credentials: "same-origin" });
      if (response.status === 401) {
        router.replace("/admin/login");
        return;
      }
      const body = await response.json().catch(() => null) as (ListResponse & { error?: { message?: string } }) | null;
      if (!response.ok) throw new Error(body?.error?.message || "The content list could not be loaded.");
      if (!body || !Array.isArray(body.data) || !body.pagination) throw new Error("The server returned an unexpected content response.");
      setResult(body);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The content list could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [page, query, resource, router, statusFilter]);

  useEffect(() => { queueMicrotask(() => { void load(); }); }, [load]);

  useEffect(() => {
    const refreshAfterImport = () => { void load(); };
    window.addEventListener("cms-content-imported", refreshAfterImport);
    return () => window.removeEventListener("cms-content-imported", refreshAfterImport);
  }, [load]);

  async function setPublication(row: ContentRow) {
    const field = resource === "projects" ? "visibility" : "status";
    const current = resource === "projects" ? row.visibility : row.status;
    const next = resource === "projects" ? current === "PUBLIC" ? "PRIVATE" : "PUBLIC" : current === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    setPendingId(row.id);
    setError("");
    try {
      const response = await fetch(`/api/admin/${resource}/${row.id}`, {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ [field]: next }),
      });
      if (response.status === 401) { router.replace("/admin/login"); return; }
      const body = await response.json().catch(() => null) as { error?: { message?: string } } | null;
      if (!response.ok) throw new Error(body?.error?.message || "The publication status could not be changed.");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The publication status could not be changed.");
    } finally {
      setPendingId("");
    }
  }

  async function remove(row: ContentRow) {
    const label = row.title ?? row.project?.title ?? row.slug;
    if (!window.confirm(`Delete “${label}”? This cannot be undone.`)) return;
    setPendingId(row.id);
    setError("");
    try {
      const response = await fetch(`/api/admin/${resource}/${row.id}`, {
        method: "DELETE",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ confirmation: "DELETE" }),
      });
      if (response.status === 401) { router.replace("/admin/login"); return; }
      const body = await response.json().catch(() => null) as { error?: { message?: string } } | null;
      if (!response.ok) throw new Error(body?.error?.message || "The item could not be deleted.");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The item could not be deleted.");
    } finally {
      setPendingId("");
    }
  }

  const items = result?.data ?? [];
  const pagination = result?.pagination;
  const createHref = `/admin/${resource}/new`;

  return (
    <section aria-label={`${resourceLabels[resource]} list`} className="mt-8">
      <div className="flex flex-col gap-4 border-b border-line pb-5 lg:flex-row lg:items-end lg:justify-between">
        <form className="flex w-full flex-col gap-3 sm:flex-row lg:max-w-3xl" onSubmit={(event) => { event.preventDefault(); setPage(1); setQuery(search.trim()); }}>
          <div className="min-w-0 flex-1">
            <label className="sr-only" htmlFor={`${resource}-search`}>Search {resourceLabels[resource].toLowerCase()}</label>
            <input className="min-h-11 w-full border border-line bg-surface px-3 text-sm text-ink placeholder:text-muted" id={`${resource}-search`} onChange={(event) => setSearch(event.target.value)} placeholder="Search by title or content" value={search} />
          </div>
          <label className="sr-only" htmlFor={`${resource}-status`}>{resource === "projects" ? "Visibility" : "Publication status"}</label>
          <select className="min-h-11 border border-line bg-surface px-3 text-sm text-ink" id={`${resource}-status`} onChange={(event) => { setPage(1); setStatusFilter(event.target.value); }} value={statusFilter}>
            <option value="">All statuses</option>
            {resource === "projects" ? <><option value="PRIVATE">Private</option><option value="PUBLIC">Public</option></> : <><option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option></>}
          </select>
          <button className="min-h-11 border border-line px-5 text-sm font-medium hover:border-accent" type="submit">Search</button>
        </form>
        <Link className="inline-flex min-h-11 items-center justify-center bg-accent px-5 text-sm font-medium text-accent-ink hover:opacity-90" href={createHref}>Create {resource === "posts" ? "post" : resource === "case-studies" ? "case study" : "project"}</Link>
      </div>

      <p aria-live="polite" className="min-h-6 py-2 text-sm text-accent" role="status">{error}</p>
      {loading ? <p aria-live="polite" className="py-12 text-sm text-muted" role="status">Loading {resourceLabels[resource].toLowerCase()}…</p> : null}
      {!loading && !error && items.length === 0 ? (
        <div className="border border-dashed border-line px-5 py-12 text-center">
          <h2 className="font-display text-2xl">Nothing here yet</h2>
          <p className="mt-2 text-sm text-muted">Create your first {resource === "posts" ? "post" : resource === "case-studies" ? "case study" : "project"}, or adjust your search.</p>
        </div>
      ) : null}

      {!loading && items.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[46rem] border-collapse text-left text-sm">
            <thead><tr className="border-b border-line text-xs uppercase tracking-[0.12em] text-muted"><th className="py-3 pr-4 font-medium">Content</th><th className="py-3 pr-4 font-medium">Status</th><th className="py-3 pr-4 font-medium">Updated</th><th className="py-3 text-right font-medium">Actions</th></tr></thead>
            <tbody className="divide-y divide-line">
              {items.map((row) => {
                const title = row.title ?? row.project?.title ?? row.slug;
                const status = resource === "projects" ? row.visibility : row.status;
                const published = resource === "projects" ? status === "PUBLIC" : status === "PUBLISHED";
                return (
                  <tr className="align-top" key={row.id}>
                    <td className="py-4 pr-4">
                      <Link className="font-medium hover:text-accent" href={editHref(resource, row.id)}>{title}</Link>
                      <p className="mt-1 text-xs text-muted">/{resource === "posts" ? "blog/" : resource === "case-studies" ? "work/" : ""}{row.slug}{row.category ? ` · ${row.category}` : ""}</p>
                    </td>
                    <td className="py-4 pr-4"><span className={`inline-flex border px-2 py-1 text-[0.7rem] uppercase tracking-[0.1em] ${published ? "border-accent/50 text-accent" : "border-line text-muted"}`}>{resource === "projects" ? published ? "Public" : "Private" : published ? "Published" : "Draft"}</span></td>
                    <td className="py-4 pr-4 text-xs text-muted"><time dateTime={row.updatedAt}>{new Date(row.updatedAt).toLocaleDateString("en", { dateStyle: "medium" })}</time></td>
                    <td className="py-4 text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Link className="border border-line px-3 py-2 text-xs hover:border-accent" href={editHref(resource, row.id)}>Edit</Link>
                        <button className="border border-line px-3 py-2 text-xs hover:border-accent disabled:opacity-50" disabled={pendingId === row.id} onClick={() => void setPublication(row)} type="button">
                          {pendingId === row.id ? "Saving…" : resource === "projects" ? published ? "Make private" : "Make public" : published ? "Unpublish" : "Publish"}
                        </button>
                        <button className="border border-line px-3 py-2 text-xs text-muted hover:border-red-400 hover:text-red-300 disabled:opacity-50" disabled={pendingId === row.id} onClick={() => void remove(row)} type="button">Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}

      {pagination && pagination.totalPages > 1 ? (
        <nav aria-label="Pagination" className="mt-6 flex items-center justify-between border-t border-line pt-4">
          <p className="text-sm text-muted">Page {pagination.page} of {pagination.totalPages} · {pagination.total} items</p>
          <div className="flex gap-2">
            <button className="min-h-10 border border-line px-3 text-sm disabled:opacity-40" disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)} type="button">Previous</button>
            <button className="min-h-10 border border-line px-3 text-sm disabled:opacity-40" disabled={page >= pagination.totalPages || loading} onClick={() => setPage((value) => value + 1)} type="button">Next</button>
          </div>
        </nav>
      ) : null}
    </section>
  );
}
