const unrelatedPatterns = [
  /(počasí|fotbal|hokej|mistrovství světa|politika|recept|vaření|kryptoměn|bitcoin|zábava|vtip)/i,
  /\b(napiš|vytvoř|přelož)\b.{0,40}\b(báseň|esej|program|kód|skript)\b/i,
  /\b(system prompt|systémov[ýé] (prompt|instrukce)|interní instrukce|tajný klíč|heslo|credential|api[_ ]?key)\b/i,
  /\b(ignoruj|ignore)\b.{0,40}\b(instrukce|instructions|pravidla|rules)\b/i,
  /\b(nabíjení|baterie)\b.{0,20}\b(telefonu|mobilu|notebooku)\b/i,
  /\b(lékař|diagnóza|recept na lék|právní rad[au])\b/i,
];

export function isClearlyOutOfScope(text: string) {
  return unrelatedPatterns.some((pattern) => pattern.test(text));
}
