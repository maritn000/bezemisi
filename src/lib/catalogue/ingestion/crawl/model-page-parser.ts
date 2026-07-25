import {
  parseAzKm,
  parseCzechInteger,
  parseCzechPrice,
  parseOperatingCostRange,
  parsePriceFromText,
  parseRangeKm,
  stripTags,
} from "../parsers/czech";

export type ParsedModelFact = {
  fieldKey: string;
  value: number | string | boolean;
  unit?: string;
  scope: "model" | "variant";
  variantLabel?: string;
  notes?: string;
};

export type ParsedModelVariant = {
  label: string;
  slug: string;
  trimName?: string;
  batteryVariant?: string;
  drivetrain?: string;
  startingPriceCzk?: number | null;
  maxWltpRangeKm?: number | null;
  powerKw?: number | null;
  facts: ParsedModelFact[];
};

export type ParsedModelPage = {
  title: string;
  description: string | null;
  heroImageUrl: string | null;
  modelFacts: ParsedModelFact[];
  variants: ParsedModelVariant[];
  imageUrls: string[];
  linkedOfferUrls: string[];
};

function extractImages(html: string) {
  const urls = new Set<string>();
  const patterns = [
    /data-srcset="([^"]+)"/gi,
    /data-src="(https:\/\/www\.bezemisi\.cz\/[^"]+)"/gi,
    /src="(https:\/\/www\.bezemisi\.cz\/files\/[^"]+)"/gi,
  ];
  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(html)) !== null) {
      const raw = match[1];
      if (!raw) continue;
      const first = raw.includes(",")
        ? raw.split(",")[0]?.trim().split(" ")[0]
        : raw;
      if (first && !first.endsWith(".svg")) {
        urls.add(first);
      }
    }
  }
  return [...urls];
}

function extractLabeledNumber(text: string, label: RegExp) {
  const match = text.match(label);
  if (!match?.[1]) return null;
  return parseCzechInteger(match[1]);
}

function parseTechnicalBlock(text: string): ParsedModelFact[] {
  const facts: ParsedModelFact[] = [];

  const powerKw = extractLabeledNumber(
    text,
    /maximální\s+výkon[^:]*:\s*až\s*(\d[\d,.]*)\s*kW/i,
  );
  if (powerKw !== null) {
    facts.push({
      fieldKey: "power_kw",
      value: powerKw,
      unit: "kW",
      scope: "model",
      notes: "Model-level maximum published on Bez emisí",
    });
  }

  const torque = extractLabeledNumber(text, /točivý\s+moment[^:]*:\s*(\d+)/i);
  if (torque !== null) {
    facts.push({
      fieldKey: "torque_nm",
      value: torque,
      unit: "Nm",
      scope: "model",
    });
  }

  const topSpeed = extractLabeledNumber(
    text,
    /maximální\s+rychlost[^:]*:\s*(\d+)/i,
  );
  if (topSpeed !== null) {
    facts.push({
      fieldKey: "top_speed_kmh",
      value: topSpeed,
      unit: "km/h",
      scope: "model",
    });
  }

  const length = extractLabeledNumber(text, /délka:\s*(\d+)/i);
  if (length !== null) {
    facts.push({ fieldKey: "length_mm", value: length, unit: "mm", scope: "model" });
  }
  const width = extractLabeledNumber(text, /šířka:\s*(\d+)/i);
  if (width !== null) {
    facts.push({ fieldKey: "width_mm", value: width, unit: "mm", scope: "model" });
  }
  const height = extractLabeledNumber(text, /výška:\s*(\d+)/i);
  if (height !== null) {
    facts.push({ fieldKey: "height_mm", value: height, unit: "mm", scope: "model" });
  }

  const boot = extractLabeledNumber(text, /velikost\s+kufru[^0-9]*(\d+)\s*l/i);
  if (boot !== null) {
    facts.push({
      fieldKey: "boot_capacity_l",
      value: boot,
      unit: "l",
      scope: "model",
    });
  }

  const chargeTime = extractLabeledNumber(
    text,
    /(\d+)\s*minut/i,
  );
  if (chargeTime !== null && /10.*80|nabij/i.test(text)) {
    facts.push({
      fieldKey: "dc_charge_10_80_minutes",
      value: chargeTime,
      unit: "min",
      scope: "model",
    });
  }

  const batteryMatch = text.match(/kapacita\s+baterie[^:]*:\s*([^.\n]+)/i);
  if (batteryMatch?.[1]) {
    const batteries = batteryMatch[1].match(/(\d+)\s*kWh/gi);
    if (batteries?.length === 1) {
      const value = parseCzechInteger(batteries[0]);
      if (value !== null) {
        facts.push({
          fieldKey: "battery_capacity_usable_kwh",
          value,
          unit: "kWh",
          scope: "model",
        });
      }
    }
  }

  const range42 = text.match(/verze\s+42\s*kWh[^0-9]*až\s*(\d+)\s*km/i);
  if (range42?.[1]) {
    facts.push({
      fieldKey: "wltp_range_km",
      value: Number(range42[1]),
      unit: "km",
      scope: "variant",
      variantLabel: "42 kWh",
      notes: "WLTP kombinovaný cyklus",
    });
  }
  const range49 = text.match(/verze\s+49\s*kWh[^0-9]*až\s*(\d+)\s*km/i);
  if (range49?.[1]) {
    facts.push({
      fieldKey: "wltp_range_km",
      value: Number(range49[1]),
      unit: "km",
      scope: "variant",
      variantLabel: "49 kWh",
      notes: "WLTP kombinovaný cyklus",
    });
  }

  const modelMaxRange = parseAzKm(text);
  if (modelMaxRange !== null) {
    facts.push({
      fieldKey: "published_model_max_wltp_range_km",
      value: modelMaxRange,
      unit: "km",
      scope: "model",
      notes: "Marketing maximum (až)",
    });
  }

  if (/tepelné\s+čerpadlo/i.test(text)) {
    facts.push({
      fieldKey: "heat_pump_standard",
      value: true,
      scope: "model",
    });
  }
  if (/\bV2L\b/i.test(text)) {
    facts.push({
      fieldKey: "vehicle_to_load",
      value: true,
      scope: "model",
    });
  }

  const warrantyVehicle = text.match(/(\d+)\s*let\s+záruka/i);
  if (warrantyVehicle?.[1]) {
    facts.push({
      fieldKey: "warranty_vehicle_years",
      value: Number(warrantyVehicle[1]),
      unit: "years",
      scope: "model",
    });
  }

  return facts;
}

function parseVariantColumns(html: string): ParsedModelVariant[] {
  const variants: ParsedModelVariant[] = [];
  const columns = html.split(/class="col col-\d+-\d+ grid-\d+-\d+"/i);

  for (const column of columns) {
    const text = stripTags(column);
    if (!/cena\s+od/i.test(text) && !/dojezd\s+až/i.test(text)) {
      continue;
    }

    const titleMatch = column.match(/<h[34][^>]*>([\s\S]*?)<\/h[34]>/i);
    const label = titleMatch ? stripTags(titleMatch[1]) : "Varianta";
    if (/design|výbava|technické|možnosti/i.test(label)) continue;

    const price = parsePriceFromText(text);
    const range = parseAzKm(text) ?? parseRangeKm(text);
    const powerMatch = text.match(/výkon\s*(\d+)\s*kW/i);
    const operatingCost = parseOperatingCostRange(text);

    const facts: ParsedModelFact[] = [];
    if (range !== null) {
      facts.push({
        fieldKey: "wltp_range_km",
        value: range,
        unit: "km",
        scope: "variant",
        variantLabel: label,
      });
    }
    if (powerMatch?.[1]) {
      facts.push({
        fieldKey: "power_kw",
        value: Number(powerMatch[1]),
        unit: "kW",
        scope: "variant",
        variantLabel: label,
      });
    }
    if (operatingCost.min !== null) {
      facts.push({
        fieldKey: "published_operating_cost_min_czk_per_100km",
        value: operatingCost.min,
        unit: "CZK/100km",
        scope: "variant",
        variantLabel: label,
      });
    }
    if (operatingCost.max !== null) {
      facts.push({
        fieldKey: "published_operating_cost_max_czk_per_100km",
        value: operatingCost.max,
        unit: "CZK/100km",
        scope: "variant",
        variantLabel: label,
      });
    }

    variants.push({
      label,
      slug: label
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, ""),
      trimName: label,
      startingPriceCzk: price,
      maxWltpRangeKm: range,
      powerKw: powerMatch ? Number(powerMatch[1]) : null,
      facts,
    });
  }

  return variants;
}

export function parseModelDetailPage(html: string, pageUrl: string): ParsedModelPage {
  const titleMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const title = titleMatch ? stripTags(titleMatch[1]) : "Model";
  const text = stripTags(html);

  const descriptionMatch = html.match(
    /<h3[^>]*>[^<]*<\/h3>\s*<p>([\s\S]*?)<\/p>/i,
  );
  const description = descriptionMatch ? stripTags(descriptionMatch[1]) : null;

  const heroImageUrl =
    html.match(/eauto-header-[^"]+\.png/i)?.[0] != null
      ? extractImages(html).find((url) => /header|hero/i.test(url)) ?? extractImages(html)[0]
      : extractImages(html)[0] ?? null;

  const modelFacts = parseTechnicalBlock(text);
  const listPrice = parsePriceFromText(text);
  if (listPrice !== null) {
    modelFacts.push({
      fieldKey: "published_starting_price_czk",
      value: listPrice,
      unit: "CZK",
      scope: "model",
    });
  } else if (/cena\s+ještě\s+není\s+dostupná/i.test(text)) {
    modelFacts.push({
      fieldKey: "published_price_unavailable",
      value: true,
      scope: "model",
    });
  }

  const variants = parseVariantColumns(html);
  const linkedOfferUrls = [
    ...html.matchAll(/href="(https:\/\/www\.bezemisi\.cz\/[^"]+)"/gi),
  ]
    .map((match) => match[1])
    .filter(
      (url) =>
        /akcni-nabidky|operativni-leasing|auto\.bezemisi\.cz/i.test(url) &&
        url !== pageUrl,
    );

  return {
    title,
    description,
    heroImageUrl: heroImageUrl ?? null,
    modelFacts,
    variants,
    imageUrls: extractImages(html),
    linkedOfferUrls: [...new Set(linkedOfferUrls)],
  };
}

export function parseJsonLd(html: string) {
  const blocks: Record<string, unknown>[] = [];
  const pattern =
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(match[1]) as Record<string, unknown>;
      blocks.push(parsed);
    } catch {
      // ignore invalid JSON-LD
    }
  }
  return blocks;
}
