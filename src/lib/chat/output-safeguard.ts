import "server-only";

const UUID_PATTERN =
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi;

const INTERNAL_SOURCE_TAG_PATTERN =
  /\[(?:zdroj|source)\s+[^\]]*\]/gi;
const EMPTY_BRACKET_PATTERN = /\[\s*\]/g;
const ORPHAN_SOURCE_TAG_PATTERN = /\[(?:zdroj|source)\s*\]/gi;

export function containsInternalIdentifier(text: string) {
  return new RegExp(UUID_PATTERN.source, "i").test(text);
}

export function stripInternalIdentifiers(text: string) {
  return text
    .replace(UUID_PATTERN, "")
    .replace(INTERNAL_SOURCE_TAG_PATTERN, "")
    .replace(ORPHAN_SOURCE_TAG_PATTERN, "")
    .replace(EMPTY_BRACKET_PATTERN, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();
}

/**
 * Sanitize only after all streamed fragments have been joined. Sanitizing each
 * fragment separately is unsafe: UUIDs can span fragment boundaries and
 * trimming fragments removes legitimate spaces between words.
 */
export function sanitizeStreamedTextFragments(fragments: string[]) {
  return stripInternalIdentifiers(fragments.join(""));
}
