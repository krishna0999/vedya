<script setup lang="ts">
// Dedicated phone field: searchable country selector (flag + dial code) + number
// input in one control. Formats the number as-you-type for the selected country
// and validates it (libphonenumber-js). Emits a canonical E.164 string
// ("+4915123456789"); the shared validator enforces E.164 shape server-side too.
import { computed, nextTick, onBeforeUnmount, ref } from "vue";
import {
  AsYouType,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js";
import { COUNTRIES, flagEmoji, type Country } from "@/data/countries";
import UiIcon from "@/components/ui/UiIcon.vue";

const props = defineProps<{
  id?: string;
  modelValue: string | undefined;
  placeholder?: string;
  invalid?: boolean;
  defaultIso?: string;
}>();
const emit = defineEmits<{ "update:modelValue": [value: string] }>();

const country = ref<Country>(
  COUNTRIES.find((c) => c.iso2 === (props.defaultIso ?? "US")) ?? COUNTRIES[0]!,
);
const national = ref(""); // formatted, for display

function iso(): CountryCode {
  return country.value.iso2 as CountryCode;
}
function digitsOf(s: string): string {
  return s.replace(/\D/g, "");
}

// Parse an existing E.164 value once into country + formatted national number.
(() => {
  const v = (props.modelValue ?? "").trim();
  if (!v) return;
  const parsed = parsePhoneNumberFromString(v);
  if (parsed?.country) {
    const match = COUNTRIES.find((c) => c.iso2 === parsed.country);
    if (match) country.value = match;
    national.value = new AsYouType(parsed.country).input(parsed.nationalNumber);
  } else {
    national.value = v;
  }
})();

function emitValue(): void {
  const d = digitsOf(national.value);
  if (!d) {
    emit("update:modelValue", "");
    return;
  }
  const parsed = parsePhoneNumberFromString(d, iso());
  emit(
    "update:modelValue",
    parsed ? parsed.number : `${country.value.dial}${d}`,
  );
}

function onNational(e: Event): void {
  const d = digitsOf((e.target as HTMLInputElement).value);
  national.value = new AsYouType(iso()).input(d);
  emitValue();
}

// --- country dropdown ---
const open = ref(false);
const active = ref(0);
const query = ref("");
const root = ref<HTMLElement | null>(null);
const searchEl = ref<HTMLInputElement | null>(null);

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) return COUNTRIES;
  return COUNTRIES.filter(
    (c) => c.name.toLowerCase().includes(q) || c.dial.includes(q),
  );
});

function onDocPointer(e: MouseEvent): void {
  if (root.value && !root.value.contains(e.target as Node)) close();
}
function openMenu(): void {
  if (open.value) return;
  open.value = true;
  query.value = "";
  active.value = 0;
  document.addEventListener("mousedown", onDocPointer);
  void nextTick(() => searchEl.value?.focus());
}
function close(): void {
  if (!open.value) return;
  open.value = false;
  document.removeEventListener("mousedown", onDocPointer);
}
function toggle(): void {
  open.value ? close() : openMenu();
}
function pick(c: Country): void {
  country.value = c;
  // Reformat the existing number under the new country's rules.
  national.value = new AsYouType(c.iso2 as CountryCode).input(
    digitsOf(national.value),
  );
  close();
  emitValue();
}
function move(delta: number): void {
  const n = filtered.value.length;
  if (n === 0) return;
  active.value = (active.value + delta + n) % n;
}
function onKeydown(e: KeyboardEvent): void {
  switch (e.key) {
    case "ArrowDown":
      e.preventDefault();
      open.value ? move(1) : openMenu();
      break;
    case "ArrowUp":
      e.preventDefault();
      move(-1);
      break;
    case "Enter":
      e.preventDefault();
      if (open.value && filtered.value[active.value])
        pick(filtered.value[active.value]!);
      break;
    case "Escape":
      close();
      break;
    default:
      break;
  }
}

onBeforeUnmount(() => document.removeEventListener("mousedown", onDocPointer));
</script>

<template>
  <div ref="root" class="relative">
    <div :class="['fb-phone', invalid && 'fb-phone--invalid']">
      <button
        type="button"
        class="flex items-center gap-1.5 border-r border-line-200 px-3 text-ink-700 transition-colors duration-150 hover:bg-ink-50"
        :aria-expanded="open"
        aria-haspopup="listbox"
        aria-label="Select country"
        @click="toggle"
        @keydown="onKeydown"
      >
        <span class="text-lg leading-none">{{ flagEmoji(country.iso2) }}</span>
        <UiIcon
          name="chevron-down"
          class="h-5 w-5 text-ink-500 transition-transform duration-150"
          :class="open && 'rotate-180'"
        />
      </button>

      <div class="flex flex-1 items-center gap-1.5 px-3">
        <span class="shrink-0 text-ink-500">{{ country.dial }}</span>
        <input
          :id="id"
          type="tel"
          inputmode="tel"
          :value="national"
          :placeholder="placeholder ?? '123 456 789'"
          class="w-full bg-transparent py-2.5 text-ink-900 outline-none placeholder:text-ink-500"
          @input="onNational"
        />
      </div>
    </div>

    <transition
      enter-active-class="transition duration-150 ease-soft"
      enter-from-class="opacity-0 -translate-y-1"
      leave-active-class="transition duration-100 ease-soft"
      leave-to-class="opacity-0 -translate-y-1"
    >
      <div
        v-if="open"
        class="absolute z-20 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-md border border-line-200 bg-white shadow-pop"
      >
        <div class="flex items-center gap-2 border-b border-line-100 px-3">
          <UiIcon
            name="magnifying-glass"
            class="h-5 w-5 shrink-0 text-ink-500"
          />
          <input
            ref="searchEl"
            v-model="query"
            type="text"
            placeholder="Search for countries"
            class="w-full bg-transparent py-2.5 text-ink-900 outline-none placeholder:text-ink-500"
            @keydown="onKeydown"
          />
        </div>
        <ul role="listbox" class="max-h-64 overflow-auto p-1">
          <li
            v-for="(c, i) in filtered"
            :key="c.iso2 + c.dial"
            role="option"
            :aria-selected="c.iso2 === country.iso2"
            class="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-ink-800"
            :class="i === active ? 'bg-ink-50' : 'hover:bg-ink-50'"
            @mouseenter="active = i"
            @click="pick(c)"
          >
            <span class="text-lg leading-none">{{ flagEmoji(c.iso2) }}</span>
            <span class="min-w-0 flex-1 truncate"
              >{{ c.name }} ({{ c.dial }})</span
            >
            <UiIcon
              v-if="c.iso2 === country.iso2"
              name="check"
              class="h-5 w-5 shrink-0 text-brand-600"
            />
          </li>
          <li
            v-if="filtered.length === 0"
            class="px-3 py-3 text-sm text-ink-500"
          >
            No matches
          </li>
        </ul>
      </div>
    </transition>
  </div>
</template>
