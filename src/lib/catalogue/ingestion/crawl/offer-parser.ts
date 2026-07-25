import { parseAzKm, parseCzechInteger, parseCzechPrice, parsePriceFromText, stripTags } from "../parsers/czech";

export type ParsedActionOffer = {
  title: string;
  modelLabel: string | null;
  trimLabel: string | null;
  listPrice: number | null;
  actionPrice: number | null;
  wltpRangeKm: number | null;
  powerKw: number | null;
  equipment: string[];
  availabilityText: string | null;
  soldOut: boolean;
  sourceUrl: string;
  imageUrl: string | null;
};

export function discoverActionOfferUrls(html: string, baseUrl = "https://www.bezemisi.cz") {
  const urls = new Set<string>([`${baseUrl}/akcni-nabidky`]);
  const pattern = /href="(https:\/\/www\.bezemisi\.cz\/[^"#?]+)"/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html)) !== null) {
    if (/akcni-nabidky|akcni-nabidka|stock|sklad/i.test(match[1])) {
      urls.add(match[1].replace(/\/$/, ""));
    }
  }
  return [...urls];
}

export function parseActionOfferPage(html: string, sourceUrl: string): ParsedActionOffer | null {
  const titleMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const title = titleMatch ? stripTags(titleMatch[1]) : "";
  if (!title) return null;

  const text = stripTags(html);
  const listPrice = (() => {
    const match = text.match(/ceníková\s+cena[^0-9]*([\d\s]+)/i);
    return match ? parseCzechInteger(match[1]) : null;
  })();
  const actionPrice =
    parsePriceFromText(text) ??
    (() => {
      const match = text.match(/akční\s+cena[^0-9]*([\d\s]+)/i);
      return match ? parseCzechInteger(match[1]) : null;
    })() ??
    parseCzechPrice(text);

  const imageMatch = html.match(/data-src="(https:\/\/www\.bezemisi\.cz\/[^"]+)"/i);

  return {
    title,
    modelLabel: title,
    trimLabel: null,
    listPrice,
    actionPrice,
    wltpRangeKm: parseAzKm(text),
    powerKw: (() => {
      const match = text.match(/(\d+)\s*kW/i);
      return match ? Number(match[1]) : null;
    })(),
    equipment: [],
    availabilityText: text.match(/skladem|poslední|vyprodáno|ihned/i)?.[0] ?? null,
    soldOut: /vyprodáno|sold\s*out/i.test(text),
    sourceUrl,
    imageUrl: imageMatch?.[1] ?? null,
  };
}
