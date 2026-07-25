import "server-only";

import { countCatalogueStats } from "./repositories/catalogue-repository";
import { collectRangeMetrics } from "./range-metrics";

export type ValidationIssue = {
  severity: "error" | "warning";
  code: string;
  message: string;
};

export async function validateCatalogue(): Promise<{
  valid: boolean;
  issues: ValidationIssue[];
  stats: Awaited<ReturnType<typeof countCatalogueStats>>;
  rangeMetrics: Awaited<ReturnType<typeof collectRangeMetrics>>;
}> {
  const [stats, rangeMetrics] = await Promise.all([
    countCatalogueStats(),
    collectRangeMetrics(),
  ]);
  const issues: ValidationIssue[] = [];

  if (stats.models < 20) {
    issues.push({
      severity: "warning",
      code: "low_model_count",
      message: `Očekáváno alespoň 20 modelů, nalezeno ${stats.models}.`,
    });
  }

  if (stats.variants < 5) {
    issues.push({
      severity: "error",
      code: "low_variant_count",
      message: `Nalezeno pouze ${stats.variants} variant.`,
    });
  }

  if (stats.verifiedFacts < 10) {
    issues.push({
      severity: "error",
      code: "low_verified_fact_count",
      message: `Nalezeno pouze ${stats.verifiedFacts} ověřených faktů.`,
    });
  }

  if (stats.commercialConditions < 1) {
    issues.push({
      severity: "error",
      code: "missing_commercial_conditions",
      message: "Chybí ověřené obchodní podmínky.",
    });
  }

  if (rangeMetrics.verifiedWltpFacts < 1) {
    issues.push({
      severity: "error",
      code: "missing_verified_wltp_facts",
      message: "Chybí ověřené WLTP dojezdy u variant v katalogu.",
    });
  }

  if (rangeMetrics.conflictingRangeFacts.length > 0) {
    issues.push({
      severity: "warning",
      code: "conflicting_range_facts",
      message: `Nalezeno ${rangeMetrics.conflictingRangeFacts.length} konfliktních dojezdových faktů.`,
    });
  }

  return {
    valid: !issues.some((issue) => issue.severity === "error"),
    issues,
    stats,
    rangeMetrics,
  };
}
