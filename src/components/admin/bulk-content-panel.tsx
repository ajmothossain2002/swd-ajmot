"use client";

import { useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";

type Counts = { projects: number; caseStudies: number; blogPosts: number };
type ImportIssue = { sheet: string; row: number; message: string };
type ImportSummary = {
  projectsCreated?: number;
  projectsUpdated?: number;
  caseStudiesCreated?: number;
  caseStudiesUpdated?: number;
  blogPostsCreated?: number;
  blogPostsUpdated?: number;
};
type ContentCollection = "projects" | "caseStudies" | "blogPosts";
type ApiResult = {
  data?: { counts?: Counts; issues?: ImportIssue[] } & ImportSummary;
  error?: { message?: string; databaseCode?: string };
};

function collectionName(collection: ContentCollection) {
  return collection === "projects" ? "projects" : collection === "caseStudies" ? "case studies" : "blog posts";
}

function collectionCount(counts: Counts, collection: ContentCollection) {
  return collection === "projects" ? counts.projects : collection === "caseStudies" ? counts.caseStudies : counts.blogPosts;
}

function formatCounts(counts: Counts, collection: ContentCollection) {
  return `${collectionCount(counts, collection)} ${collectionName(collection)}`;
}

export function BulkContentPanel({ collection }: { collection: ContentCollection }) {
  const router = useRouter();
  const label = collection === "projects" ? "Projects" : collection === "caseStudies" ? "Case studies" : "Blog posts";
  const collectionQuery = `collection=${collection}`;
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Counts | null>(null);
  const [issues, setIssues] = useState<ImportIssue[]>([]);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  function selectFile(event: ChangeEvent<HTMLInputElement>) {
    setFile(event.target.files?.[0] ?? null);
    setPreview(null);
    setIssues([]);
    setMessage("");
  }

  async function send(mode: "preview" | "apply") {
    if (!file) return;
    setPending(true);
    setMessage("");
    setIssues([]);
    try {
      const body = new FormData();
      body.set("mode", mode);
      body.set("collection", collection);
      body.set("file", file);
      const response = await fetch("/api/admin/bulk-content", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        body,
      });
      if (response.status === 401) {
        router.replace("/admin/login");
        setMessage("Your session has ended. Sign in again to continue.");
        return;
      }
      const result = await response.json().catch(() => null) as ApiResult | null;
      if (!response.ok) {
        const rowIssues = result?.data?.issues ?? [];
        if (rowIssues.length) {
          setIssues(rowIssues);
          setPreview(null);
          setMessage("Fix the listed rows, then upload the corrected file.");
        } else {
          setMessage(result?.error?.message || "The file could not be processed. Please try again.");
        }
        return;
      }

      if (mode === "preview" && result?.data?.counts) {
        setPreview(result.data.counts);
        setMessage(`File is ready to import: ${formatCounts(result.data.counts, collection)}.`);
        return;
      }

      const imported = result?.data;
      if (imported) {
        setPreview(null);
        setFile(null);
        const created = collection === "projects" ? imported.projectsCreated : collection === "caseStudies" ? imported.caseStudiesCreated : imported.blogPostsCreated;
        const updated = collection === "projects" ? imported.projectsUpdated : collection === "caseStudies" ? imported.caseStudiesUpdated : imported.blogPostsUpdated;
        setMessage(
          `Import complete: ${created ?? 0} ${label.toLowerCase()} added, ${updated ?? 0} updated.`,
        );
        window.dispatchEvent(new Event("cms-content-imported"));
        router.refresh();
      }
    } catch {
      setMessage("The request could not reach the CMS. Check database connectivity and try again.");
    } finally {
      setPending(false);
    }
  }

  function confirmImport() {
    if (!preview) return;
    const confirmed = window.confirm(
      `Import ${formatCounts(preview, collection)}? Rows with IDs will update those records, rows without IDs will create records, and omitted records will remain unchanged. Only ${label.toLowerCase()} will be imported. The batch is all-or-nothing.`,
    );
    if (confirmed) void send("apply");
  }

  return (
    <section aria-labelledby="bulk-content-title" className="mt-8 border border-line bg-surface p-5 sm:p-6">
      <div className="flex flex-col gap-5">
        <div>
          <h2 className="font-display text-xl tracking-[-0.03em]" id="bulk-content-title">Bulk import and export: {label}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
            Import or export only {label.toLowerCase()} here. For a combined JSON pack, only its matching collection is processed. Leave ID blank for a new record; the database assigns it. Keep an exported ID to update an existing record. Leave slug blank to generate it from the title or project slug. Imports never delete omitted records, and a failed row cancels this batch.
            {collection === "caseStudies" ? " Import projects first; each case study must reference an existing project by projectSlug." : null}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <a className="inline-flex min-h-11 items-center rounded border border-line px-4 py-2 text-sm font-medium hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus" href={`/api/admin/bulk-content?${collectionQuery}`}>
            Export {label} workbook
          </a>
          <a className="inline-flex min-h-11 items-center rounded border border-line px-4 py-2 text-sm font-medium hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus" href={`/api/admin/bulk-content?${collectionQuery}&format=json`}>
            Export {label} JSON
          </a>
          <a className="inline-flex min-h-11 items-center rounded border border-line px-4 py-2 text-sm font-medium hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus" href={`/api/admin/bulk-content?${collectionQuery}&template=1`}>
            Download {label.toLowerCase()} template
          </a>
        </div>

        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-end">
          <div>
            <label className="mb-2 block text-sm font-medium" htmlFor="cms-workbook">Excel workbook or JSON pack (.xlsx, .json)</label>
            <input accept=".xlsx,.json,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/json" className="block min-h-11 w-full text-sm file:mr-4 file:min-h-11 file:rounded file:border-0 file:bg-paper file:px-4 file:py-2 file:text-sm file:font-medium" id="cms-workbook" onChange={selectFile} type="file" />
          </div>
          <button className="min-h-11 rounded border border-line px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50" disabled={!file || pending} onClick={() => void send("preview")} type="button">
            {pending ? "Checking…" : "Validate file"}
          </button>
          {preview ? <button className="min-h-11 rounded bg-accent px-4 py-2 text-sm font-medium text-accent-ink disabled:cursor-wait disabled:opacity-60" disabled={pending} onClick={confirmImport} type="button">Import validated data</button> : null}
        </div>

        <p aria-live="polite" className="min-h-6 text-sm text-muted" role="status">{message}</p>
        {issues.length ? (
          <ul className="max-h-56 list-disc space-y-1 overflow-auto pl-5 text-sm text-accent" aria-label="Workbook validation errors">
            {issues.map((issue, index) => <li key={`${issue.sheet}-${issue.row}-${index}`}>{issue.sheet}{issue.row ? ` row ${issue.row}` : ""}: {issue.message}</li>)}
          </ul>
        ) : null}
        <p className="text-xs leading-5 text-muted">The workbook template contains only this section. Enter tags, capabilities, technologies, evidence, and media IDs one per line. JSON packs use a collections object with projects, caseStudies, and blogPosts arrays; this page imports only {collection}. Review publication status, approved public links, and media asset IDs before importing. Maximum upload: 5 MB and 500 records.</p>
      </div>
    </section>
  );
}
