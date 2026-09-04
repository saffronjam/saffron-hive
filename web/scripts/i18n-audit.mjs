import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const languages = ["en", "sv", "ru"];
const catalogs = Object.fromEntries(
  await Promise.all(
    languages.map(async (language) => [
      language,
      JSON.parse(await readFile(path.join(root, "messages", `${language}.json`), "utf8")),
    ]),
  ),
);
const allowlist = JSON.parse(
  await readFile(path.join(root, "scripts", "i18n-allowlist.json"), "utf8"),
);
const errors = [];
const englishKeys = Object.keys(catalogs.en);

function balancedEnd(value, start) {
  let depth = 0;
  for (let index = start; index < value.length; index += 1) {
    if (value[index] === "{") depth += 1;
    else if (value[index] === "}" && --depth === 0) return index;
  }
  throw new Error(`unbalanced ICU message: ${value}`);
}

function argumentsOf(message) {
  const names = new Set();
  function topLevelCommas(value) {
    const commas = [];
    let depth = 0;
    for (let index = 0; index < value.length; index += 1) {
      if (value[index] === "{") depth += 1;
      else if (value[index] === "}") depth -= 1;
      else if (value[index] === "," && depth === 0) commas.push(index);
    }
    return commas;
  }
  function visitBranches(value) {
    let cursor = 0;
    while (cursor < value.length) {
      const match = /(?:^|\s)=?[A-Za-z0-9_-]+\s*\{/.exec(value.slice(cursor));
      if (!match) break;
      const start = cursor + match.index + match[0].lastIndexOf("{");
      const end = balancedEnd(value, start);
      visit(value.slice(start + 1, end));
      cursor = end + 1;
    }
  }
  function visit(value) {
    let cursor = 0;
    while (cursor < value.length) {
      const start = value.indexOf("{", cursor);
      if (start === -1) break;
      const end = balancedEnd(value, start);
      const content = value.slice(start + 1, end);
      const commas = topLevelCommas(content);
      if (commas.length < 2) {
        if (/^[A-Za-z][A-Za-z0-9_]*$/.test(content.trim())) names.add(content.trim());
      } else {
        const name = content.slice(0, commas[0]).trim();
        if (/^[A-Za-z][A-Za-z0-9_]*$/.test(name)) names.add(name);
        visitBranches(content.slice(commas[1] + 1));
      }
      cursor = end + 1;
    }
  }
  visit(message);
  return [...names].toSorted().join(",");
}

for (const language of languages) {
  const keys = Object.keys(catalogs[language]);
  const missing = englishKeys.filter((key) => !(key in catalogs[language]));
  const extra = keys.filter((key) => !(key in catalogs.en));
  if (missing.length) errors.push(`${language}: missing keys: ${missing.join(", ")}`);
  if (extra.length) errors.push(`${language}: extra keys: ${extra.join(", ")}`);
  for (const key of keys) {
    if (typeof catalogs[language][key] !== "string" || !catalogs[language][key].trim()) {
      errors.push(`${language}.${key}: empty message`);
      continue;
    }
    if (argumentsOf(catalogs[language][key]) !== argumentsOf(catalogs.en[key] ?? "")) {
      errors.push(`${language}.${key}: arguments differ from English`);
    }
    if (language !== "en") {
      const englishInitial = catalogs.en[key]?.match(/\p{L}/u)?.[0];
      const translatedInitial = catalogs[language][key].match(/\p{L}/u)?.[0];
      const englishStartsUppercase =
        englishInitial && englishInitial === englishInitial.toLocaleUpperCase("en");
      const translationStartsLowercase =
        translatedInitial &&
        translatedInitial !== translatedInitial.toLocaleUpperCase(language) &&
        translatedInitial === translatedInitial.toLocaleLowerCase(language);
      if (englishStartsUppercase && translationStartsLowercase) {
        errors.push(`${language}.${key}: standalone message must begin with a capital letter`);
      }
    }
    if (language === "ru" && /,\s*plural,/.test(catalogs[language][key])) {
      if (!/\bfew\s*\{/.test(catalogs[language][key]) || !/\bmany\s*\{/.test(catalogs[language][key])) {
        errors.push(`ru.${key}: Russian plural requires few and many branches`);
      }
    }
  }
}

async function sourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "paraglide" && entry.name !== "gql") files.push(...(await sourceFiles(absolute)));
    } else if (entry.name.endsWith(".svelte") || entry.name.endsWith(".ts")) {
      files.push(absolute);
    }
  }
  return files;
}

const usedMessages = new Set();
const literals = [];
function withoutSvelteExpressions(value) {
  let depth = 0;
  let result = "";
  for (const character of value) {
    if (character === "{") {
      depth += 1;
    } else if (character === "}") {
      depth = Math.max(0, depth - 1);
    } else if (depth === 0) {
      result += character;
    }
  }
  return result;
}

function textNodes(markup) {
  const nodes = [];
  let text = "";
  let inTag = false;
  let quote = null;
  let braceDepth = 0;
  let escaped = false;
  for (const character of markup) {
    if (inTag) {
      if (quote !== null) {
        if (character === quote && !escaped) quote = null;
        escaped = character === "\\" && !escaped;
        if (character !== "\\") escaped = false;
      } else if (character === '"' || character === "'") {
        quote = character;
      } else if (character === "{") {
        braceDepth += 1;
      } else if (character === "}") {
        braceDepth = Math.max(0, braceDepth - 1);
      } else if (character === ">" && braceDepth === 0) {
        inTag = false;
      }
    } else if (character === "{") {
      braceDepth += 1;
      text += character;
    } else if (character === "}") {
      braceDepth = Math.max(0, braceDepth - 1);
      text += character;
    } else if (character === "<" && braceDepth === 0) {
      if (text) nodes.push(text);
      text = "";
      inTag = true;
    } else {
      text += character;
    }
  }
  if (text) nodes.push(text);
  return nodes;
}

for (const absolute of await sourceFiles(path.join(root, "src"))) {
  const relative = path.relative(root, absolute);
  const source = await readFile(absolute, "utf8");
  for (const match of source.matchAll(/\bm\.([A-Za-z0-9_]+)/g)) {
    if (match[1] in catalogs.en) usedMessages.add(match[1]);
  }
  if (!absolute.endsWith(".svelte")) continue;
  const markup = source
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/g, "")
    .replace(/<!--[\s\S]*?-->/g, "");
  for (const node of textNodes(markup)) {
    const text = withoutSvelteExpressions(node)
      .replace(/&[A-Za-z0-9#]+;/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (/[A-Za-z]/.test(text)) literals.push({ path: relative, text });
  }
  for (const line of markup.split("\n")) {
    for (const match of line.matchAll(/(?:aria-label|aria-description|placeholder|title)="([A-Za-z][^"]+)"/g)) {
      literals.push({ path: relative, text: match[1] });
    }
  }
}

for (const literal of literals) {
  const allowed = allowlist.sourceLiterals.some(
    (entry) => entry.path === literal.path && entry.text === literal.text && entry.reason,
  );
  if (!allowed) errors.push(`${literal.path}: hard-coded visible text: ${JSON.stringify(literal.text)}`);
}

for (const entry of allowlist.sourceLiterals) {
  if (!entry.path || !entry.text || !entry.reason) errors.push("invalid source literal allowlist entry");
}
const unusedAllowed = new Set(
  allowlist.unusedMessages.filter((entry) => entry.path && entry.reason).map((entry) => entry.key),
);
const unused = englishKeys.filter((key) => !usedMessages.has(key) && !unusedAllowed.has(key));
if (unused.length) errors.push(`unused English messages: ${unused.join(", ")}`);

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`i18n audit passed: ${englishKeys.length} messages across ${languages.length} locales`);
