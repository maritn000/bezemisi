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

function extractMaximumPrice(text: string) {
  const direct = extractNumber(
    text,
    /(?:méně než|pod|do)\s+(\d[\d\s]*)\s*(?:tis|kč|kc)/i,
  );
  if (direct) return direct;

  const stoji = extractNumber(
    text,
    /stojí.{0,20}(?:méně než|pod|do)\s+(\d[\d\s]*)\s*(?:tis|kč|kc)/i,
  );
  if (stoji) return stoji;

  return extractNumber(text, /do\s+(\d[\d\s]*)\s*(tis|kč|kc)/i);
}

function extractModels(text: string) {
  const models: string[] = [];
  const patterns = [
    /\b(kia\s+ev\d+)\b/i,
    /\b(volvo\s+ex\d+)\b/i,
    /\b(hyundai\s+inster)\b/i,
    /\b(hyundai\s+ioniq\s*\d*)\b/i,
    /\b(hyundai\s+kona(?:\s+electric)?)\b/i,
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

  const maximumPrice = extractMaximumPrice(query);
  if (
    maximumPrice &&
    /(která auta|které auta|které vozy|která vozidla)/i.test(query)
  ) {
    return queryIntentSchema.parse({
      intent: "vehicle_search",
      maximumPrice,
    });
  }

  if (/(kolik stojí|cena|stojí|za kolik)/i.test(query)) {
    const models = extractModels(query);
    const brandModel = models[0]?.split(/\s+/) ?? [];
    return queryIntentSchema.parse({
      intent: "offer_search",
      brand: brandModel[0] ? normalize(brandModel[0]) : undefined,
      model: brandModel.slice(1).join("-").toLowerCase().replace(/\s+/g, "-"),
      maximumPrice: extractMaximumPrice(query),
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

  if (/(jaký|jaky).{0,20}dojezd|dojezd.{0,20}(má|ma)/i.test(query)) {
    const detailModels = extractModels(query);
    if (detailModels.length === 1) {
      const parts = detailModels[0]!.split(/\s+/);
      return queryIntentSchema.parse({
        intent: "vehicle_detail",
        brand: parts[0] ? normalize(parts[0]) : undefined,
        model: parts.slice(1).join("-").toLowerCase(),
      });
    }
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

type UserMessage = {
  role: "user" | "assistant";
  parts: Array<{ text?: string }>;
};

function getUserMessageTexts(messages: UserMessage[]) {
  return messages
    .filter((message) => message.role === "user")
    .map((message) =>
      message.parts
        .map((part) => part.text ?? "")
        .join("\n")
        .trim(),
    )
    .filter(Boolean);
}

function isReferentialFollowUp(query: string) {
  return /(z nich|z těch|u těch|z výše|z předchozí|z toho seznamu|které z nich|která z nich|těchto|těchle)/i.test(
    query,
  );
}

function isPriceFollowUp(query: string) {
  const normalized = query.trim();
  return (
    /^(kolik stojí|a kolik stojí|jaká je cena|a cena|za kolik)\??$/i.test(
      normalized,
    ) ||
    (isReferentialFollowUp(normalized) &&
      /(kolik stojí|cena|stojí|za kolik)/i.test(normalized))
  );
}

function findPriorVehicleSearchIntent(userTexts: string[]) {
  const priorIntents = userTexts.map((text) => understandQuery(text));
  return [...priorIntents]
    .reverse()
    .find(
      (candidate) =>
        candidate.intent === "vehicle_search" &&
        (typeof candidate.minimumWltpRange === "number" ||
          typeof candidate.maximumPrice === "number" ||
          typeof candidate.minimumBootCapacity === "number" ||
          typeof candidate.minimumSeats === "number" ||
          Boolean(candidate.brand) ||
          Boolean(candidate.model)),
    );
}

export function understandQueryFromMessages(messages: UserMessage[]) {
  const userTexts = getUserMessageTexts(messages);
  const latest = userTexts.at(-1) ?? "";
  const previous = userTexts.slice(0, -1);

  const intent = understandQuery(latest);

  if (previous.length === 0) {
    return intent;
  }

  if (isPriceFollowUp(latest)) {
    const priorSearch = findPriorVehicleSearchIntent(previous);
    if (priorSearch) {
      return queryIntentSchema.parse({
        intent: "offer_search",
        priorSearch: {
          intent: "vehicle_search",
          brand: priorSearch.brand,
          model: priorSearch.model,
          minimumWltpRange: priorSearch.minimumWltpRange,
          minimumRealRange: priorSearch.minimumRealRange,
          minimumBootCapacity: priorSearch.minimumBootCapacity,
          minimumSeats: priorSearch.minimumSeats,
          maximumPrice: priorSearch.maximumPrice,
          drivetrain: priorSearch.drivetrain,
          availability: priorSearch.availability,
          requiredFeature: priorSearch.requiredFeature,
          sortByField: priorSearch.sortByField,
        },
      });
    }
  }

  if (!isReferentialFollowUp(latest)) {
    return intent;
  }

  const priorRangeSearch = findPriorVehicleSearchIntent(previous);
  if (!priorRangeSearch?.minimumWltpRange) {
    return intent;
  }

  if (/(největší|nejvetsi|největší|nejvetsi).{0,20}kufr/i.test(latest)) {
    return queryIntentSchema.parse({
      intent: "vehicle_search",
      minimumWltpRange: priorRangeSearch.minimumWltpRange,
      sortByField: "boot_capacity_l",
    });
  }

  if (intent.intent === "clarification_needed") {
    return queryIntentSchema.parse({
      intent: "vehicle_search",
      minimumWltpRange: priorRangeSearch.minimumWltpRange,
    });
  }

  return intent;
}
