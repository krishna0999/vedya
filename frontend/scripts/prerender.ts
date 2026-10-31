// Build-time prerender for the public template pages (SEO). For /templates and
// each /templates/:slug, write dist/<path>/index.html: the built index.html with
// that page's title/description/canonical, plus a static copy of its content
// inside #app. Crawlers read the static HTML; in a browser Vue mounts over it.
// Vercel serves these files before the SPA rewrite. Also writes sitemap.xml.
// The catalog is read straight from the backend's source, so a new template
// gets its page and sitemap entry with no extra step.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Plugin } from 'vite';
import { TEMPLATES, TEMPLATE_CATEGORIES } from '../../backend/src/data/templates';

const ORIGIN = 'https://vedya.app';
const STATIC_PAGES = ['/', '/signup', '/privacy', '/terms'];

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

interface Page {
  path: string;
  title: string;
  description: string;
  body: string;
}

function withPage(shell: string, page: Page): string {
  const url = ORIGIN + page.path;
  const title = esc(page.title);
  const desc = esc(page.description);
  // Function replacers: content containing "$" must not be read as a pattern.
  return shell
    .replace(/<title>[^<]*<\/title>/, () => `<title>${title}</title>`)
    .replace(/(name="description"\s+content=")[^"]*/, (_, a: string) => a + desc)
    .replace(/(property="og:title"\s+content=")[^"]*/, (_, a: string) => a + title)
    .replace(/(property="og:description"\s+content=")[^"]*/, (_, a: string) => a + desc)
    .replace(/(rel="canonical"\s+href=")[^"]*/, (_, a: string) => a + url)
    .replace('<div id="app"></div>', () => `<div id="app">${page.body}</div>`);
}

const questions = (t: (typeof TEMPLATES)[number]) => t.fields.filter((f) => f.type !== 'section_break');

function templatePage(t: (typeof TEMPLATES)[number]): Page {
  const qs = questions(t);
  const related = TEMPLATES.filter((o) => o.category === t.category && o.id !== t.id).slice(0, 6);
  const use = `/signup?redirect=${encodeURIComponent(`/templates/${t.id}?use=1`)}`;
  return {
    path: `/templates/${t.id}`,
    title: `${t.title} template | Vedya`,
    description: `${t.description} Free ${t.title.toLowerCase()} form template.`,
    body: `<main class="mx-auto max-w-3xl px-6 py-10 text-ink-900">
<nav class="text-sm text-ink-500"><a href="/templates">Templates</a> / ${esc(t.category)}</nav>
<h1 class="mt-4 text-3xl font-semibold">${esc(t.title)} template</h1>
<p class="mt-2 text-ink-600">${esc(t.description)}</p>
<p class="mt-3 text-sm text-ink-500">${qs.length} questions · Free</p>
<p class="mt-6"><a href="${esc(use)}">Use this template</a></p>
<h2 class="mt-10 font-semibold">What it asks</h2>
<ol class="mt-3 list-decimal pl-6 text-sm text-ink-700">${qs
      .map((q) => `<li>${esc(q.label)}${q.required ? ' (required)' : ''}</li>`)
      .join('')}</ol>
${
  related.length
    ? `<h2 class="mt-10 font-semibold">More ${esc(t.category)} templates</h2><ul class="mt-3 text-sm">${related
        .map((o) => `<li><a href="/templates/${o.id}">${esc(o.title)}</a>: ${esc(o.description)}</li>`)
        .join('')}</ul>`
    : ''
}
</main>`,
  };
}

function galleryPage(): Page {
  return {
    path: '/templates',
    title: 'Free form templates | Vedya',
    description:
      'Free form templates for contact forms, RSVPs, job applications, surveys, registrations and more. Pick one, edit anything, share a link.',
    body: `<main class="mx-auto max-w-3xl px-6 py-10 text-ink-900">
<h1 class="text-3xl font-semibold">Free form templates</h1>
<p class="mt-2 text-ink-600">Start from a ready-made form, then change anything. Free to use, no card needed.</p>
${TEMPLATE_CATEGORIES.map(
  (c) =>
    `<h2 class="mt-8 font-semibold">${esc(c)}</h2><ul class="mt-2 text-sm">${TEMPLATES.filter((t) => t.category === c)
      .map((t) => `<li><a href="/templates/${t.id}">${esc(t.title)}</a>: ${esc(t.description)}</li>`)
      .join('')}</ul>`,
).join('\n')}
</main>`,
  };
}

export function prerenderTemplates(): Plugin {
  let outDir = 'dist';
  return {
    name: 'prerender-templates',
    apply: 'build',
    configResolved(config) {
      outDir = config.build.outDir;
    },
    closeBundle() {
      const shell = readFileSync(join(outDir, 'index.html'), 'utf8');
      const pages = [galleryPage(), ...TEMPLATES.map(templatePage)];
      for (const page of pages) {
        const dir = join(outDir, page.path);
        mkdirSync(dir, { recursive: true });
        writeFileSync(join(dir, 'index.html'), withPage(shell, page));
      }
      const urls = [...STATIC_PAGES, ...pages.map((p) => p.path)];
      writeFileSync(
        join(outDir, 'sitemap.xml'),
        `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
          .map((u) => `  <url><loc>${ORIGIN}${u}</loc></url>`)
          .join('\n')}\n</urlset>\n`,
      );
    },
  };
}
