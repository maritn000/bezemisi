import "server-only";

import { queryIntentSchema, type QueryIntent } from "./types";

function normalize(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function extractNumber(text: string, pattern: RegExp) {
  const match = text.match(pattern);
  return match ? Number(match[1].replace(/\s/g, "")) : undefined;
}

function extractModels(text: string) {
  const models: string[] = [];
  const patterns = [
    /\b(kia\s+ev\d+)\b/i,
    /\b(volvo\s+ex\d+)\b/i,
    /\b(hyundai\s+inster)\b/i,
    /\b(hyundai\s+ioniq\s*\d*)\b/i,
    /\b(hyundai\s+kona)\b/i,
    /\b(bmw\s+ix\d+)\b/i,
    /\b(škoda\s+\w+)\b/i,
    /\b(skoda\s+\w+)\b/i,
    /\b(opel\s+\w+)\b/i,
    /\b(peugeot\s+e-\d+)\b/i,
    /\b(renault\s+\d+)\b/i,
    /\b(ford\s+\w+)\b/i,
    /\b(cupra\s+\w+)\b/i,
    /\b(volkswagen\s+id\.?\s*\w+)\b/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) models.push(match[1]);
  }

  return [...new Set(models)];
}

export function understandQuery(query: string): QueryIntent {
  if (
    /(fotbal|počasí|recept|programování|bitcoin|politika|systémový prompt|ignore instructions)/i.test(
      query,
    )
  ) {
    return queryIntentSchema.parse({ intent: "out_of_scope" });
  }

  if (
    /(jak probíhá nákup|nákup přes bez emisí|nákupní proces|jak koupit|postup nákupu)/i.test(
      query,
    )
  ) {
    return queryIntentSchema.parse({
      intent: "commercial_question",
      conditionTypes: ["purchase_process"],
    });
  }

  if (
    /(financování|operativní leasing|záloha|rezervace|dodání|záruka|výkup)/i.test(
      query,
    )
  ) {
    const conditionTypes = [];
    if (/financ/i.test(query)) conditionTypes.push("financing");
    if (/leasing/i.test(query)) conditionTypes.push("operating_lease");
    if (/záloh|rezervac/i.test(query)) {
      conditionTypes.push("deposit", "reservation");
    }
    if (/dodán/i.test(query)) conditionTypes.push("delivery");
    if (/záruk/i.test(query)) conditionTypes.push("warranty");
    if (/výkup|trade/i.test(query)) conditionTypes.push("trade_in");

    return queryIntentSchema.parse({
      intent: "commercial_question",
      conditionTypes:
        conditionTypes.length > 0 ? conditionTypes : ["purchase_process"],
    });
  }

  if (/(skladem|dostupnost|k dispozici|nyní skladem)/i.test(query)) {
    return queryIntentSchema.parse({
      intent: "offer_search",
      availability: "available",
    });
  }

  if (/(kolik stojí|cena|stojí|za kolik)/i.test(query)) {
    const models = extractModels(query);
    const brandModel = models[0]?.split(/\s+/) ?? [];
    return queryIntentSchema.parse({
      intent: "offer_search",
      brand: brandModel[0] ? normalize(brandModel[0]) : undefined,
      model: brandModel.slice(1).join("-").toLowerCase().replace(/\s+/g, "-"),
      maximumPrice: extractNumber(query, /do\s+(\d[\d\s]*)\s*(tis|kč|kc)/i),
    });
  }

  if (/(porovnej|porovnání|srovnej|vs\.?|versus)/i.test(query)) {
    const models = extractModels(query);
    if (models.length < 2) {
      return queryIntentSchema.parse({
        intent: "clarification_needed",
        needsClarification: true,
        clarificationReason:
          "Pro srovnání potřebuji alespoň dva konkrétní modely.",
      });
    }

    return queryIntentSchema.parse({
      intent: "vehicle_comparison",
      models,
    });
  }

  const minimumWltpRange = extractNumber(
    query,
    /dojezd.{0,20}(?:alespoň|minimálně|aspoň|>=?)\s*(\d{2,4})/i,
  );
  const minimumBootCapacity = extractNumber(
    query,
    /(kufr|zavazadlový prostor).{0,20}(\d{2,4})\s*l/i,
  );
  const minimumSeats = extractNumber(query, /(\d)\s*(míst|sedadel|dět)/i);

  if (
    minimumWltpRange ||
    /(nejrychleji nabíj|rychlé nabíjení|dc nabíjení)/i.test(query)
  ) {
    return queryIntentSchema.parse({
      intent: "vehicle_search",
      minimumWltpRange,
      requiredFeature: /nejrychleji nabíj/i.test(query)
        ? "max_dc_charging_kw"
        : undefined,
    });
  }

  if (
    /(vhodný|vhodné|doporuč|rodin|dvěma dětmi|dvě děti)/i.test(query)
  ) {
    const hasEnoughContext =
      Boolean(minimumBootCapacity) ||
      Boolean(minimumSeats) ||
      Boolean(minimumWltpRange) ||
      /(rodin|dvěma dětmi|dvě děti|4\s*míst)/i.test(query);

    if (!hasEnoughContext) {
      return queryIntentSchema.parse({
        intent: "clarification_needed",
        needsClarification: true,
        clarificationReason:
          "Pro doporučení potřebuji znát rozpočet, počet cestujících, typické trasy a případně potřebu delších cest.",
      });
    }

    return queryIntentSchema.parse({
      intent: "vehicle_search",
      minimumSeats: minimumSeats ?? (/dvěma dětmi|rodin/i.test(query) ? 4 : undefined),
      minimumBootCapacity,
    });
  }

  const models = extractModels(query);
  if (models.length === 1) {
    const parts = models[0]!.split(/\s+/);
    return queryIntentSchema.parse({
      intent: "vehicle_detail",
      brand: parts[0] ? normalize(parts[0]) : undefined,
      model: parts.slice(1).join("-").toLowerCase(),
    });
  }

  if (/(elektromobil|auto|vůz|model)/i.test(query)) {
    return queryIntentSchema.parse({
      intent: "vehicle_search",
      minimumWltpRange,
      minimumBootCapacity,
      minimumSeats,
    });
  }

  return queryIntentSchema.parse({
    intent: "clarification_needed",
    needsClarification: true,
    clarificationReason:
      "Upřesněte prosím, zda hledáte konkrétní model, srovnání, cenu nebo obchodní podmínky.",
  });
}
