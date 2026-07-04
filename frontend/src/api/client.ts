// Typed client for the Fastify API. All server shapes come from @schema (the
// single source of truth); only response-envelope shapes unique to the API
// (summaries, submit result) are declared here.
import type { Field, FormDraft, FormVersion, Submission, Theme } from "@schema";

const BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8080/api";

export interface FormSummary {
  id: string;
  title: string;
  updatedAt: string;
  published: boolean;
  responseCount: number;
}

export interface DraftPatch {
  title?: string;
  fields?: Field[];
  theme?: Theme;
}

// Error carrying the HTTP status and any machine-readable body (e.g. per-field
// validation errors on a 422 submit).
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers:
      body === undefined ? undefined : { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (res.status === 204) return undefined as T;
  const isJson = res.headers.get("content-type")?.includes("application/json");
  const payload = isJson ? await res.json() : await res.text();
  if (!res.ok) {
    const msg =
      isJson && payload?.error
        ? payload.error
        : `Request failed (${res.status}).`;
    throw new ApiError(res.status, msg, isJson ? payload?.details : undefined);
  }
  return payload as T;
}

export const api = {
  // Owner (dev owner until auth lands in step 5)
  createForm: (title?: string) =>
    request<FormDraft>("POST", "/forms", { title }),
  listForms: () => request<FormSummary[]>("GET", "/forms"),
  getForm: (id: string) => request<FormDraft>("GET", `/forms/${id}`),
  updateForm: (id: string, patch: DraftPatch) =>
    request<FormDraft>("PATCH", `/forms/${id}`, patch),
  publishForm: (id: string) =>
    request<FormVersion>("POST", `/forms/${id}/publish`),
  deleteForm: (id: string) => request<void>("DELETE", `/forms/${id}`),
  listSubmissions: (id: string) =>
    request<Submission[]>("GET", `/forms/${id}/submissions`),
  csvUrl: (id: string) => `${BASE}/forms/${id}/submissions.csv`,

  // Public
  getPublishedVersion: (formId: string) =>
    request<FormVersion>("GET", `/f/${formId}`),
  submit: (formId: string, answers: Record<string, unknown>) =>
    request<{ id: string; submittedAt: string }>(
      "POST",
      `/f/${formId}/submissions`,
      { answers },
    ),
};
