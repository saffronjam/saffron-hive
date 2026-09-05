import { Language as GraphQLLanguage } from "$lib/gql/graphql";
import type { Language } from "$lib/i18n/messages";

export function languageFromGraphQL(value: GraphQLLanguage | null | undefined): Language {
  if (value === GraphQLLanguage.Sv) return "sv";
  if (value === GraphQLLanguage.Ru) return "ru";
  return "en";
}

export function languageToGraphQL(value: Language): GraphQLLanguage {
  if (value === "sv") return GraphQLLanguage.Sv;
  if (value === "ru") return GraphQLLanguage.Ru;
  return GraphQLLanguage.En;
}
