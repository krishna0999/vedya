// Default form theme for newly created forms. Derives from the product brand
// (indigo/violet, comfortably rounded) but is owned by the form once created —
// creators override it per form (CLAUDE.md §7, two theme layers).
import type { Theme } from '../schema/index';

export const DEFAULT_THEME: Theme = {
  primaryColor: '#4f46e5',
  fontFamily: 'Inter, system-ui, sans-serif',
  borderRadius: 10,
};
