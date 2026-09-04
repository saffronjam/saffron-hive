import { m } from "$lib/paraglide/messages.js";

export type Language = "en" | "sv" | "ru";

export const supportedLanguages = ["en", "sv", "ru"] as const satisfies readonly Language[];

const languageNames = {
  en: m.language_english,
  sv: m.language_swedish,
  ru: m.language_russian,
} satisfies Record<Language, typeof m.language_english>;

/** Returns a supported language's name in the requested UI language. */
export function languageName(language: Language, displayLanguage: Language): string {
  return languageNames[language]({}, { locale: displayLanguage });
}

/**
 * Saffron Hive owns messages imported from this module. Provider metadata,
 * protocol values, user-authored text, and raw diagnostics remain verbatim.
 */
export { m };
