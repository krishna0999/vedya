// Public surface of the shared schema. Frontend imports from here via `@schema`;
// backend imports from here directly. This is the ONLY definition of field shapes.
export * from './types';
export {
  validateAnswers, validateFormTitle, FORM_TITLE_MAX, isSafeRedirectUrl, isFormClosed,
} from './validate';
