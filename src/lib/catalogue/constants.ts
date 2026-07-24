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

export type SpecFieldKey = (typeof SPEC_FIELD_KEYS)[number];

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
