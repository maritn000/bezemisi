import {
  LEGACY_RANGE_FIELD_KEY_MAP,
  RANGE_FIELD_KEYS,
  type RangeFieldKey,
  type SpecFieldKey,
} from "./constants";

export function isRangeFieldKey(fieldKey: string): fieldKey is RangeFieldKey {
  return (RANGE_FIELD_KEYS as readonly string[]).includes(fieldKey);
}

export function canonicalizeRangeFieldKey(fieldKey: string): RangeFieldKey | null {
  if (isRangeFieldKey(fieldKey)) {
    return fieldKey;
  }

  return LEGACY_RANGE_FIELD_KEY_MAP[fieldKey.trim().toLowerCase()] ?? null;
}

export function isLegacyRangeFieldKey(fieldKey: string): boolean {
  return (
    !isRangeFieldKey(fieldKey) &&
    fieldKey.trim().toLowerCase() in LEGACY_RANGE_FIELD_KEY_MAP
  );
}

export function parseRangeNumericValue(input: {
  valueType: string;
  numericValue: string | null;
  textValue: string | null;
}): number | null {
  if (input.valueType === "number" && input.numericValue !== null) {
    const parsed = Number(input.numericValue);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }

  if (input.textValue) {
    const match = input.textValue.replace(/\s/g, "").match(/(\d{2,4})/);
    if (match) {
      const parsed = Number(match[1]);
      return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
    }
  }

  return null;
}

export function isUsableVerifiedRangeValue(
  fieldKey: SpecFieldKey | string,
  value: string | number | boolean | null,
): boolean {
  if (!isRangeFieldKey(canonicalizeRangeFieldKey(fieldKey) ?? "")) {
    return false;
  }

  if (typeof value !== "number") {
    return false;
  }

  return Number.isFinite(value) && value > 0;
}
