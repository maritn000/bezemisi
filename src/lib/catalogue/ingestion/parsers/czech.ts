export function parseCzechInteger(text: string): number | null {
  const normalized = text.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
  const match = normalized.match(/(\d[\d\s]*)/);
  if (!match?.[1]) return null;
  const value = Number(match[1].replace(/\s/g, ""));
  return Number.isFinite(value) ? value : null;
}

export function parseCzechPrice(text: string): number | null {
  if (/nen[ií]\s+dostupn/i.test(text) || /neuveden/i.test(text)) {
    return null;
  }
  return parseCzechInteger(text);
}

export function parseAzKm(text: string): number | null {
  const match = text.match(/až\s*(\d[\d\s]*)\s*km/i);
  if (!match?.[1]) return null;
  return parseCzechInteger(match[1]);
}

export function parseRangeKm(text: string): number | null {
  const az = parseAzKm(text);
  if (az !== null) return az;
  const match = text.match(/(\d[\d\s]*)\s*km/i);
  if (!match?.[1]) return null;
  return parseCzechInteger(match[1]);
}

export function parseOperatingCostRange(text: string): {
  min: number | null;
  max: number | null;
} {
  const match = text.match(
    /(\d[\d\s]*)[\s–-]+(\d[\d\s]*)\s*Kč\s*na\s*100\s*km/i,
  );
  if (!match) {
    const single = text.match(/(\d[\d\s]*)\s*Kč\s*na\s*100\s*km/i);
    if (!single?.[1]) return { min: null, max: null };
    const value = parseCzechInteger(single[1]);
    return { min: value, max: value };
  }
  return {
    min: parseCzechInteger(match[1]),
    max: parseCzechInteger(match[2]),
  };
}

export function parsePriceFromText(text: string): number | null {
  const match = text.match(/cena\s+od\s*([\d\s]+)\s*Kč/i);
  if (!match?.[1]) return parseCzechPrice(text);
  return parseCzechInteger(match[1]);
}

export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function decodeHtmlEntities(text: string) {
  return text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&([a-z]+);/gi, " ");
}

export function stripTags(html: string) {
  return decodeHtmlEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<\/li>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}
