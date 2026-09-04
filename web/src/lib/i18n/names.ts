import type { Language } from "$lib/i18n/messages";
import { collator } from "$lib/i18n/format";

export interface LocalizedNameSet {
  entityType: string;
  entityId: string;
  sourceLanguage: Language;
  translations: Partial<Record<Language, string>>;
}

export function localizedName(
  names: LocalizedNameSet | null | undefined,
  activeLanguage: Language,
  sourceValue: string | null | undefined,
  fallback?: string | null,
): string {
  const translated =
    names && activeLanguage !== names.sourceLanguage
      ? names.translations[activeLanguage]?.trim()
      : "";
  return translated || sourceValue?.trim() || fallback?.trim() || names?.entityId || "";
}

export function allLocalizedNames(
  names: LocalizedNameSet | null | undefined,
  sourceValue: string | null | undefined,
  fallback?: string | null,
): string[] {
  return [
    ...new Set(
      [
        sourceValue?.trim(),
        ...Object.values(names?.translations ?? {}).map((value) => value?.trim()),
        fallback?.trim(),
      ].filter((value): value is string => Boolean(value)),
    ),
  ];
}

export function localizedNameMatches(
  query: string,
  names: LocalizedNameSet | null | undefined,
  sourceValue: string | null | undefined,
  fallback?: string | null,
): boolean {
  const normalized = normalizeSearchText(query);
  return (
    !normalized ||
    allLocalizedNames(names, sourceValue, fallback).some((value) =>
      normalizeSearchText(value).includes(normalized),
    )
  );
}

function normalizeSearchText(value: string): string {
  return value.normalize("NFKC").trim().toLocaleLowerCase();
}

export function compareLocalizedNames(
  left: string,
  right: string,
  leftID = "",
  rightID = "",
): number {
  const comparer = collator();
  return comparer.compare(left, right) || leftID.localeCompare(rightID);
}
