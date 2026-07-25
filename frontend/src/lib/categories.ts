// Per-category presentation for the template gallery: an accent color and a
// glyph. Purely a *taxonomy* channel — it makes a wall of 100+ cards scannable,
// and is never a semantic signal (success/warn/danger own that) nor our brand.
//
// Every template ships the same default theme today, so `primaryColor` tints all
// cards identically — which is exactly why they blend together. The category is
// the only axis with real variety, so it drives the accent instead.
//
// One entry per category; cards derive their tints from the hex with color-mix,
// so adding a category is a single line here.
interface CategoryStyle {
  accent: string;
  icon: string;
}

const CATEGORIES: Record<string, CategoryStyle> = {
  'General Business': { accent: '#047857', icon: '💼' }, // emerald
  Startups: { accent: '#047857', icon: '🚀' },
  Finance: { accent: '#0f766e', icon: '💰' }, // teal
  'Real Estate': { accent: '#4d7c0f', icon: '🏡' }, // lime
  Education: { accent: '#1d4ed8', icon: '🎓' }, // blue
  HR: { accent: '#4338ca', icon: '👥' }, // indigo
  'Customer Support': { accent: '#0e7490', icon: '💬' }, // cyan
  Healthcare: { accent: '#be123c', icon: '❤️' }, // rose
  Fitness: { accent: '#c2410c', icon: '💪' }, // orange
  Restaurants: { accent: '#c2410c', icon: '🍽️' },
  Ecommerce: { accent: '#7e22ce', icon: '🛍️' }, // purple
  Marketing: { accent: '#a21caf', icon: '📣' }, // fuchsia
  Events: { accent: '#b45309', icon: '🎉' }, // amber
  Wedding: { accent: '#be185d', icon: '💍' }, // pink
  Creative: { accent: '#be185d', icon: '🎨' },
};

// A category we haven't styled yet reads as "ours" rather than breaking.
const FALLBACK: CategoryStyle = { accent: '#047857', icon: '📋' };

export function categoryStyle(category: string): CategoryStyle {
  return CATEGORIES[category] ?? FALLBACK;
}

export function categoryAccent(category: string): string {
  return categoryStyle(category).accent;
}
