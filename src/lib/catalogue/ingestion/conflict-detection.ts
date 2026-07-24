import type { SeedSpec } from "./seed-data";

export type ConflictResult = {
  hasConflict: boolean;
  existingValue?: string;
  incomingValue?: string;
};

export function detectSpecConflict(
  existing:
    | {
        numericValue: string | null;
        textValue: string | null;
        booleanValue: boolean | null;
        valueType: string;
      }
    | undefined,
  incoming: SeedSpec,
): ConflictResult {
  if (!existing) {
    return { hasConflict: false };
  }

  const existingValue =
    existing.valueType === "number"
      ? existing.numericValue
      : existing.valueType === "boolean"
        ? String(existing.booleanValue)
        : existing.textValue;

  const incomingValue =
    typeof incoming.value === "number"
      ? String(incoming.value)
      : String(incoming.value);

  if (existingValue === null || existingValue === undefined) {
    return { hasConflict: false };
  }

  if (existingValue !== incomingValue) {
    return {
      hasConflict: true,
      existingValue,
      incomingValue,
    };
  }

  return { hasConflict: false };
}
