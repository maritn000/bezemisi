const unrelatedPatterns = [
  /\b(počasí|fotbal|hokej|politika|recept|vaření|kryptoměn|bitcoin)\b/i,
  /\b(napiš|vytvoř|přelož)\b.{0,30}\b(báseň|esej|program|kód)\b/i,
  /\b(system prompt|systémov[ée] instrukce|tajný klíč|heslo|credential)\b/i,
  /\b(nabíjení|baterie)\b.{0,20}\b(telefonu|mobilu|notebooku)\b/i,
];

export function isClearlyOutOfScope(text: string) {
  return unrelatedPatterns.some((pattern) => pattern.test(text));
}
