# Vedya — Product Roadmap

How we go from a credible v1 general form builder to a competitive, monetizable
product. Read alongside `claude.md` §1 (positioning), §8 (freemium), §9 (wedges).

## The two engines

Every feature serves one of two engines. Don't confuse them.

- **Adoption engine** (mostly *free*): design, templates, AI generation, basic
  analytics. Job: time-to-first-form, word-of-mouth, SEO. Fills the funnel.
- **Revenue engine** (the *paywall*): conditional logic, payments, integrations,
  branding/domains, file uploads. Job: convert serious users to paid.

The general builder is cost of entry (claude.md §1). Don't gold-plate it. The
moat is the wedges layered on top.

## Tiers

🟢 Free (growth) · 💰 Paid (monetize) · ⚪ Baseline (table-stakes, maintain) · ⏸ Later (only after paying customers)

---

## Phase 1 — Now (adoption engine)

Rides the existing schema/renderer. Everything here just emits the `FormDraft`
JSON the engine already consumes, so architectural risk is near-zero.

| Feature | Tier | Notes |
|---|---|---|
| **Template library + industry templates** | 🟢 Free (premium templates 💰 later) | Biggest activation lever. A template is a seeded `FormDraft` → duplicate. **[in progress]** |
| **AI form generation** | 🟢 Free (metered) → 💰 credits | NL prompt → `FormDraft` → existing `validateAnswers`. Meter free generations; more via paid AI credits. **[next]** |
| **Basic form analytics** | 🟢 Free (advanced 💰) | View event on public renderer + counts. Views / submissions / conversion. |
| **Mobile + a11y polish** | ⚪ Baseline | Already in the v1 DoD. Maintain, don't "project." |

## Phase 2 — Next (first paid wedge + branding)

| Feature | Tier | Notes |
|---|---|---|
| **Conditional logic / calculations** | 💰 Paid | claude.md's designated first wedge (§9). Activate the reserved `Field.visibleIf` → real `Condition`. |
| **Themes / branding expansion** | 💰 Paid | Fonts, logos, button styles, premium themes. Extends the existing remove-badge gate. Lives in `FormVersion.theme`. |
| **File-upload fields** | 💰 Paid | claude.md §8. Needs Cloudflare R2. |
| **Webhooks** | 💰 Paid | Cheapest slice of "forms that do something" (§9). One POST on submission-created. Keep submission-write emitting an event so integrations layer on later. |

## Phase 3 — Only after paying customers (defer; churn/waste traps)

| Feature | Tier | Why wait |
|---|---|---|
| **Payments on forms** | 💰 Paid | Highest value *and* effort/liability (KYC, payouts). This is Stripe Connect / Razorpay Route (routing to the form owner) — different from our own MoR subscription billing (§2). Build when a real customer asks. |
| **Collaboration / teams / permissions / version history** | 💰 Paid | Classic pre-PMF over-build. Only matters once teams pay. |
| **Native integrations suite** (Sheets, Slack, Notion, Zapier…) | 💰 Paid | Build the 1–2 customers ask for, *after* webhooks. Don't pre-build ten connectors. |
| **Referral system** | 🟢 Free | Needs a Pro tier + traction worth referring first. |
| **Lifetime plan** | 💰 Paid | "After the product matures." Risky for unit economics. |
| **Shareable / SEO AI template pages** | 🟢 Free | SEO play that compounds at scale; depends on AI generation shipping first. |
| **Advanced analytics** (device, abandonment, timelines) | 💰 Paid | Ship basic first; extend when free users hit the ceiling. |

---

## Positioning

"The beautiful form builder for teams tired of boring forms." Compete on speed,
simplicity, and delightful design — but capture revenue on the wedges, not on
out-polishing a free general builder.
