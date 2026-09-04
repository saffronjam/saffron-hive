import { locale } from "$lib/i18n/locale.svelte";
import type { Language } from "$lib/i18n/messages";

const intlLocales = {
  en: "en",
  sv: "sv-SE",
  ru: "ru-RU",
} as const satisfies Record<Language, string>;

export function intlLocale(language: Language = locale.currentLanguage): string {
  return intlLocales[language];
}

export function numberFormatter(
  options: Intl.NumberFormatOptions = {},
  language: Language = locale.currentLanguage,
): Intl.NumberFormat {
  return new Intl.NumberFormat(intlLocale(language), options);
}

export function formatNumber(
  value: number,
  options: Intl.NumberFormatOptions = {},
  language: Language = locale.currentLanguage,
): string {
  return numberFormatter(options, language).format(value);
}

export function formatCount(value: number, language: Language = locale.currentLanguage): string {
  return formatNumber(value, { maximumFractionDigits: 0 }, language);
}

export function formatPercent(
  value: number,
  options: Intl.NumberFormatOptions = {},
  language: Language = locale.currentLanguage,
): string {
  return formatNumber(value, { style: "percent", ...options }, language);
}

export function formatMeasurement(
  value: number,
  unit: string,
  options: Intl.NumberFormatOptions = {},
  language: Language = locale.currentLanguage,
): string {
  return `${formatNumber(value, options, language)}\u00a0${unit}`;
}

export function formatShortDuration(
  value: number,
  unit: "millisecond" | "second" | "minute",
  language: Language = locale.currentLanguage,
  options: Intl.NumberFormatOptions = {},
): string {
  return formatNumber(
    value,
    { style: "unit", unit, unitDisplay: "short", maximumFractionDigits: 1, ...options },
    language,
  );
}

export function listFormatter(
  options: Intl.ListFormatOptions = {},
  language: Language = locale.currentLanguage,
): Intl.ListFormat {
  return new Intl.ListFormat(intlLocale(language), options);
}

export function formatList(
  values: readonly string[],
  options: Intl.ListFormatOptions = {},
  language: Language = locale.currentLanguage,
): string {
  return listFormatter(options, language).format(values);
}

export function collator(
  options: Intl.CollatorOptions = { numeric: true, sensitivity: "base" },
  language: Language = locale.currentLanguage,
): Intl.Collator {
  return new Intl.Collator(intlLocale(language), options);
}

export function compareLocalized(
  left: string,
  right: string,
  language: Language = locale.currentLanguage,
): number {
  return collator(undefined, language).compare(left, right);
}
