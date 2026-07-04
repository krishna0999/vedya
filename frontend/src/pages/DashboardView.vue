<script setup lang="ts">
// Owner dashboard: list forms, create, jump to editor / responses, share, delete.
// Owner is the dev stub until auth (step 5); this is the "my forms" surface.
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { api, type FormSummary } from '@/api/client';
import UiButton from '@/components/ui/UiButton.vue';

const router = useRouter();
const forms = ref<FormSummary[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const creating = ref(false);

async function load(): Promise<void> {
  loading.value = true;
  error.value = null;
  try {
    forms.value = await api.listForms();
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load forms.';
  } finally {
    loading.value = false;
  }
}

async function createForm(): Promise<void> {
  creating.value = true;
  try {
    const draft = await api.createForm();
    router.push({ name: 'builder', params: { id: draft.id } });
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to create form.';
    creating.value = false;
  }
}

async function remove(form: FormSummary): Promise<void> {
  if (!confirm(`Delete “${form.title}” and all its responses? This cannot be undone.`)) return;
  try {
    await api.deleteForm(form.id);
    forms.value = forms.value.filter((f) => f.id !== form.id);
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to delete form.';
  }
}

const copied = ref<string | null>(null);
async function copyLink(form: FormSummary): Promise<void> {
  const url = `${window.location.origin}/f/${form.id}`;
  await navigator.clipboard.writeText(url);
  copied.value = form.id;
  setTimeout(() => (copied.value = copied.value === form.id ? null : copied.value), 1500);
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

onMounted(load);
</script>

<template>
  <div class="min-h-screen bg-ink-50 text-ink-900">
    <header class="border-b border-ink-200 bg-white">
      <div class="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
        <div class="flex items-center gap-2.5">
          <span class="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-sm font-bold text-white">F</span>
          <span class="text-base font-semibold">Forms</span>
        </div>
        <UiButton :disabled="creating" @click="createForm">
          <span>{{ creating ? 'Creating…' : 'New form' }}</span>
        </UiButton>
      </div>
    </header>

    <main class="mx-auto max-w-4xl px-6 py-8">
      <p v-if="error" class="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-danger">
        {{ error }}
      </p>

      <div v-if="loading" class="py-16 text-center text-sm text-ink-400">Loading your forms…</div>

      <div
        v-else-if="forms.length === 0"
        class="rounded-2xl border border-dashed border-ink-300 bg-white p-12 text-center"
      >
        <h2 class="text-lg font-semibold text-ink-900">No forms yet</h2>
        <p class="mx-auto mt-1 max-w-sm text-sm text-ink-500">
          Create your first form, add a few fields, and publish to share a link.
        </p>
        <div class="mt-5">
          <UiButton :disabled="creating" @click="createForm">Create a form</UiButton>
        </div>
      </div>

      <ul v-else class="space-y-3">
        <li
          v-for="form in forms"
          :key="form.id"
          class="flex items-center gap-4 rounded-xl border border-ink-200 bg-white p-4 shadow-card transition hover:border-ink-300"
        >
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <router-link
                :to="{ name: 'builder', params: { id: form.id } }"
                class="truncate font-semibold text-ink-900 hover:text-brand-700"
              >
                {{ form.title }}
              </router-link>
              <span
                v-if="form.published"
                class="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700"
              >Published</span>
              <span v-else class="rounded-full bg-ink-100 px-2 py-0.5 text-xs font-medium text-ink-500">Draft</span>
            </div>
            <p class="mt-0.5 text-xs text-ink-400">
              {{ form.responseCount }} response{{ form.responseCount === 1 ? '' : 's' }} · edited {{ relativeTime(form.updatedAt) }}
            </p>
          </div>

          <div class="flex shrink-0 items-center gap-1.5">
            <UiButton
              variant="ghost"
              size="sm"
              :disabled="!form.published"
              :title="form.published ? 'Copy public link' : 'Publish the form to get a link'"
              @click="copyLink(form)"
            >
              {{ copied === form.id ? 'Copied!' : 'Copy link' }}
            </UiButton>
            <UiButton
              variant="secondary"
              size="sm"
              @click="router.push({ name: 'responses', params: { id: form.id } })"
            >
              Responses
            </UiButton>
            <UiButton
              variant="secondary"
              size="sm"
              @click="router.push({ name: 'builder', params: { id: form.id } })"
            >
              Edit
            </UiButton>
            <UiButton variant="danger" size="sm" @click="remove(form)">Delete</UiButton>
          </div>
        </li>
      </ul>
    </main>
  </div>
</template>
