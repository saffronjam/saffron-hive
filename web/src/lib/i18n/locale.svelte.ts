import { setLocale } from "$lib/paraglide/runtime.js";
import { supportedLanguages, type Language } from "$lib/i18n/messages";

const STORAGE_KEY = "saffron-hive-language";

const intlLocales = {
  en: "en",
  sv: "sv-SE",
  ru: "ru-RU",
} as const satisfies Record<Language, string>;

export const selectableLanguages = ["en", "sv", "ru"] as const satisfies readonly Language[];

export function normalizeLanguage(value: unknown): Language | null {
  if (typeof value !== "string") return null;
  const base = value.trim().toLowerCase().split(/[-_]/, 1)[0];
  return supportedLanguages.find((language) => language === base) ?? null;
}

export function resolveInitialLanguage(
  stored: unknown = readStoredLanguage(),
  preferred: readonly string[] = readPreferredLanguages(),
): Language {
  const cached = normalizeLanguage(stored);
  if (cached) return cached;
  for (const candidate of preferred) {
    const language = normalizeLanguage(candidate);
    if (language) return language;
  }
  return "en";
}

function readStoredLanguage(): string | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY);
}

function readPreferredLanguages(): readonly string[] {
  if (typeof navigator === "undefined") return [];
  return navigator.languages.length > 0 ? navigator.languages : [navigator.language];
}

function persistLanguage(language: Language): void {
  if (typeof localStorage !== "undefined") localStorage.setItem(STORAGE_KEY, language);
}

function applyDocumentLanguage(language: Language): void {
  if (typeof document !== "undefined") document.documentElement.lang = language;
}

function createLocaleState() {
  const initialLanguage = resolveInitialLanguage();
  let language = $state<Language>(initialLanguage);

  function apply(next: Language, persist: boolean): void {
    language = next;
    setLocale(next, { reload: false });
    applyDocumentLanguage(next);
    if (persist) persistLanguage(next);
  }

  apply(initialLanguage, false);

  return {
    get currentLanguage(): Language {
      return language;
    },
    get intlLocale(): string {
      return intlLocales[language];
    },
    messageOptions(): { locale: Language } {
      return { locale: language };
    },
    setLanguage(next: Language): void {
      apply(next, true);
    },
    syncFromProfile(next: Language): void {
      apply(next, true);
    },
  };
}

export const locale = createLocaleState();

export function setLanguage(language: Language): void {
  locale.setLanguage(language);
}
