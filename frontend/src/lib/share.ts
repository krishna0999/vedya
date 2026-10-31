// Embed snippet for a published form: a plain iframe of the public renderer in
// embed mode (no page background). vercel.json lets /f/* be framed.
// ponytail: fixed height that scrolls inside; add a postMessage auto-resize
// script when creators ask for it.
const attr = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

export function embedCode(formId: string, title: string): string {
  const src = `${window.location.origin}/f/${formId}?embed=1`;
  return `<iframe src="${src}" title="${attr(title)}" width="100%" height="700" style="border:0" loading="lazy"></iframe>`;
}
