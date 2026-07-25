import { BEZEMISI_BASE_URL } from "../../constants";
import {
  decodeHtmlEntities,
  parseAzKm,
  parseCzechPrice,
  parseOperatingCostRange,
  parsePriceFromText,
  slugify,
  stripTags,
} from "../parsers/czech";

export type ParsedCatalogueCard = {
  brandName: string;
  brandSlug: string;
  modelName: string;
  modelSlug: string;
  category: string | null;
  marketingDescription: string | null;
  startingPriceCzk: number | null;
  priceUnavailable: boolean;
  vatStatus: string | null;
  maxWltpRangeKm: number | null;
  operatingCostMinCzkPer100km: number | null;
  operatingCostMaxCzkPer100km: number | null;
  detailUrl: string | null;
  imageUrl: string | null;
};

function extractImageUrl(sectionHtml: string) {
  const srcsetMatch = sectionHtml.match(
    /data-srcset="([^"]+?)"/i,
  );
  if (srcsetMatch?.[1]) {
    const first = srcsetMatch[1].split(",")[0]?.trim().split(" ")[0];
    if (first) return first;
  }
  const srcMatch = sectionHtml.match(/data-src="([^"]+)"/i);
  if (srcMatch?.[1]) return srcMatch[1];
  return null;
}

function extractDetailUrl(sectionHtml: string) {
  const match = sectionHtml.match(
    /href="(https:\/\/www\.bezemisi\.cz\/elektromobily\/[^"/]+(?:\/[^"/]+)?)"/i,
  );
  return match?.[1] ?? null;
}

function splitCatalogueSections(html: string) {
  const sections: string[] = [];
  const pattern = /<h3[^>]*>([\s\S]*?)<\/h3>/gi;
  const matches = [...html.matchAll(pattern)];
  for (let i = 0; i < matches.length; i += 1) {
    const start = matches[i].index ?? 0;
    const end = matches[i + 1]?.index ?? html.length;
    sections.push(html.slice(start, end));
  }
  return sections;
}

function parseBrandAndModel(title: string) {
  const cleaned = stripTags(title).replace(/\s+/g, " ").trim();
  const parts = cleaned.split(" ");
  if (parts.length < 2) {
    return { brandName: cleaned, modelName: cleaned };
  }
  const brandName = parts[0];
  const modelName = cleaned;
  return { brandName, modelName };
}

export function parseCataloguePage(html: string): ParsedCatalogueCard[] {
  const cards: ParsedCatalogueCard[] = [];
  const sections = splitCatalogueSections(html);

  for (const section of sections) {
    const titleMatch = section.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i);
    if (!titleMatch?.[1]) continue;

    const title = stripTags(titleMatch[1]);
    if (!title || /nejnovější|značky|rodinu|města|podnikatele/i.test(title)) {
      continue;
    }

    const text = stripTags(section);
    const { brandName, modelName } = parseBrandAndModel(title);
    const brandSlug = slugify(brandName);
    const detailUrl = extractDetailUrl(section);
    const modelSlug =
      detailUrl?.split("/").pop() ?? slugify(modelName.replace(brandName, "").trim());

    const priceUnavailable = /cena\s+ještě\s+není\s+dostupná/i.test(text);
    const startingPriceCzk = priceUnavailable
      ? null
      : parsePriceFromText(text) ?? parseCzechPrice(text);
    const maxWltpRangeKm = parseAzKm(text);
    const operatingCost = parseOperatingCostRange(text);
    const vatStatus = /včetně\s+dph/i.test(text)
      ? "vcetne_dph"
      : /bez\s+dph/i.test(text)
        ? "bez_dph"
        : null;

    const descriptionMatch = text.match(
      new RegExp(`${modelName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s+(.{20,120})`),
    );

    cards.push({
      brandName,
      brandSlug,
      modelName,
      modelSlug,
      category: null,
      marketingDescription: descriptionMatch?.[1]?.trim() ?? null,
      startingPriceCzk,
      priceUnavailable,
      vatStatus,
      maxWltpRangeKm,
      operatingCostMinCzkPer100km: operatingCost.min,
      operatingCostMaxCzkPer100km: operatingCost.max,
      detailUrl,
      imageUrl: extractImageUrl(section),
    });
  }

  return cards;
}

export function discoverCatalogueUrls(html: string) {
  const urls = new Set<string>([`${BEZEMISI_BASE_URL}/elektromobily`]);
  const pattern =
    /href="(https:\/\/www\.bezemisi\.cz\/elektromobily\/[^"#?]+)"/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html)) !== null) {
    urls.add(match[1].replace(/\/$/, ""));
  }
  return [...urls];
}

export function parseBrandPageModels(html: string, brandSlug: string) {
  const cards = parseCataloguePage(html);
  return cards.filter((card) => card.brandSlug === brandSlug);
}
