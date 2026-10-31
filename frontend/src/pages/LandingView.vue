<script setup lang="ts">
// Public landing page — the first thing a signed-out visitor sees. Product
// chrome (brand/ink tokens). Logged-in users never reach here; the router guard
// sends them to the dashboard. The hero preview is the real <FormRenderer>
// showing a small demo form, so the page shows the actual product and can never
// drift from it (no screenshot to keep up to date).
import { ref } from "vue";
import type { FormVersion } from "@schema";
import FormRenderer from "@/components/FormRenderer.vue";
import UiButton from "@/components/ui/UiButton.vue";
import UiLogo from "@/components/ui/UiLogo.vue";
import UiIcon from "@/components/ui/UiIcon.vue";
import type { IconName } from "@/lib/icons";

const heroForm: FormVersion = {
  versionId: "landing-demo",
  formId: "landing-demo",
  version: 1,
  publishedAt: "2026-10-01T00:00:00.000Z",
  theme: {
    primaryColor: "#047857",
    fontFamily: "Inter, system-ui, sans-serif",
    borderRadius: 10,
  },
  fields: [
    {
      id: "name",
      type: "short_text",
      label: "Your name",
      required: true,
      placeholder: "Ananya Rao",
    },
    {
      id: "email",
      type: "email",
      label: "Work email",
      required: true,
      placeholder: "ananya@company.com",
    },
    {
      id: "session",
      type: "single_select",
      label: "Which session will you join?",
      required: true,
      options: [
        {
          id: "am",
          label: "Morning workshop",
          description: "10:00 – 12:30 · hands-on",
        },
        {
          id: "pm",
          label: "Afternoon talks",
          description: "14:00 – 17:00 · three speakers",
        },
      ],
    },
    {
      id: "excited",
      type: "rating",
      label: "How excited are you?",
      required: false,
      validation: { max: 5 },
    },
  ],
};

const features: { title: string; body: string; icon: IconName }[] = [
  {
    title: "Build without code",
    body: "Text, email, phone, choices, dropdowns, dates and ratings with required fields and validation, and a live preview as you go.",
    icon: "pencil-square",
  },
  {
    title: "Share one link",
    body: "Publish and send the link anywhere. Forms work beautifully on phones, and spam bots are filtered out.",
    icon: "paper-airplane",
  },
  {
    title: "Keep every answer",
    body: "Get an email for each response, browse them in a table, and export to CSV whenever you like.",
    icon: "arrow-down-tray",
  },
];

const steps = [
  {
    n: "01",
    title: "Build",
    body: "Start from a template or a blank form. Add questions, mark what's required, and preview it exactly as people will see it.",
  },
  {
    n: "02",
    title: "Publish",
    body: "Get a link to share by email, WhatsApp or anywhere else. Edit later, people see the changes when you publish them.",
  },
  {
    n: "03",
    title: "Collect",
    body: "Responses arrive in your inbox and your dashboard. Export them to a spreadsheet in one click.",
  },
];

// The free-plan numbers mirror backend/src/limits.ts (also quoted in TermsView).
const freePlan = [
  "Unlimited forms",
  "100 responses per month",
  "Email notification for every response",
  "CSV export of all your data",
  "Spam protection on every form",
];

const faqs = [
  {
    q: "Is it really free?",
    a: "Yes. Vedya is free while in beta: unlimited forms and 100 responses a month, no credit card. Paid plans with higher limits will come later, and we'll tell you well before anything changes.",
  },
  {
    q: "Does it work on mobile?",
    a: "Every form is built to be filled in comfortably on phones, tablets and desktops.",
  },
  {
    q: "Do I own my responses?",
    a: "Always. Export every response to CSV, or download all your data, whenever you like. Delete your account and it's gone.",
  },
  {
    q: "What happens if I edit a form that's already live?",
    a: "Your edits stay a draft until you publish them. Responses you've already collected keep the questions they were answered against, so nothing gets mixed up.",
  },
];

// FAQ accordion: the open item index (first open by default).
const openFaq = ref(0);
function toggleFaq(i: number): void {
  openFaq.value = openFaq.value === i ? -1 : i;
}
</script>

<template>
  <div class="min-h-screen bg-ink-50 text-ink-900">
    <header
      class="mx-auto flex max-w-5xl items-center justify-between px-6 py-5"
    >
      <UiLogo />
      <nav class="flex items-center gap-2">
        <router-link
          :to="{ name: 'templates' }"
          class="hidden px-3 py-1.5 text-sm font-medium text-ink-600 hover:text-ink-900 sm:inline"
          >Templates</router-link
        >
        <a
          href="#pricing"
          class="hidden px-3 py-1.5 text-sm font-medium text-ink-600 hover:text-ink-900 sm:inline"
          >Pricing</a
        >
        <router-link :to="{ name: 'login' }">
          <UiButton variant="ghost" size="sm">Log in</UiButton>
        </router-link>
        <router-link :to="{ name: 'signup' }">
          <UiButton size="sm">Sign up</UiButton>
        </router-link>
      </nav>
    </header>

    <main class="mx-auto max-w-5xl px-6">
      <!-- HERO -->
      <section class="pb-10 pt-16 text-center sm:pt-24">
        <span
          class="inline-block rounded-full border border-brand-100 bg-white/70 px-3 py-1 text-sm font-medium text-brand-700"
        >
          Free while in beta
        </span>
        <h1
          class="mx-auto mt-5 max-w-2xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl"
        >
          Forms your audience<br class="hidden sm:block" />
          actually finishes.
        </h1>
        <p class="mx-auto mt-4 max-w-xl text-base text-ink-500 sm:text-lg">
          Design a beautiful form, publish it to a shareable link, and watch
          responses roll in. Free to start, we don't ask for a credit card.
        </p>
        <div
          class="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <router-link :to="{ name: 'signup' }">
            <UiButton>Get started, it’s free</UiButton>
          </router-link>
          <router-link :to="{ name: 'login' }">
            <UiButton variant="secondary">I already have an account</UiButton>
          </router-link>
        </div>
      </section>

      <!-- PRODUCT PREVIEW: the real renderer, inert (look, don't touch) -->
      <section class="pb-20">
        <div class="relative mx-auto max-w-xl">
          <div
            class="absolute -inset-6 -z-10 rounded-[2rem] bg-brand-100/50 blur-3xl"
            aria-hidden="true"
          ></div>
          <div
            class="overflow-hidden rounded-md border border-line-200 bg-white"
            aria-label="Example of a form built with Vedya"
            role="img"
          >
            <div
              class="flex items-center gap-1.5 border-b border-line-100 px-4 py-3"
              aria-hidden="true"
            >
              <span class="h-2.5 w-2.5 rounded-full bg-ink-200"></span>
              <span class="h-2.5 w-2.5 rounded-full bg-ink-200"></span>
              <span class="h-2.5 w-2.5 rounded-full bg-ink-200"></span>
              <span class="ml-3 truncate text-xs text-ink-500"
                >vedya.app/f/workshop-registration</span
              >
            </div>
            <div inert class="px-6 py-7 text-left sm:px-8">
              <FormRenderer
                :version="heroForm"
                title="Design workshop registration"
              />
            </div>
          </div>
        </div>
      </section>

      <!-- FEATURES -->
      <section class="grid grid-cols-1 gap-4 pb-20 sm:grid-cols-3">
        <div
          v-for="f in features"
          :key="f.title"
          class="rounded-md border border-line-200 bg-white p-6"
        >
          <span
            class="grid h-10 w-10 place-items-center rounded-md bg-brand-50 text-brand-600"
          >
            <UiIcon :name="f.icon" class="text-inherit h-5 w-5" />
          </span>
          <h2 class="mt-4 text-base font-semibold text-ink-900">
            {{ f.title }}
          </h2>
          <p class="mt-1.5 text-sm leading-relaxed text-ink-500">
            {{ f.body }}
          </p>
        </div>
      </section>

      <!-- HOW IT WORKS -->
      <section class="pb-20">
        <h2 class="text-center text-2xl font-semibold tracking-tight">
          From idea to inbox in three steps
        </h2>
        <div class="mt-10 grid gap-8 sm:grid-cols-3">
          <div v-for="step in steps" :key="step.n" class="relative">
            <span class="text-sm font-semibold text-brand-400">{{
              step.n
            }}</span>
            <h3 class="mt-1 text-lg font-semibold text-ink-900">
              {{ step.title }}
            </h3>
            <p class="mt-1.5 text-sm leading-relaxed text-ink-500">
              {{ step.body }}
            </p>
          </div>
        </div>
      </section>

      <!-- PRICING -->
      <section id="pricing" class="scroll-mt-8 pb-20">
        <h2 class="text-center text-2xl font-semibold tracking-tight">
          Simple pricing
        </h2>
        <p class="mx-auto mt-2 max-w-md text-center text-sm text-ink-500">
          Vedya is free while in beta. Paid plans with higher limits come later
          and you'll get plenty of notice before anything changes.
        </p>
        <div
          class="mx-auto mt-8 max-w-sm rounded-md border border-line-200 bg-white p-7"
        >
          <div class="flex items-baseline justify-between">
            <h3 class="font-semibold text-ink-900">Free</h3>
            <span
              class="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700"
              >Beta</span
            >
          </div>
          <p class="mt-3">
            <span class="text-3xl font-semibold tracking-tight text-ink-900"
              >₹0</span
            >
            <span class="text-sm text-ink-500"> / month</span>
          </p>
          <ul class="mt-5 space-y-2.5 text-sm text-ink-700">
            <li
              v-for="item in freePlan"
              :key="item"
              class="flex items-start gap-2.5"
            >
              <UiIcon
                name="check"
                class="mt-0.5 h-4 w-4 shrink-0 text-brand-600"
              />
              {{ item }}
            </li>
          </ul>
          <router-link :to="{ name: 'signup' }" class="mt-6 block">
            <UiButton class="w-full">Start for free</UiButton>
          </router-link>
        </div>
      </section>

      <!-- FAQ -->
      <section class="pb-20">
        <h2 class="text-center text-2xl font-semibold tracking-tight">
          Questions, answered
        </h2>
        <div
          class="mx-auto mt-8 max-w-2xl divide-y divide-line-200 overflow-hidden rounded-md border border-line-200 bg-white"
        >
          <div v-for="(faq, i) in faqs" :key="faq.q">
            <button
              type="button"
              class="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-ink-50"
              :aria-expanded="openFaq === i"
              @click="toggleFaq(i)"
            >
              <span class="text-sm font-medium text-ink-900">{{ faq.q }}</span>
              <UiIcon
                name="chevron-down"
                class="h-5 w-5 shrink-0 text-ink-500 transition-transform duration-200"
                :class="openFaq === i && 'rotate-180'"
              />
            </button>
            <p
              v-if="openFaq === i"
              class="px-5 pb-4 text-sm leading-relaxed text-ink-500"
            >
              {{ faq.a }}
            </p>
          </div>
        </div>
      </section>
    </main>

    <!-- CLOSING CTA -->
    <section class="mx-auto max-w-5xl px-6 pb-20">
      <div class="rounded-md bg-brand-600 px-8 py-14 text-center">
        <h2
          class="text-2xl font-semibold tracking-tight text-white sm:text-3xl"
        >
          Ready to build your first form?
        </h2>
        <p class="mx-auto mt-2 max-w-md text-sm text-brand-100">
          It takes about a minute. No credit card needed.
        </p>
        <div class="mt-6 flex justify-center">
          <router-link :to="{ name: 'signup' }">
            <UiButton variant="secondary">Get started, it’s free</UiButton>
          </router-link>
        </div>
      </div>
    </section>

    <footer
      class="mx-auto max-w-5xl px-6 py-8 text-center text-sm text-ink-500"
    >
      © 2026 Vedya
      <nav class="mt-2 flex justify-center gap-4" aria-label="Footer">
        <router-link :to="{ name: 'templates' }" class="hover:text-ink-700"
          >Templates</router-link
        >
        <!-- <router-link :to="{ name: 'privacy' }" class="hover:text-ink-700"
          >Privacy</router-link
        >
        <router-link :to="{ name: 'terms' }" class="hover:text-ink-700"
          >Terms</router-link
        > -->
        <a href="mailto:support@vedya.app" class="hover:text-ink-700"
          >Contact</a
        >
      </nav>
    </footer>
  </div>
</template>
