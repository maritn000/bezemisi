import { parseCzechInteger, parseCzechPrice, parseRangeKm, stripTags } from "../parsers/czech";

export type ParsedStockOffer = {
  externalOfferId: string;
  title: string;
  brandName: string | null;
  modelName: string | null;
  variantLabel: string | null;
  condition: "new" | "used" | "demonstration" | "unknown";
  modelYear: number | null;
  registrationYear: number | null;
  mileageKm: number | null;
  colour: string | null;
  vin: string | null;
  listPrice: number | null;
  currentPrice: number | null;
  vatStatus: string | null;
  batteryKwh: number | null;
  wltpRangeKm: number | null;
  powerKw: number | null;
  consumptionKwhPer100km: number | null;
  availabilityText: string | null;
  location: string | null;
  equipment: string[];
  imageUrls: string[];
  offerUrl: string;
};

function parseTableRows(html: string) {
  const rows = new Map<string, string>();
  const pattern = /<th[^>]*>([\s\S]*?)<\/th>\s*<td[^>]*>([\s\S]*?)<\/td>/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html)) !== null) {
    const key = stripTags(match[1]).toLowerCase();
    const value = stripTags(match[2]);
    if (key) rows.set(key, value);
  }
  return rows;
}

function extractStockListUrls(html: string, baseUrl: string) {
  const urls = new Set<string>();
  const pattern = /href="(\/nabidka-vozu\/[^"#?]+\.html)"/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html)) !== null) {
    urls.add(new URL(match[1], baseUrl).toString());
  }
  return [...urls];
}

function extractPaginationUrls(html: string, baseUrl: string) {
  const urls = new Set<string>();
  const pattern = /href="(\/nabidka-vozu\/\d+\/)"/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html)) !== null) {
    urls.add(new URL(match[1], baseUrl).toString());
  }
  return [...urls];
}

export function discoverStockUrls(html: string, baseUrl = "https://auto.bezemisi.cz") {
  return [
    ...new Set([
      ...extractStockListUrls(html, baseUrl),
      ...extractPaginationUrls(html, baseUrl),
      new URL("/nabidka-vozu/", baseUrl).toString(),
    ]),
  ];
}

export function parseStockDetailPage(
  html: string,
  offerUrl: string,
): ParsedStockOffer | null {
  const titleMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const title = titleMatch ? stripTags(titleMatch[1]) : "";
  if (!title) return null;

  const rows = parseTableRows(html);
  const text = stripTags(html);
  const slug = offerUrl.split("/").pop()?.replace(".html", "") ?? offerUrl;

  const listPrice =
    parseCzechPrice(rows.get("ceníková cena") ?? "") ??
    (() => {
      const match = text.match(/ceníková\s+cena[^0-9]*([\d\s]+)/i);
      return match ? parseCzechInteger(match[1]) : null;
    })();

  const currentPrice =
    parseCzechPrice(rows.get("prodejní cena") ?? "") ??
    (() => {
      const match = text.match(/prodejní\s+cena[^0-9]*([\d\s]+)/i);
      return match ? parseCzechInteger(match[1]) : null;
    })();

  const condition = /ojet/i.test(slug)
    ? "used"
    : /predvadeci|předváděcí/i.test(slug)
      ? "demonstration"
      : "new";

  const imageUrls = [
    ...html.matchAll(/src="(https:\/\/auto\.bezemisi\.cz\/[^"]+\.(?:jpg|jpeg|png|webp))"/gi),
  ].map((match) => match[1]);

  const titleParts = title.split(" ").filter(Boolean);
  const brandName = titleParts[0] ?? null;

  return {
    externalOfferId: `auto:${slug}`,
    title,
    brandName,
    modelName: title,
    variantLabel: rows.get("verze") ?? rows.get("motorizace") ?? null,
    condition,
    modelYear: parseCzechInteger(rows.get("rok výroby") ?? ""),
    registrationYear: parseCzechInteger(rows.get("rok registrace") ?? ""),
    mileageKm: parseCzechInteger(rows.get("najeto") ?? rows.get("nájezd") ?? ""),
    colour: rows.get("barva") ?? null,
    vin: rows.get("vin") ?? null,
    listPrice,
    currentPrice,
    vatStatus: /bez\s+dph/i.test(text) ? "bez_dph" : "vcetne_dph",
    batteryKwh: (() => {
      const raw = rows.get("baterie") ?? rows.get("kapacita baterie") ?? "";
      const match = raw.match(/(\d+)/);
      return match ? Number(match[1]) : null;
    })(),
    wltpRangeKm: parseRangeKm(rows.get("dojezd dle wltp") ?? ""),
    powerKw: (() => {
      const raw = rows.get("výkon") ?? "";
      const match = raw.match(/(\d+)/);
      return match ? Number(match[1]) : null;
    })(),
    consumptionKwhPer100km: (() => {
      const raw = rows.get("spotřeba") ?? "";
      const match = raw.match(/([\d,.]+)/);
      return match ? Number(match[1].replace(",", ".")) : null;
    })(),
    availabilityText: /skladem|ihned|rezervováno|prodáno/i.test(text)
      ? text.match(/skladem|ihned|rezervováno|prodáno/i)?.[0] ?? null
      : null,
    location: rows.get("lokalita") ?? rows.get("pobočka") ?? null,
    equipment: [],
    imageUrls: [...new Set(imageUrls)],
    offerUrl,
  };
}
