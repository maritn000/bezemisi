import "server-only";

import { countCatalogueStats } from "./repositories/catalogue-repository";

export type ValidationIssue = {
  severity: "error" | "warning";
  code: string;
  message: string;
};

export async function validateCatalogue(): Promise<{
  valid: boolean;
  issues: ValidationIssue[];
  stats: Awaited<ReturnType<typeof countCatalogueStats>>;
}> {
  const stats = await countCatalogueStats();
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

  return {
    valid: !issues.some((issue) => issue.severity === "error"),
    issues,
    stats,
  };
}
