"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { renderSafeMarkdown } from "@/lib/safe-markdown.mjs";
import { MediaPicker } from "@/components/admin/media-picker";

type Kind = "projects" | "posts" | "case-studies";
type Fields = Record<string, string>;
type RecordData = Record<string, unknown> & { id: string; slug: string; title?: string; project?: { id: string; title: string } };
type ProjectOption = { id: string; slug: string; title: string; visibility: string };
type ApiError = Error & { code?: string; status?: number };

const labels: Record<Kind, string> = { projects: "Project", posts: "Blog post", "case-studies": "Case study" };
const pluralLabels: Record<Kind, string> = { projects: "Projects", posts: "Blog posts", "case-studies": "Case studies" };

function blankFields(kind: Kind): Fields {
  if (kind === "projects") return { title: "", slug: "", summary: "", category: "", status: "", visibility: "PRIVATE", featured: "false", sortOrder: "0", coverImageId: "", tags: "" };
  if (kind === "posts") return { title: "", slug: "", description: "", category: "", markdown: "", status: "DRAFT", coverImageId: "", tags: "" };
  return { slug: "", projectId: "", status: "DRAFT", problem: "", businessContext: "", role: "", approach: "", capabilities: "", capabilityLabel: "", challenges: "[]", architectureNote: "", technologies: "", evidence: "", publicLinks: "[]", screenshotAssetIds: "" };
}

const asText = (value: unknown) => typeof value === "string" ? value : "";
const asLines = (value: unknown) => Array.isArray(value) ? value.filter((item): item is string => typeof item === "string").join("\n") : "";

function toFields(kind: Kind, item: RecordData): Fields {
  if (kind === "projects") return {
    title: asText(item.title), slug: asText(item.slug), summary: asText(item.summary), category: asText(item.category), status: asText(item.status),
    visibility: asText(item.visibility) || "PRIVATE", featured: item.featured === true ? "true" : "false", sortOrder: String(item.sortOrder ?? 0),
    coverImageId: asText(item.coverImageId), tags: asLines((item.tags as { name: string }[] | undefined)?.map((tag) => tag.name)),
  };
  if (kind === "posts") return {
    title: asText(item.title), slug: asText(item.slug), description: asText(item.description), category: asText(item.category), markdown: asText(item.markdown),
    status: asText(item.status) || "DRAFT", coverImageId: asText(item.coverImageId), tags: asLines((item.tags as { name: string }[] | undefined)?.map((tag) => tag.name)),
  };
  return {
    slug: asText(item.slug), projectId: asText(item.projectId) || asText(item.project?.id), status: asText(item.status) || "DRAFT",
    problem: asText(item.problem), businessContext: asText(item.businessContext), role: asText(item.role), approach: asText(item.approach),
    capabilities: asLines(item.capabilities), capabilityLabel: asText(item.capabilityLabel), challenges: JSON.stringify(item.challenges ?? [], null, 2),
    architectureNote: asText(item.architectureNote), technologies: asLines(item.technologies), evidence: asLines(item.evidence),
    publicLinks: JSON.stringify(item.publicLinks ?? [], null, 2),
    screenshotAssetIds: asLines((item.screenshots as { mediaAsset?: { id: string } }[] | undefined)?.map((image) => image.mediaAsset?.id).filter((id): id is string => Boolean(id))),
  };
}

function makeError(message: string, code?: string, status?: number): ApiError {
  return Object.assign(new Error(message), { code, status });
}

async function requestAdmin(path: string, router: ReturnType<typeof useRouter>, init?: RequestInit) {
  const response = await fetch(path, { credentials: "same-origin", cache: "no-store", ...init });
  if (response.status === 401) {
    router.replace("/admin/login");
    throw makeError("Your session has ended. Sign in again to continue.", "UNAUTHORIZED", 401);
  }
  const body = await response.json().catch(() => null) as { data?: unknown; pagination?: { totalPages?: number }; error?: { code?: string; message?: string } } | null;
  if (!response.ok) throw makeError(body?.error?.message || "The request could not be completed.", body?.error?.code, response.status);
  return body;
}

async function requestAll<T>(path: string, router: ReturnType<typeof useRouter>): Promise<T[]> {
  const first = await requestAdmin(`${path}?page=1&pageSize=100`, router) as { data?: T[]; pagination?: { totalPages?: number } } | null;
  if (!Array.isArray(first?.data)) return [];
  const values = [...first.data];
  for (let page = 2; page <= (first.pagination?.totalPages ?? 1); page += 1) {
    const next = await requestAdmin(`${path}?page=${page}&pageSize=100`, router) as { data?: T[] } | null;
    if (Array.isArray(next?.data)) values.push(...next.data);
  }
  return values;
}

function slugFromTitle(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}

function lines(value: string) {
  return value.split(/[\n,]/).map((item) => item.trim()).filter(Boolean);
}

function nullable(value: string) {
  return value.trim() || null;
}

function Field({ label, value, onChange, required, type = "text", hint, min, max }: {
  label: string; value: string; onChange(value: string): void; required?: boolean; type?: string; hint?: string; min?: number; max?: number;
}) {
  const id = `field-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return (
    <div>
      <label className="mb-2 block text-sm font-medium" htmlFor={id}>{label}{required ? <span aria-hidden="true" className="ml-1 text-accent">*</span> : null}</label>
      <input className="min-h-11 w-full border border-line bg-card px-3 py-2 text-sm text-ink placeholder:text-muted" id={id} max={max} min={min} onChange={(event) => onChange(event.target.value)} required={required} type={type} value={value} />
      {hint ? <p className="mt-1.5 text-xs leading-5 text-muted">{hint}</p> : null}
    </div>
  );
}

function TextArea({ label, value, onChange, required, rows = 5, hint, mono = false }: {
  label: string; value: string; onChange(value: string): void; required?: boolean; rows?: number; hint?: string; mono?: boolean;
}) {
  const id = `field-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return (
    <div>
      <label className="mb-2 block text-sm font-medium" htmlFor={id}>{label}{required ? <span aria-hidden="true" className="ml-1 text-accent">*</span> : null}</label>
      <textarea className={`w-full border border-line bg-card px-3 py-2 text-sm leading-6 text-ink placeholder:text-muted ${mono ? "font-mono text-xs" : ""}`} id={id} onChange={(event) => onChange(event.target.value)} required={required} rows={rows} value={value} />
      {hint ? <p className="mt-1.5 text-xs leading-5 text-muted">{hint}</p> : null}
    </div>
  );
}

function SelectField({ label, value, onChange, options, required = false, hint }: {
  label: string; value: string; onChange(value: string): void; options: { value: string; label: string }[]; required?: boolean; hint?: string;
}) {
  const id = `field-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return (
    <div>
      <label className="mb-2 block text-sm font-medium" htmlFor={id}>{label}{required ? <span aria-hidden="true" className="ml-1 text-accent">*</span> : null}</label>
      <select className="min-h-11 w-full border border-line bg-card px-3 py-2 text-sm text-ink" id={id} onChange={(event) => onChange(event.target.value)} required={required} value={value}>
        <option disabled={required} value="">Select an option</option>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      {hint ? <p className="mt-1.5 text-xs leading-5 text-muted">{hint}</p> : null}
    </div>
  );
}

function PreviewPanel({ kind, fields, projects }: { kind: Kind; fields: Fields; projects: ProjectOption[] }) {
  const project = projects.find((item) => item.id === fields.projectId);
  const markdownHtml = useMemo(() => renderSafeMarkdown(fields.markdown ?? ""), [fields.markdown]);
  return (
    <section aria-label="Content preview" className="border border-line bg-surface p-5 sm:p-7">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">Private preview</p>
      <article className="mt-4">
        <p className="text-xs uppercase tracking-[0.12em] text-muted">{kind === "posts" ? fields.category || "Category" : kind === "projects" ? fields.category || "Category" : "Case study"}</p>
        <h2 className="mt-2 font-display text-3xl tracking-[-0.04em]">{kind === "case-studies" ? project?.title || "Select a project" : fields.title || `Untitled ${labels[kind].toLowerCase()}`}</h2>
        {kind === "projects" ? <p className="mt-4 text-sm leading-6 text-muted">{fields.summary || "A short project summary will appear here."}</p> : null}
        {kind === "posts" ? <div className="prose-editorial mt-5" dangerouslySetInnerHTML={{ __html: markdownHtml }} /> : null}
        {kind === "case-studies" ? (
          <div className="mt-5 space-y-4 text-sm leading-6 text-muted">
            {fields.problem ? <section><h3 className="font-medium text-ink">Problem</h3><p>{fields.problem}</p></section> : null}
            {fields.role ? <section><h3 className="font-medium text-ink">Role</h3><p>{fields.role}</p></section> : null}
            {fields.approach ? <section><h3 className="font-medium text-ink">Approach</h3><p>{fields.approach}</p></section> : null}
            {fields.evidence ? <section><h3 className="font-medium text-ink">Evidence</h3><p className="whitespace-pre-line">{fields.evidence}</p></section> : null}
            {!fields.problem && !fields.role && !fields.approach && !fields.evidence ? <p>Case-study content will preview here as you add it.</p> : null}
          </div>
        ) : null}
      </article>
      <p className="mt-8 border-t border-line pt-4 text-xs text-muted">This preview is available only in the authenticated admin workspace.</p>
    </section>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return <section className="space-y-5 border-t border-line pt-6"><h2 className="font-display text-2xl tracking-[-0.03em]">{title}</h2>{children}</section>;
}

export function AdminContentEditor({ kind, id }: { kind: Kind; id?: string }) {
  const router = useRouter();
  const [fields, setFields] = useState<Fields>(() => blankFields(kind));
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [assignedProjectIds, setAssignedProjectIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(Boolean(id) || kind === "case-studies");
  const [loaded, setLoaded] = useState(!id && kind !== "case-studies");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [slugTouched, setSlugTouched] = useState(Boolean(id));
  const [previewOpen, setPreviewOpen] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");

  const update = (key: string, value: string) => {
    setFields((current) => ({ ...current, [key]: value }));
    if (key === "title" && !slugTouched) setFields((current) => ({ ...current, title: value, slug: slugFromTitle(value) }));
    if (key === "projectId" && kind === "case-studies" && !slugTouched) {
      const projectTitle = projects.find((project) => project.id === value)?.title;
      if (projectTitle) setFields((current) => ({ ...current, projectId: value, slug: slugFromTitle(projectTitle) }));
    }
    if (key === "slug") setSlugTouched(true);
    setSavedMessage("");
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (id) {
        const response = await requestAdmin(`/api/admin/${kind}/${id}`, router) as { data?: RecordData } | null;
        if (!response?.data) throw new Error(`${labels[kind]} not found.`);
        setFields(toFields(kind, response.data));
      } else {
        setFields(blankFields(kind));
      }
      if (kind !== "case-studies") setLoaded(true);
      if (kind === "case-studies") {
        const [allProjects, allStudies] = await Promise.all([
          requestAll<ProjectOption>("/api/admin/projects", router),
          requestAll<RecordData>("/api/admin/case-studies", router),
        ]);
        setProjects(allProjects);
        setAssignedProjectIds(allStudies.filter((study) => study.id !== id).map((study) => asText(study.projectId)));
        setLoaded(true);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : `${labels[kind]} could not be loaded.`);
    } finally {
      setLoading(false);
    }
  }, [id, kind, router]);

  useEffect(() => { queueMicrotask(() => { void load(); }); }, [load]);

  function jsonValue(key: string, fallback: unknown) {
    try {
      return JSON.parse(fields[key] || JSON.stringify(fallback)) as unknown;
    } catch {
      throw makeError(`${key === "publicLinks" ? "Public links" : "Challenges"} must be valid JSON.`, "INVALID_JSON_FIELD", 400);
    }
  }

  function payloadFor(action: string) {
    if (kind === "projects") return {
      title: fields.title,
      slug: fields.slug,
      summary: fields.summary,
      category: fields.category,
      status: fields.status,
      visibility: action,
      featured: fields.featured === "true",
      sortOrder: Number(fields.sortOrder || 0),
      coverImageId: nullable(fields.coverImageId),
      tags: lines(fields.tags),
    };
    if (kind === "posts") return {
      title: fields.title,
      slug: fields.slug,
      description: fields.description,
      category: fields.category,
      markdown: fields.markdown,
      status: action,
      coverImageId: nullable(fields.coverImageId),
      tags: lines(fields.tags),
    };
    return {
      slug: fields.slug,
      projectId: fields.projectId,
      status: action,
      problem: nullable(fields.problem),
      businessContext: nullable(fields.businessContext),
      role: nullable(fields.role),
      approach: nullable(fields.approach),
      capabilities: lines(fields.capabilities),
      capabilityLabel: nullable(fields.capabilityLabel),
      challenges: jsonValue("challenges", []),
      architectureNote: nullable(fields.architectureNote),
      technologies: lines(fields.technologies),
      evidence: lines(fields.evidence),
      publicLinks: jsonValue("publicLinks", []),
      mediaAssetIds: lines(fields.screenshotAssetIds ?? ""),
    };
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const action = submitter?.value || (kind === "projects" ? fields.visibility : fields.status);
    let payload: Record<string, unknown>;
    try {
      payload = payloadFor(action) as Record<string, unknown>;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Review the structured fields.");
      return;
    }
    setPending(true);
    setError("");
    setSavedMessage("");
    try {
      const response = await requestAdmin(`/api/admin/${kind}${id ? `/${id}` : ""}`, router, {
        method: id ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      }) as { data?: RecordData } | null;
      const saved = response?.data;
      if (!saved) throw new Error("The server did not return the saved content.");
      if (id) {
        setFields(toFields(kind, saved));
        setSavedMessage("Changes saved.");
      } else {
        router.replace(`/admin/${kind}/${saved.id}/edit`);
        router.refresh();
      }
    } catch (cause) {
      const apiError = cause as ApiError;
      if (apiError.code === "DUPLICATE_VALUE") setError("That slug is already in use. Choose a different slug and try again.");
      else if (apiError.code === "CASE_STUDY_EXISTS") setError("This project already has a case study. Choose another project or edit its existing case study.");
      else setError(cause instanceof Error ? cause.message : "The content could not be saved.");
    } finally {
      setPending(false);
    }
  }

  const currentProject = projects.find((project) => project.id === fields.projectId);
  const eligibleProjects = projects.filter((project) => !assignedProjectIds.includes(project.id) || project.id === fields.projectId);
  const heading = id ? `Edit ${labels[kind].toLowerCase()}` : `New ${labels[kind].toLowerCase()}`;

  return (
    <main className="py-8 sm:py-12" id="main-content">
      <div className="flex flex-col gap-4 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link className="text-xs text-muted underline decoration-line underline-offset-4 hover:text-ink" href={`/admin/${kind}`}>← Back to {pluralLabels[kind]}</Link>
          <h1 className="mt-3 font-display text-3xl tracking-[-0.04em] sm:text-4xl">{heading}</h1>
          <p className="mt-2 text-sm text-muted">Changes save to the private content database. Public pages remain unchanged.</p>
        </div>
        <button aria-expanded={previewOpen} className="min-h-10 border border-line px-4 text-sm hover:border-accent" onClick={() => setPreviewOpen((value) => !value)} type="button">{previewOpen ? "Hide preview" : "Preview"}</button>
      </div>

      <p aria-live="polite" className="min-h-6 pt-3 text-sm text-accent" role="status">{error || savedMessage}</p>
      {loading ? <p aria-live="polite" className="py-10 text-sm text-muted" role="status">Loading {labels[kind].toLowerCase()}…</p> : null}
      {!loading && error && !loaded ? <button className="mt-3 text-sm underline" onClick={() => void load()} type="button">Try again</button> : null}

      {!loading && loaded ? (
        <div className={`mt-4 grid items-start gap-8 ${previewOpen ? "xl:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.8fr)]" : ""}`}>
          <form className="space-y-8" onSubmit={(event) => void save(event)}>
            {kind === "projects" ? <>
              <Section title="Project details">
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Title" onChange={(value) => update("title", value)} required value={fields.title ?? ""} />
                  <Field hint="Generated from the title until you edit it." label="Slug" onChange={(value) => update("slug", value)} required value={fields.slug ?? ""} />
                  <Field label="Category" onChange={(value) => update("category", value)} required value={fields.category ?? ""} />
                  <Field hint="Descriptive project status, not publication status." label="Project status" onChange={(value) => update("status", value)} required value={fields.status ?? ""} />
                </div>
                <TextArea label="Summary" onChange={(value) => update("summary", value)} required rows={4} value={fields.summary ?? ""} />
                <p className="border-l-2 border-accent pl-3 text-xs leading-5 text-muted">This Project schema does not currently include description, technology or repository/live URL fields. Add detailed capabilities and approved links in its case study.</p>
              </Section>
              <Section title="Visibility and media">
                <div className="grid gap-5 sm:grid-cols-2">
                  <SelectField label="Visibility" onChange={(value) => update("visibility", value)} options={[{ value: "PRIVATE", label: "Private" }, { value: "PUBLIC", label: "Public" }]} required value={fields.visibility ?? "PRIVATE"} />
                  <MediaPicker label="Project cover image" onChange={(ids) => update("coverImageId", ids[0] ?? "")} selectedIds={fields.coverImageId ? [fields.coverImageId] : []} />
                  <Field hint="Optional; lower numbers appear first." label="Display order" onChange={(value) => update("sortOrder", value)} type="number" min={-10000} max={10000} value={fields.sortOrder ?? "0"} />
                  <label className="flex min-h-11 items-center gap-3 text-sm"><input checked={fields.featured === "true"} className="size-4 accent-[var(--accent)]" onChange={(event) => update("featured", String(event.target.checked))} type="checkbox" />Feature this project</label>
                </div>
                <TextArea hint="One tag per line. Existing tags are reused." label="Tags" onChange={(value) => update("tags", value)} rows={3} value={fields.tags ?? ""} />
              </Section>
            </> : null}

            {kind === "posts" ? <>
              <Section title="Article details">
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Title" onChange={(value) => update("title", value)} required value={fields.title ?? ""} />
                  <Field hint="Generated from the title until you edit it." label="Slug" onChange={(value) => update("slug", value)} required value={fields.slug ?? ""} />
                  <Field label="Category" onChange={(value) => update("category", value)} required value={fields.category ?? ""} />
                  <Field hint="This schema has no separate SEO title or description fields." label="Description / excerpt" onChange={(value) => update("description", value)} required value={fields.description ?? ""} />
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <TextArea hint="One tag per line. Existing tags are reused." label="Tags" onChange={(value) => update("tags", value)} rows={4} value={fields.tags ?? ""} />
                  <MediaPicker label="Article cover image" onChange={(ids) => update("coverImageId", ids[0] ?? "")} selectedIds={fields.coverImageId ? [fields.coverImageId] : []} />
                </div>
              </Section>
              <Section title="Markdown source">
                <TextArea label="Article body" mono onChange={(value) => update("markdown", value)} required rows={18} value={fields.markdown ?? ""} />
                <p className="text-xs text-muted">Raw HTML is suppressed in previews. External links are limited to http, https and mailto; images must use a local path.</p>
              </Section>
            </> : null}

            {kind === "case-studies" ? <>
              <Section title="Project relationship">
                {eligibleProjects.length ? <SelectField hint="A project can have at most one case study. Projects with an existing case study are unavailable." label="Project" onChange={(value) => update("projectId", value)} options={eligibleProjects.map((project) => ({ value: project.id, label: `${project.title} · ${project.visibility.toLowerCase()}` }))} required value={fields.projectId ?? ""} /> : <p className="text-sm text-muted">{projects.length ? "Every project already has a case study. Edit one of those case studies or create another project." : "No projects are available. Create a project before adding a case study."} {projects.length === 0 ? <Link className="underline decoration-line underline-offset-4 hover:text-ink" href="/admin/projects/new">Create project</Link> : null}</p>}
                <Field hint="The case-study title is inherited from the selected project." label="Slug" onChange={(value) => update("slug", value)} required value={fields.slug ?? ""} />
                {currentProject ? <p className="text-xs text-muted">Case study title: <span className="text-ink">{currentProject.title}</span></p> : null}
              </Section>
              <Section title="Narrative">
                <TextArea label="Problem" onChange={(value) => update("problem", value)} rows={4} value={fields.problem ?? ""} />
                <TextArea label="Business context" onChange={(value) => update("businessContext", value)} rows={4} value={fields.businessContext ?? ""} />
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Role" onChange={(value) => update("role", value)} value={fields.role ?? ""} />
                  <Field label="Capability label" onChange={(value) => update("capabilityLabel", value)} value={fields.capabilityLabel ?? ""} />
                </div>
                <TextArea label="Approach" onChange={(value) => update("approach", value)} rows={5} value={fields.approach ?? ""} />
                <TextArea hint="One capability per line." label="Capabilities" onChange={(value) => update("capabilities", value)} rows={4} value={fields.capabilities ?? ""} />
                <TextArea hint="One technology per line." label="Technologies" onChange={(value) => update("technologies", value)} rows={3} value={fields.technologies ?? ""} />
                <TextArea hint="One evidence statement per line; enter only verified details." label="Evidence" onChange={(value) => update("evidence", value)} rows={4} value={fields.evidence ?? ""} />
                <TextArea hint='JSON array, for example: [{"title":"","description":""}]' label="Challenges (JSON)" mono onChange={(value) => update("challenges", value)} rows={5} value={fields.challenges ?? "[]"} />
                <TextArea label="Architecture note" onChange={(value) => update("architectureNote", value)} rows={4} value={fields.architectureNote ?? ""} />
                <TextArea hint='JSON array of approved HTTPS links: [{"label":"","url":"https://…","approved":true}]' label="Approved public links (JSON)" mono onChange={(value) => update("publicLinks", value)} rows={5} value={fields.publicLinks ?? "[]"} />
                <MediaPicker label="Case-study screenshots" multiple onChange={(ids) => update("screenshotAssetIds", ids.join("\n"))} selectedIds={lines(fields.screenshotAssetIds ?? "")} />
              </Section>
            </> : null}

            <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap gap-3 border-t border-line bg-paper/95 px-4 py-4 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
              {kind === "projects" ? <>
                <button className="min-h-11 bg-accent px-5 text-sm font-medium text-accent-ink disabled:opacity-60" disabled={pending} name="visibility" type="submit" value="PRIVATE">{pending ? "Saving…" : "Save private"}</button>
                <button className="min-h-11 border border-line px-5 text-sm font-medium disabled:opacity-60" disabled={pending} name="visibility" type="submit" value="PUBLIC">Save and make public</button>
              </> : <>
                <button className="min-h-11 bg-accent px-5 text-sm font-medium text-accent-ink disabled:opacity-60" disabled={pending || (kind === "case-studies" && eligibleProjects.length === 0)} name="status" type="submit" value="DRAFT">{pending ? "Saving…" : "Save draft"}</button>
                <button className="min-h-11 border border-line px-5 text-sm font-medium disabled:opacity-60" disabled={pending || (kind === "case-studies" && eligibleProjects.length === 0)} name="status" type="submit" value="PUBLISHED">Save and publish</button>
              </>}
              {id ? <Link className="inline-flex min-h-11 items-center px-3 text-sm text-muted underline decoration-line underline-offset-4 hover:text-ink" href={`/admin/${kind}`}>Cancel</Link> : null}
            </div>
          </form>
          {previewOpen ? <div className="xl:sticky xl:top-6"><PreviewPanel fields={fields} kind={kind} projects={projects} /></div> : null}
        </div>
      ) : null}
    </main>
  );
}
