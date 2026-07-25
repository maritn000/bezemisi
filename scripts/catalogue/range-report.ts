import { config } from "dotenv";

import { collectRangeMetrics } from "../../src/lib/catalogue/range-metrics";

config({ path: ".env.local" });

async function main() {
  const metrics = await collectRangeMetrics();

  console.log(
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        counts: {
          verifiedWltpFacts: metrics.verifiedWltpFacts,
          verifiedRealRangeFacts: metrics.verifiedRealRangeFacts,
          variantsMissingWltp: metrics.variantsMissingWltp.length,
          ambiguousRangeFacts: metrics.ambiguousRangeFacts.length,
          conflictingRangeFacts: metrics.conflictingRangeFacts.length,
        },
        variantsMissingWltp: metrics.variantsMissingWltp,
        ambiguousRangeFacts: metrics.ambiguousRangeFacts,
        conflictingRangeFacts: metrics.conflictingRangeFacts,
        facts: metrics.facts.map((fact) => ({
          brand: fact.brand,
          model: fact.model,
          variant: fact.variant,
          fieldKey: fact.canonicalFieldKey ?? fact.fieldKey,
          value: fact.numericValue,
          unit: fact.unit,
          verificationStatus: fact.verificationStatus,
          sourceTitle: fact.sourceTitle,
        })),
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error("Range report failed", error);
  process.exitCode = 1;
});
