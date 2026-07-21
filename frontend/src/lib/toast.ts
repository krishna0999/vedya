// App-wide toasts. Module-level state, not a store: there's exactly one stack
// on screen and no server round-trip involved, so a Pinia store would just be
// ceremony. <UiToaster> in AppShell renders whatever is in here.
import { ref } from "vue";

export interface Toast {
  id: number;
  text: string;
  tone: "info" | "success" | "error";
}

export const toasts = ref<Toast[]>([]);
let seq = 0;

export function dismissToast(id: number): void {
  toasts.value = toasts.value.filter((t) => t.id !== id);
}

/** Show a toast; errors linger longer because they usually need reading. */
export function toast(text: string, tone: Toast["tone"] = "info"): void {
  const id = ++seq;
  toasts.value = [...toasts.value, { id, text, tone }];
  setTimeout(() => dismissToast(id), tone === "error" ? 6000 : 3500);
}
