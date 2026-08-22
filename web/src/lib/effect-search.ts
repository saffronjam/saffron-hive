export function matchesEffectFilter(
  source: string,
  terms: readonly string[],
  sourceValues: readonly string[],
  query: string,
): boolean {
  if (sourceValues.length > 0 && !sourceValues.includes(source)) return false;
  const normalizedQuery = query.trim().toLowerCase();
  return (
    normalizedQuery.length === 0 ||
    terms.some((term) => term.toLowerCase().includes(normalizedQuery))
  );
}
