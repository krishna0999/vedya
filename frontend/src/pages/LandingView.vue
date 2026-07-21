<script setup lang="ts">
// Public landing page — the first thing a signed-out visitor sees. Product
// chrome (brand/ink tokens). Logged-in users never reach here; the router guard
// sends them to the dashboard. The product preview is an inline SVG mockup so it
// stays crisp and themeable without shipping a screenshot asset.
import { ref } from "vue";
import UiButton from "@/components/ui/UiButton.vue";
import UiLogo from "@/components/ui/UiLogo.vue";
import UiIcon from "@/components/ui/UiIcon.vue";
import type { IconName } from "@/lib/icons";

const features: { title: string; body: string; icon: IconName }[] = [
  {
    title: "Design with ease",
    body: "A visual builder with 8 field types, validation, and a live preview — no code.",
    icon: "pencil-square",
  },
  {
    title: "Publish in a click",
    body: "Snapshot an immutable version, share a link, and collect on any device.",
    icon: "paper-airplane",
  },
  {
    title: "Own your data",
    body: "See every response in a table and export clean CSV whenever you need it.",
    icon: "arrow-down-tray",
  },
];

const steps = [
  {
    n: "01",
    title: "Build",
    body: "Drag in fields, set required rules and validation, and watch a live preview update as you go.",
  },
  {
    n: "02",
    title: "Publish",
    body: "Publishing snapshots a frozen version and hands you a public link ready to share anywhere.",
  },
  {
    n: "03",
    title: "Collect",
    body: "Responses land in a table you can scan at a glance and export to CSV in one click.",
  },
];

const faqs = [
  {
    q: "Is it really free?",
    a: "Yes — unlimited forms and 100 responses per month on the free plan, no credit card required. Upgrade only when you need more.",
  },
  {
    q: "Does it work on mobile?",
    a: "Every form is fully responsive and built to be filled out comfortably on phones, tablets, and desktops.",
  },
  {
    q: "Do I own my responses?",
    a: "Always. Your data is yours — export every response to a clean CSV whenever you like.",
  },
  {
    q: "What happens if I edit a published form?",
    a: "Publishing creates an immutable version. Past responses always map to the exact form that produced them, so nothing is ever orphaned.",
  },
];

// FAQ accordion: the open item index (first open by default).
const openFaq = ref(0);
function toggleFaq(i: number): void {
  openFaq.value = openFaq.value === i ? -1 : i;
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b bg-ink-50 text-ink-900">
    <header
      class="mx-auto flex max-w-5xl items-center justify-between px-6 py-5"
    >
      <UiLogo />
      <nav class="flex items-center gap-2">
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
          Build · Publish · Collect
        </span>
        <h1
          class="mx-auto mt-5 max-w-2xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl"
        >
          Forms your audience<br class="hidden sm:block" />
          actually finishes.
        </h1>
        <p class="mx-auto mt-4 max-w-xl text-base text-ink-500 sm:text-lg">
          Design a beautiful form, publish it to a shareable link, and watch
          responses roll in. Free to start — no credit card required.
        </p>
        <div
          class="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <router-link :to="{ name: 'signup' }">
            <UiButton>Get started — it’s free</UiButton>
          </router-link>
          <router-link :to="{ name: 'login' }">
            <UiButton variant="secondary">I already have an account</UiButton>
          </router-link>
        </div>
      </section>

      <!-- PRODUCT PREVIEW -->
      <section class="pb-20">
        <div class="relative mx-auto max-w-2xl">
          <div
            class="absolute -inset-4 -z-10 rounded-[2rem] bg-brand-200/30 blur-2xl"
          ></div>
          <svg
            viewBox="0 0 520 380"
            class="w-full rounded-2xl border border-ink-200 bg-white shadow-pop"
            role="img"
            aria-label="A form being built in Vedya"
          >
            <!-- window chrome -->
            <circle cx="34" cy="32" r="5" class="fill-ink-200" />
            <circle cx="52" cy="32" r="5" class="fill-ink-200" />
            <circle cx="70" cy="32" r="5" class="fill-ink-200" />
            <line
              x1="0"
              y1="58"
              x2="520"
              y2="58"
              class="stroke-ink-100"
              stroke-width="1.5"
            />
            <!-- form title -->
            <rect
              x="40"
              y="84"
              width="210"
              height="18"
              rx="9"
              class="fill-ink-300"
            />
            <rect
              x="40"
              y="112"
              width="290"
              height="10"
              rx="5"
              class="fill-ink-200"
            />
            <!-- field 1 -->
            <rect
              x="40"
              y="150"
              width="90"
              height="10"
              rx="5"
              class="fill-ink-200"
            />
            <rect
              x="40"
              y="166"
              width="440"
              height="38"
              rx="10"
              class="fill-white stroke-ink-200"
              stroke-width="1.5"
            />
            <rect
              x="54"
              y="180"
              width="120"
              height="10"
              rx="5"
              class="fill-ink-100"
            />
            <!-- field 2: single choice -->
            <rect
              x="40"
              y="224"
              width="130"
              height="10"
              rx="5"
              class="fill-ink-200"
            />
            <circle cx="52" cy="258" r="9" class="fill-brand-600" />
            <circle cx="52" cy="258" r="3.5" class="fill-white" />
            <rect
              x="72"
              y="253"
              width="150"
              height="10"
              rx="5"
              class="fill-ink-300"
            />
            <circle
              cx="52"
              cy="290"
              r="9"
              class="fill-white stroke-ink-300"
              stroke-width="1.5"
            />
            <rect
              x="72"
              y="285"
              width="110"
              height="10"
              rx="5"
              class="fill-ink-200"
            />
            <!-- submit -->
            <rect
              x="40"
              y="320"
              width="132"
              height="42"
              rx="11"
              class="fill-brand-600"
            />
            <rect
              x="66"
              y="337"
              width="80"
              height="8"
              rx="4"
              class="fill-white"
            />
          </svg>
        </div>
      </section>

      <!-- FEATURES -->
      <section class="grid grid-cols-1 gap-4 pb-20 sm:grid-cols-3">
        <div
          v-for="f in features"
          :key="f.title"
          class="rounded-2xl border border-ink-200 bg-white p-6 shadow-card"
        >
          <span
            class="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600"
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

      <!-- FAQ -->
      <section class="pb-20">
        <h2 class="text-center text-2xl font-semibold tracking-tight">
          Questions, answered
        </h2>
        <div
          class="mx-auto mt-8 max-w-2xl divide-y divide-ink-200 overflow-hidden rounded-2xl border border-ink-200 bg-white"
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
      <div class="rounded-3xl bg-brand-600 px-8 py-14 text-center shadow-pop">
        <h2
          class="text-2xl font-semibold tracking-tight text-white sm:text-3xl"
        >
          Ready to build your first form?
        </h2>
        <p class="mx-auto mt-2 max-w-md text-sm text-brand-100">
          It takes about a minute, and the free plan is genuinely free.
        </p>
        <div class="mt-6 flex justify-center">
          <router-link :to="{ name: 'signup' }">
            <UiButton variant="secondary">Get started — it’s free</UiButton>
          </router-link>
        </div>
      </div>
    </section>

    <footer
      class="mx-auto max-w-5xl px-6 py-8 text-center text-sm text-ink-500"
    >
      © Vedya. Built with the thinnest credible engine.
    </footer>
  </div>
</template>
