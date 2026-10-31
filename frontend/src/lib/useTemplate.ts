// "Use this template" from the public template pages. Signed in: create the
// form and open the builder. Signed out: send them to sign up, then back to the
// template page with ?use=1, which finishes the job (see TemplateView).
import { ref } from "vue";
import { useRouter } from "vue-router";
import { api } from "@/api/client";
import { useAuthStore } from "@/stores/auth";

export function useTemplateAction() {
  const auth = useAuthStore();
  const router = useRouter();
  const busy = ref(false);
  const error = ref<string | null>(null);

  async function use(templateId: string): Promise<void> {
    error.value = null;
    if (!auth.ready) await auth.init();
    if (!auth.isAuthenticated) {
      await router.push({
        name: "signup",
        query: { redirect: `/templates/${templateId}?use=1` },
      });
      return;
    }
    busy.value = true;
    try {
      const draft = await api.createFromTemplate(templateId);
      await router.push({ name: "builder", params: { id: draft.id } });
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Couldn't create the form. Try again.";
      busy.value = false;
    }
  }

  return { busy, error, use };
}
