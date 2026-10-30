// The ONE place plan limits live (CLAUDE.md §8). Never scatter plan checks —
// every gate reads from here so retuning the freemium line is a single edit.
// The free-plan numbers are also quoted to users in frontend TermsView.vue.
// The wedges in §9 (file-upload fields, etc.) add flags here, not new checks.

export interface PlanLimits {
  // Max submissions per calendar month across all of an owner's forms.
  responsesPerMonth: number;
  // Max AI form generations per calendar month (ROADMAP: free metered → 💰 credits).
  aiGenerationsPerMonth: number;
  // Whether file-upload fields are allowed (field type lands post-v1; seam only).
  fileUploads: boolean;
  // Whether public forms show the "Made with —" badge (free tier does).
  branding: boolean;
}

export const PLAN_LIMITS = {
  free: { responsesPerMonth: 100, aiGenerationsPerMonth: 10, fileUploads: false, branding: true },
  pro: {
    responsesPerMonth: Number.POSITIVE_INFINITY,
    aiGenerationsPerMonth: 200,
    fileUploads: true,
    branding: false,
  },
} as const satisfies Record<string, PlanLimits>;

export type Plan = keyof typeof PLAN_LIMITS;

// Resolve a (possibly unknown) plan string to its limits, defaulting to free.
export function limitsForPlan(plan: string | null | undefined): PlanLimits {
  return PLAN_LIMITS[(plan ?? 'free') as Plan] ?? PLAN_LIMITS.free;
}
