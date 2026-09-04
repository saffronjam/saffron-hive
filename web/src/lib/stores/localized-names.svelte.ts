import type { Client } from "@urql/svelte";
import { graphql } from "$lib/gql";
import { locale } from "$lib/i18n/locale.svelte";
import {
  allLocalizedNames,
  localizedName,
  localizedNameMatches,
  type LocalizedNameSet,
} from "$lib/i18n/names";
import type { Language } from "$lib/i18n/messages";
import { Language as GraphQLLanguage } from "$lib/gql/graphql";
import { standardRoomName, standardRoomSearchNames } from "$lib/i18n/standard-room-names";

const QUERY = graphql(`
  query LocalizedNamesBootstrap {
    localizedNameSets {
      entityType
      entityId
      sourceLanguage
      translations {
        language
        value
      }
    }
    settings {
      key
      value
    }
  }
`);

const UPDATE = graphql(`
  mutation UpdateLocalizedNameSet($input: LocalizedNameSetInput!) {
    updateLocalizedNameSet(input: $input) {
      entityType
      entityId
      sourceLanguage
      translations {
        language
        value
      }
    }
  }
`);

interface WireNameSet {
  entityType: string;
  entityId: string;
  sourceLanguage: string;
  translations: Array<{ language: string; value: string }>;
}

function fromWire(value: WireNameSet): LocalizedNameSet {
  const translations: Partial<Record<Language, string>> = {};
  for (const item of value.translations)
    translations[item.language.toLowerCase() as Language] = item.value;
  return {
    entityType: value.entityType,
    entityId: value.entityId,
    sourceLanguage: value.sourceLanguage.toLowerCase() as Language,
    translations,
  };
}

function key(entityType: string, entityId: string): string {
  return `${entityType}\u0000${entityId}`;
}

function graphQLLanguage(language: Language): GraphQLLanguage {
  switch (language) {
    case "sv":
      return GraphQLLanguage.Sv;
    case "ru":
      return GraphQLLanguage.Ru;
    default:
      return GraphQLLanguage.En;
  }
}

let sets = $state(new Map<string, LocalizedNameSet>());
let defaultContentLanguage = $state<Language>("en");
let translateStandardRoomNames = $state(false);

function sourceLanguage(names: LocalizedNameSet | undefined): Language {
  return names?.sourceLanguage ?? defaultContentLanguage;
}

function sourceName(sourceValue?: string | null, fallback?: string | null): string {
  return sourceValue?.trim() || fallback?.trim() || "";
}

function standardNames(
  entityType: string,
  names: LocalizedNameSet | undefined,
  sourceValue?: string | null,
  fallback?: string | null,
): string[] {
  const source = sourceName(sourceValue, fallback);
  return translateStandardRoomNames && entityType === "room" && source
    ? standardRoomSearchNames(source, sourceLanguage(names))
    : [];
}

export const localizedNamesStore = {
  get translateStandardRoomNames(): boolean {
    return translateStandardRoomNames;
  },
  get(entityType: string, entityId: string): LocalizedNameSet | undefined {
    return sets.get(key(entityType, entityId));
  },
  display(
    entityType: string,
    entityId: string,
    sourceValue?: string | null,
    fallback?: string | null,
  ): string {
    const names = sets.get(key(entityType, entityId));
    const activeLanguage = locale.currentLanguage;
    const explicitTranslation =
      names && activeLanguage !== names.sourceLanguage
        ? names.translations[activeLanguage]?.trim()
        : "";
    if (explicitTranslation) return explicitTranslation;
    const source = sourceName(sourceValue, fallback);
    if (
      translateStandardRoomNames &&
      entityType === "room" &&
      source &&
      activeLanguage !== sourceLanguage(names)
    ) {
      const translated = standardRoomName(source, sourceLanguage(names), activeLanguage);
      if (translated) return translated;
    }
    return localizedName(names, activeLanguage, sourceValue, fallback) || entityId;
  },
  matches(
    entityType: string,
    entityId: string,
    query: string,
    sourceValue?: string | null,
    fallback?: string | null,
  ): boolean {
    const names = sets.get(key(entityType, entityId));
    if (localizedNameMatches(query, names, sourceValue, fallback)) return true;
    const normalized = query.normalize("NFKC").trim().toLocaleLowerCase();
    return standardNames(entityType, names, sourceValue, fallback).some((value) =>
      value.normalize("NFKC").toLocaleLowerCase().includes(normalized),
    );
  },
  searchValues(
    entityType: string,
    entityId: string,
    sourceValue?: string | null,
    fallback?: string | null,
  ): string[] {
    const names = sets.get(key(entityType, entityId));
    return [
      ...new Set([
        ...allLocalizedNames(names, sourceValue, fallback),
        ...standardNames(entityType, names, sourceValue, fallback),
      ]),
    ];
  },
  async refresh(client: Client): Promise<void> {
    const result = await client.query(QUERY, {}, { requestPolicy: "network-only" }).toPromise();
    if (!result.data) return;
    sets = new Map(
      (result.data.localizedNameSets as WireNameSet[]).map((item) => {
        const names = fromWire(item);
        return [key(names.entityType, names.entityId), names];
      }),
    );
    defaultContentLanguage = "en";
    translateStandardRoomNames = false;
    for (const setting of result.data.settings) {
      if (
        setting.key === "i18n.default_content_language" &&
        ["en", "sv", "ru"].includes(setting.value)
      ) {
        defaultContentLanguage = setting.value as Language;
      } else if (setting.key === "i18n.translate_standard_room_names") {
        translateStandardRoomNames = setting.value === "true";
      }
    }
  },
  setDefaultContentLanguage(language: Language): void {
    defaultContentLanguage = language;
  },
  setTranslateStandardRoomNames(enabled: boolean): void {
    translateStandardRoomNames = enabled;
  },
  async update(client: Client, names: LocalizedNameSet): Promise<boolean> {
    const result = await client
      .mutation(UPDATE, {
        input: {
          entityType: names.entityType,
          entityId: names.entityId,
          sourceLanguage: graphQLLanguage(names.sourceLanguage),
          translations: Object.entries(names.translations)
            .filter(([, value]) => Boolean(value?.trim()))
            .map(([language, value]) => ({
              language: graphQLLanguage(language as Language),
              value: value!.trim(),
            })),
        },
      })
      .toPromise();
    if (!result.data?.updateLocalizedNameSet) return false;
    const saved = fromWire(result.data.updateLocalizedNameSet as WireNameSet);
    const next = new Map(sets);
    next.set(key(saved.entityType, saved.entityId), saved);
    sets = next;
    return true;
  },
  clear(): void {
    sets = new Map();
    defaultContentLanguage = "en";
    translateStandardRoomNames = false;
  },
};
