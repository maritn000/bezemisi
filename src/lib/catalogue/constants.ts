export const SPEC_FIELD_KEYS = [
  "battery_capacity_gross_kwh",
  "battery_capacity_usable_kwh",
  "wltp_range_km",
  "estimated_real_range_km",
  "max_dc_charging_kw",
  "max_ac_charging_kw",
  "dc_charge_10_80_minutes",
  "power_kw",
  "power_hp",
  "torque_nm",
  "zero_to_100_seconds",
  "top_speed_kmh",
  "length_mm",
  "width_mm",
  "height_mm",
  "wheelbase_mm",
  "boot_capacity_l",
  "boot_capacity_max_l",
  "towing_capacity_kg",
  "curb_weight_kg",
  "heat_pump_standard",
  "vehicle_to_load",
  "warranty_vehicle_years",
  "warranty_battery_years",
  "warranty_battery_km",
] as const;

/** Model-level published facts from catalogue cards and marketing pages. */
export const MODEL_LEVEL_FIELD_KEYS = [
  "published_starting_price_czk",
  "published_price_unavailable",
  "published_model_max_wltp_range_km",
  "published_operating_cost_min_czk_per_100km",
  "published_operating_cost_max_czk_per_100km",
  "published_vat_status",
  "published_marketing_description",
] as const;

export const ALL_FIELD_KEYS = [
  ...SPEC_FIELD_KEYS,
  ...MODEL_LEVEL_FIELD_KEYS,
] as const;

export type SpecFieldKey = (typeof SPEC_FIELD_KEYS)[number];
export type ModelLevelFieldKey = (typeof MODEL_LEVEL_FIELD_KEYS)[number];
export type CatalogueFieldKey = (typeof ALL_FIELD_KEYS)[number];

export const IMPORTANT_SPEC_FIELDS: SpecFieldKey[] = [
  "wltp_range_km",
  "battery_capacity_usable_kwh",
  "max_dc_charging_kw",
  "boot_capacity_l",
  "power_kw",
];

export const OFFER_STALE_DAYS = 14;

export const BEZEMISI_BASE_URL = "https://www.bezemisi.cz";

export const MARKET_CZ = "CZ";

export const RANGE_FIELD_KEYS = [
  "wltp_range_km",
  "estimated_real_range_km",
] as const satisfies readonly SpecFieldKey[];

export type RangeFieldKey = (typeof RANGE_FIELD_KEYS)[number];

/** Legacy or alternate keys observed in imports — mapped to canonical field keys. */
export const LEGACY_RANGE_FIELD_KEY_MAP: Record<string, RangeFieldKey> = {
  range_wltp_km: "wltp_range_km",
  wltp_range: "wltp_range_km",
  range_km: "wltp_range_km",
  range: "wltp_range_km",
  dojezd_wltp: "wltp_range_km",
  dojezd_wltp_km: "wltp_range_km",
  dojezd_km: "wltp_range_km",
  real_range_km: "estimated_real_range_km",
  estimated_range_km: "estimated_real_range_km",
};

export const WLTP_RANGE_FIELD_KEY: RangeFieldKey = "wltp_range_km";
export const REAL_RANGE_FIELD_KEY: RangeFieldKey = "estimated_real_range_km";

export const WLTP_RANGE_LABEL = "Dojezd WLTP";
