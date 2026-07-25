import assert from "node:assert/strict";
import test from "node:test";

import {
  canonicalizeRangeFieldKey,
  isLegacyRangeFieldKey,
  isUsableVerifiedRangeValue,
  parseRangeNumericValue,
} from "@/lib/catalogue/range-field-keys";
import {
  understandQuery,
  understandQueryFromMessages,
} from "@/lib/catalogue/query-understanding";
import { WLTP_RANGE_FIELD_KEY } from "@/lib/catalogue/constants";

test("canonicalizes legacy WLTP range keys", () => {
  assert.equal(canonicalizeRangeFieldKey("range_wltp_km"), WLTP_RANGE_FIELD_KEY);
  assert.equal(canonicalizeRangeFieldKey("dojezd_wltp"), WLTP_RANGE_FIELD_KEY);
  assert.equal(canonicalizeRangeFieldKey("wltp_range_km"), WLTP_RANGE_FIELD_KEY);
  assert.equal(isLegacyRangeFieldKey("range_km"), true);
});

test("parses numeric and text range values", () => {
  assert.equal(
    parseRangeNumericValue({
      valueType: "number",
      numericValue: "480",
      textValue: null,
    }),
    480,
  );
  assert.equal(
    parseRangeNumericValue({
      valueType: "text",
      numericValue: null,
      textValue: "až 605 km",
    }),
    605,
  );
  assert.equal(
    parseRangeNumericValue({
      valueType: "number",
      numericValue: "0",
      textValue: null,
    }),
    null,
  );
});

test("rejects unusable verified range values", () => {
  assert.equal(isUsableVerifiedRangeValue(WLTP_RANGE_FIELD_KEY, 450), true);
  assert.equal(isUsableVerifiedRangeValue(WLTP_RANGE_FIELD_KEY, 0), false);
  assert.equal(isUsableVerifiedRangeValue("boot_capacity_l", 400), false);
});

test("Czech query understanding for range detail question", () => {
  const intent = understandQuery("Jaký dojezd má Hyundai Inster?");
  assert.equal(intent.intent, "vehicle_detail");
  assert.equal(intent.brand, "hyundai");
  assert.equal(intent.model, "inster");
});

test("Czech query understanding for threshold search", () => {
  const intent = understandQuery("Které auto má dojezd alespoň 450 km?");
  assert.equal(intent.intent, "vehicle_search");
  assert.equal(intent.minimumWltpRange, 450);
});

test("multi-turn follow-up keeps prior WLTP threshold and sorts by boot", () => {
  const intent = understandQueryFromMessages([
    {
      role: "user",
      parts: [{ text: "Které auto má dojezd alespoň 450 km?" }],
    },
    {
      role: "assistant",
      parts: [{ text: "Nalezeny varianty s dojezdem nad 450 km." }],
    },
    {
      role: "user",
      parts: [{ text: "A které z nich má největší kufr?" }],
    },
  ]);

  assert.equal(intent.intent, "vehicle_search");
  assert.equal(intent.minimumWltpRange, 450);
  assert.equal(intent.sortByField, "boot_capacity_l");
});

test("ambiguous generic maximum range is not treated as canonical key", () => {
  assert.equal(canonicalizeRangeFieldKey("marketing_range_km"), null);
});
