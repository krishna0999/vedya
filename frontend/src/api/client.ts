// Typed client for the Fastify API. All server shapes come from @schema (the
// single source of truth); only response-envelope shapes unique to the API
// (summaries, submit result) are declared here.
import type { Field, FormDraft, FormVersion, Submission, Theme } from "@schema";

const BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8080/api";

export interface FormSummary {
  id: string;
  title: string;
  category?: string; // owner-set form type, shown as a badge on the card
  updatedAt: string;
  published: boolean;
  responseCount: number;
  viewCount: number;
  previewFields: Field[]; // first few questions, for the card's mini paper preview
}

// Basic analytics: headline numbers for one form (conversion derived client-side).
export interface FormStats {
  views: number;
  submissions: number;
}

// Account-level analytics for the /usage dashboard (mirrors the backend shape).
export interface UsageDay {
  day: string; // YYYY-MM-DD
  views: number;
  submissions: number;
}

export interface AccountUsage {
  plan: string;
  limits: { responsesPerMonth: number | null; aiGenerationsPerMonth: number }; // null = unlimited
  forms: number;
  published: number;
  views: number;
  submissions: number;
  monthSubmissions: number;
  monthAiGenerations: number;
  timeline: UsageDay[];
}

export interface DraftPatch {
  title?: string;
  category?: string;
  fields?: Field[];
  theme?: Theme;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  plan: string;
}

// A gallery card: catalog metadata plus the fields (for client-side preview).
export interface TemplateSummary {
  id: string;
  title: string;
  category: string;
  description: string;
  icon: string;
  badge?: "Popular" | "Trending";
  stat?: string;
  fieldCount: number;
  fields: Field[];
}

export interface TemplateCatalog {
  categories: string[];
  templates: TemplateSummary[];
}

// Public form envelope: the published version + whether to show the free-tier
// "Made with —" badge (derived server-side from the owner's plan).
export interface PublicForm {
  version: FormVersion;
  branding: boolean;
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
    credentials: "include", // send/receive the Lucia session cookie
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
  // Auth
  signup: (email: string, password: string) =>
    request<AuthUser>("POST", "/auth/signup", { email, password }),
  login: (email: string, password: string) =>
    request<AuthUser>("POST", "/auth/login", { email, password }),
  logout: () => request<{ ok: true }>("POST", "/auth/logout"),
  me: () => request<AuthUser>("GET", "/auth/me"),
  updateProfile: (name: string) =>
    request<AuthUser>("PATCH", "/auth/profile", { name }),
  changePassword: (currentPassword: string, newPassword: string) =>
    request<{ ok: true }>("PATCH", "/auth/password", {
      currentPassword,
      newPassword,
    }),
  deleteAccount: () => request<void>("DELETE", "/auth/account"),

  // Owner (authenticated)
  createForm: (title?: string) =>
    request<FormDraft>("POST", "/forms", { title }),
  listTemplates: () => request<TemplateCatalog>("GET", "/templates"),
  createFromTemplate: (templateId: string) =>
    request<FormDraft>("POST", "/forms/from-template", { templateId }),
  generateForm: (prompt: string) =>
    request<FormDraft>("POST", "/forms/generate", { prompt }),
  listForms: () => request<FormSummary[]>("GET", "/forms"),
  getForm: (id: string) => request<FormDraft>("GET", `/forms/${id}`),
  updateForm: (id: string, patch: DraftPatch) =>
    request<FormDraft>("PATCH", `/forms/${id}`, patch),
  publishForm: (id: string) =>
    request<FormVersion>("POST", `/forms/${id}/publish`),
  deleteForm: (id: string) => request<void>("DELETE", `/forms/${id}`),
  listSubmissions: (id: string) =>
    request<Submission[]>("GET", `/forms/${id}/submissions`),
  getFormStats: (id: string) =>
    request<FormStats>("GET", `/forms/${id}/stats`),
  getUsage: () => request<AccountUsage>("GET", "/usage"),
  exportUrl: () => `${BASE}/account/export`,
  csvUrl: (id: string) => `${BASE}/forms/${id}/submissions.csv`,

  // Public
  getPublicForm: (formId: string) =>
    request<PublicForm>("GET", `/f/${formId}`),
  recordView: (formId: string) =>
    request<void>("POST", `/f/${formId}/views`),
  submit: (formId: string, answers: Record<string, unknown>) =>
    request<{ id: string; submittedAt: string }>(
      "POST",
      `/f/${formId}/submissions`,
      { answers },
    ),
};
