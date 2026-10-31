// Link previews for shared forms (Vercel Routing Middleware, /f/* only).
// Crawlers (WhatsApp, Slack, LinkedIn, X...) don't run JS, so a bare SPA makes
// every form link preview as the Vedya home page. For crawler requests only,
// swap index.html's static meta tags for the form's own title. People get the
// untouched SPA with no added latency, and on any failure the request simply
// continues (returning nothing = pass through).
// ponytail: text-only preview with the Vedya logo; render a per-form OG image
// when link previews matter enough to pay for one.
export const config = { matcher: '/f/:path*' };

const CRAWLER =
  /bot|crawl|spider|facebookexternalhit|whatsapp|slack|linkedin|telegram|discord|embedly|pinterest|skypeuripreview/i;
const API = process.env.VITE_API_BASE ?? 'https://api.vedya.app/api';

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

interface PublicFormMeta {
  title?: string;
  branding?: boolean;
  closed?: boolean;
}

export default async function middleware(request: Request): Promise<Response | undefined> {
  if (!CRAWLER.test(request.headers.get('user-agent') ?? '')) return;
  const url = new URL(request.url);
  const formId = url.pathname.split('/')[2];
  if (!formId) return;
  try {
    const [page, form] = await Promise.all([
      fetch(new URL('/index.html', url)).then((r) => r.text()),
      fetch(`${API}/f/${encodeURIComponent(formId)}`, { signal: AbortSignal.timeout(4000) }).then(
        (r) => (r.ok ? (r.json() as Promise<PublicFormMeta>) : null),
      ),
    ]);
    if (!form?.title) return;
    const title = esc(form.title);
    const desc = form.closed
      ? 'This form is closed.'
      : form.branding === false
        ? 'Fill out this form.'
        : 'Fill out this form on Vedya.';
    // Function replacers: a title containing "$1" must not be read as a pattern.
    const html = page
      .replace(/<title>[^<]*<\/title>/, () => `<title>${title}</title>`)
      .replace(/(property="og:title"\s+content=")[^"]*/, (_, a: string) => a + title)
      .replace(/(name="description"\s+content=")[^"]*/, (_, a: string) => a + desc)
      .replace(/(property="og:description"\s+content=")[^"]*/, (_, a: string) => a + desc)
      .replace('</head>', () => `<meta property="og:url" content="${esc(url.origin + url.pathname)}" />\n</head>`);
    return new Response(html, {
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'public, max-age=300',
        // Previews yes, search results no: people's forms don't belong in Google.
        'x-robots-tag': 'noindex',
      },
    });
  } catch {
    return;
  }
}
