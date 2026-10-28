// ---------------------------------------------------------------------------
// The admin's interface wording: react-admin's English, with a few changes.
// "Export" on a list made a CSV of that list, and could be mistaken for the
// full export on Organization settings (2026-10-27).
// ---------------------------------------------------------------------------
import polyglotI18nProvider from "ra-i18n-polyglot";
import englishMessages from "ra-language-english";

const messages = {
  ...englishMessages,
  ra: {
    ...englishMessages.ra,
    action: {
      ...englishMessages.ra.action,
      export: "Export list (CSV)",
    },
  },
};

// As react-admin's own default, but with these messages.
export const i18nProvider = polyglotI18nProvider(() => messages, "en", [{ name: "en", value: "English" }], {
  allowMissing: true,
});
