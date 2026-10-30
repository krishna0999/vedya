// Per-category presentation for the template gallery: an accent color, a
// monochrome glyph and a short display name. Purely a *taxonomy* channel — it
// makes a wall of 100+ cards scannable, and is never a semantic signal
// (success/warn/danger own that) nor our brand.
//
// Every template ships the same default theme today, so `primaryColor` tints all
// cards identically — which is exactly why they blend together. The category is
// the only axis with real variety, so it drives the accent instead.
//
// The glyph is an outline icon, not an emoji: emoji arrive in fifteen different
// illustration styles at fifteen different weights, which reads as inconsistent
// next to our own chrome. A stroke icon inherits the surrounding text color.
//
// `short` is a display-only nickname for tight rows (the filter pills) — the
// cards below already carry the full context. Omit it when the name is short.
import type { IconName } from '@/lib/icons';

interface CategoryStyle {
  accent: string;
  icon: IconName;
  short?: string;
}

const CATEGORIES: Record<string, CategoryStyle> = {
  'General Business': { accent: '#047857', icon: 'briefcase', short: 'Business' }, // emerald
  Startups: { accent: '#047857', icon: 'rocket-launch' },
  Finance: { accent: '#0f766e', icon: 'banknotes' }, // teal
  'Real Estate': { accent: '#4d7c0f', icon: 'home-modern', short: 'Property' }, // lime
  Education: { accent: '#1d4ed8', icon: 'academic-cap' }, // blue
  HR: { accent: '#4338ca', icon: 'users' }, // indigo
  'Customer Support': { accent: '#0e7490', icon: 'chat-bubble-left-right', short: 'Support' }, // cyan
  Healthcare: { accent: '#be123c', icon: 'heart' }, // rose
  Fitness: { accent: '#c2410c', icon: 'bolt' }, // orange
  Restaurants: { accent: '#c2410c', icon: 'cake' },
  Ecommerce: { accent: '#7e22ce', icon: 'shopping-bag' }, // purple
  Marketing: { accent: '#a21caf', icon: 'megaphone' }, // fuchsia
  Events: { accent: '#b45309', icon: 'ticket' }, // amber
  Wedding: { accent: '#be185d', icon: 'gift' }, // pink
  Creative: { accent: '#be185d', icon: 'paint-brush' },
};

// A category we haven't styled yet reads as "ours" rather than breaking.
const FALLBACK: CategoryStyle = { accent: '#047857', icon: 'rectangle-group' };

export function categoryStyle(category: string): CategoryStyle {
  return CATEGORIES[category] ?? FALLBACK;
}

export function categoryAccent(category: string): string {
  return categoryStyle(category).accent;
}

/** Display name for tight rows — falls back to the full category name. */
export function categoryShort(category: string): string {
  return categoryStyle(category).short ?? category;
}
