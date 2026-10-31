"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { TextAreaField, TextField } from "@/components/ui/form-controls";
import { Toast } from "@/components/ui/toast";
import { CONTACT_SERVICES, validateContactPayload, type ContactField } from "@/lib/contact-validation.mjs";

type FormErrors = Partial<Record<ContactField, string>>;

export function ContactForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const startedAt = useRef(0);
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<{ kind: "success" | "error"; message: string } | null>(null);
  const [toastOpen, setToastOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setStatus(null);

    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());
    const validation = validateContactPayload(payload);
    if (!validation.valid) {
      setErrors(validation.errors as FormErrors);
      setStatus({ kind: "error", message: "Please review the highlighted fields." });
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...validation.value,
          website: formData.get("website"),
          startedAt: startedAt.current,
        }),
      });
      const result = await response.json() as { message?: string; errors?: FormErrors };

      if (!response.ok) {
        setErrors(result.errors ?? {});
        setStatus({ kind: "error", message: result.message ?? "Your enquiry could not be sent. Please try again later." });
        return;
      }

      setStatus({ kind: "success", message: "Your enquiry was sent. Developer will contact you soon." });
      setToastOpen(true);
      formRef.current?.reset();
      startedAt.current = Date.now();
    } catch {
      setStatus({ kind: "error", message: "A connection problem prevented the enquiry from being sent. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  const fieldError = (field: ContactField) => errors[field];

  return (
    <form className="mt-10 grid gap-x-7 gap-y-6 sm:grid-cols-2" onSubmit={handleSubmit} ref={formRef}>
      <div aria-hidden="true" className="absolute -left-[10000px] h-px w-px overflow-hidden">
        <label htmlFor="website">Leave this field blank</label>
        <input autoComplete="off" id="website" name="website" tabIndex={-1} type="text" />
      </div>

      <TextField autoComplete="name" error={fieldError("name")} id="name" label="Name" maxLength={120} name="name" required />
      <TextField autoComplete="email" error={fieldError("email")} id="email" label="Email" maxLength={254} name="email" required type="email" />

      <div>
        <label className="mb-2 block text-sm font-medium" htmlFor="service">What do you need help with?</label>
        {fieldError("service") ? <p className="mb-2 text-xs text-accent" id="service-error">{fieldError("service")}</p> : null}
        <select aria-describedby={fieldError("service") ? "service-error" : undefined} aria-invalid={Boolean(fieldError("service"))} className="min-h-12 w-full border border-line bg-surface px-4 py-3 text-sm focus-visible:border-focus" defaultValue="" id="service" name="service" required>
          <option disabled value="">Select a service</option>
          {CONTACT_SERVICES.map((service) => <option key={service.value} value={service.value}>{service.label}</option>)}
        </select>
      </div>
      <TextField autoComplete="organization" error={fieldError("businessName")} id="businessName" label="Business name (optional)" maxLength={160} name="businessName" />

      <div className="sm:col-span-2">
        <TextAreaField error={fieldError("projectDescription")} id="projectDescription" label="Project description" maxLength={5000} name="projectDescription" required />
      </div>

      <TextField error={fieldError("budgetRange")} hint="Optional. A range or general guidance is enough." id="budgetRange" label="Budget range (optional)" maxLength={160} name="budgetRange" />
      <TextField error={fieldError("timeline")} hint="Optional. Share any timing considerations." id="timeline" label="Timeline (optional)" maxLength={160} name="timeline" />
      <TextField autoComplete="url" error={fieldError("existingWebsite")} id="existingWebsite" label="Existing website (optional)" maxLength={2048} name="existingWebsite" placeholder="https://" type="url" />

      <div>
        <label className="mb-2 block text-sm font-medium" htmlFor="preferredContactMethod">Preferred contact method (optional)</label>
        {fieldError("preferredContactMethod") ? <p className="mb-2 text-xs text-accent" id="preferredContactMethod-error">{fieldError("preferredContactMethod")}</p> : null}
        <select aria-describedby={fieldError("preferredContactMethod") ? "preferredContactMethod-error" : undefined} aria-invalid={Boolean(fieldError("preferredContactMethod"))} className="min-h-12 w-full border border-line bg-surface px-4 py-3 text-sm focus-visible:border-focus" defaultValue="" id="preferredContactMethod" name="preferredContactMethod">
          <option value="">No preference</option>
          <option value="email">Email</option>
          <option value="phone">Phone</option>
          <option value="whatsapp">WhatsApp</option>
        </select>
      </div>

      <div className="sm:col-span-2">
        <Button disabled={submitting} type="submit">{submitting ? "Sending…" : "Send project enquiry"}</Button>
        <p aria-live="polite" className={`mt-4 text-sm ${status?.kind === "error" ? "text-accent" : "text-muted"}`} role={status?.kind === "error" ? "alert" : "status"}>
          {status?.message ?? "Required: name, email, service, and project description. Your details are sent only when delivery is configured."}
        </p>
      </div>

      <Toast
        duration={8000}
        message="Developer will contact you soon."
        onClose={() => setToastOpen(false)}
        open={toastOpen}
        title="Enquiry Sent"
      />
    </form>
  );
}
