import type { SpecFieldKey } from "../constants";

export type SeedSpec = {
  fieldKey: SpecFieldKey;
  value: number | string | boolean;
  unit?: string;
  sourceUrl: string;
  sourceTitle: string;
  sourceAuthority: "primary_bezemisi" | "primary_manufacturer";
  sourceType: "bezemisi_vehicle_page" | "manufacturer_model_page" | "bezemisi_commercial_page";
  notes?: string;
};

export type SeedVariant = {
  slug: string;
  name: string;
  trimName?: string;
  batteryVariant?: string;
  drivetrain?: string;
  modelYear?: number;
  seats?: number;
  doors?: number;
  specs: SeedSpec[];
  listPrice?: number;
  offerTitle?: string;
};

export type SeedModelVariants = {
  brandSlug: string;
  modelSlug: string;
  variants: SeedVariant[];
};

export const VERIFIED_VARIANT_SEEDS: SeedModelVariants[] = [
  {
    brandSlug: "hyundai",
    modelSlug: "inster",
    variants: [
      {
        slug: "eco-42kwh-rwd",
        name: "Hyundai INSTER ECO 42 kWh RWD",
        batteryVariant: "42 kWh",
        drivetrain: "RWD",
        modelYear: 2025,
        seats: 4,
        doors: 5,
        listPrice: 599_990,
        offerTitle: "Hyundai INSTER – cena od (Smart)",
        specs: [
          {
            fieldKey: "battery_capacity_usable_kwh",
            value: 42,
            unit: "kWh",
            sourceUrl: "https://www.bezemisi.cz/elektromobily/hyundai/inster",
            sourceTitle: "Hyundai INSTER – Bez emisí",
            sourceAuthority: "primary_bezemisi",
            sourceType: "bezemisi_vehicle_page",
          },
          {
            fieldKey: "wltp_range_km",
            value: 327,
            unit: "km",
            sourceUrl: "https://www.bezemisi.cz/elektromobily/hyundai/inster",
            sourceTitle: "Hyundai INSTER – Bez emisí",
            sourceAuthority: "primary_bezemisi",
            sourceType: "bezemisi_vehicle_page",
            notes: "Kombinovaný WLTP cyklus, verze 42 kWh",
          },
          {
            fieldKey: "power_kw",
            value: 71,
            unit: "kW",
            sourceUrl: "https://www.bezemisi.cz/elektromobily/hyundai/inster",
            sourceTitle: "Hyundai INSTER – Bez emisí",
            sourceAuthority: "primary_bezemisi",
            sourceType: "bezemisi_vehicle_page",
          },
          {
            fieldKey: "dc_charge_10_80_minutes",
            value: 30,
            unit: "min",
            sourceUrl: "https://www.bezemisi.cz/elektromobily/hyundai/inster",
            sourceTitle: "Hyundai INSTER – Bez emisí",
            sourceAuthority: "primary_bezemisi",
            sourceType: "bezemisi_vehicle_page",
          },
          {
            fieldKey: "boot_capacity_l",
            value: 280,
            unit: "l",
            sourceUrl: "https://www.bezemisi.cz/elektromobily/hyundai/inster",
            sourceTitle: "Hyundai INSTER – Bez emisí",
            sourceAuthority: "primary_bezemisi",
            sourceType: "bezemisi_vehicle_page",
          },
          {
            fieldKey: "length_mm",
            value: 3825,
            unit: "mm",
            sourceUrl: "https://www.bezemisi.cz/elektromobily/hyundai/inster",
            sourceTitle: "Hyundai INSTER – Bez emisí",
            sourceAuthority: "primary_bezemisi",
            sourceType: "bezemisi_vehicle_page",
          },
          {
            fieldKey: "max_dc_charging_kw",
            value: 85,
            unit: "kW",
            sourceUrl: "https://www.hyundai.com/cz/cs/modely/inster.html",
            sourceTitle: "Hyundai INSTER – oficiální stránka",
            sourceAuthority: "primary_manufacturer",
            sourceType: "manufacturer_model_page",
          },
        ],
      },
      {
        slug: "power-49kwh-rwd",
        name: "Hyundai INSTER POWER 49 kWh RWD",
        batteryVariant: "49 kWh",
        drivetrain: "RWD",
        modelYear: 2025,
        seats: 4,
        doors: 5,
        listPrice: 749_990,
        offerTitle: "Hyundai INSTER Cross – cena od",
        specs: [
          {
            fieldKey: "battery_capacity_usable_kwh",
            value: 49,
            unit: "kWh",
            sourceUrl: "https://www.bezemisi.cz/elektromobily/hyundai/inster",
            sourceTitle: "Hyundai INSTER – Bez emisí",
            sourceAuthority: "primary_bezemisi",
            sourceType: "bezemisi_vehicle_page",
          },
          {
            fieldKey: "wltp_range_km",
            value: 370,
            unit: "km",
            sourceUrl: "https://www.bezemisi.cz/elektromobily/hyundai/inster",
            sourceTitle: "Hyundai INSTER – Bez emisí",
            sourceAuthority: "primary_bezemisi",
            sourceType: "bezemisi_vehicle_page",
            notes: "Kombinovaný WLTP cyklus, verze 49 kWh",
          },
          {
            fieldKey: "power_kw",
            value: 84.5,
            unit: "kW",
            sourceUrl: "https://www.bezemisi.cz/elektromobily/hyundai/inster",
            sourceTitle: "Hyundai INSTER – Bez emisí",
            sourceAuthority: "primary_bezemisi",
            sourceType: "bezemisi_vehicle_page",
          },
          {
            fieldKey: "dc_charge_10_80_minutes",
            value: 30,
            unit: "min",
            sourceUrl: "https://www.bezemisi.cz/elektromobily/hyundai/inster",
            sourceTitle: "Hyundai INSTER – Bez emisí",
            sourceAuthority: "primary_bezemisi",
            sourceType: "bezemisi_vehicle_page",
          },
          {
            fieldKey: "boot_capacity_l",
            value: 280,
            unit: "l",
            sourceUrl: "https://www.bezemisi.cz/elektromobily/hyundai/inster",
            sourceTitle: "Hyundai INSTER – Bez emisí",
            sourceAuthority: "primary_bezemisi",
            sourceType: "bezemisi_vehicle_page",
          },
        ],
      },
    ],
  },
  {
    brandSlug: "volvo",
    modelSlug: "ex30",
    variants: [
      {
        slug: "single-motor-standard-51kwh",
        name: "Volvo EX30 Single Motor Standard Range 51 kWh",
        batteryVariant: "51 kWh LFP",
        drivetrain: "RWD",
        modelYear: 2025,
        seats: 5,
        doors: 5,
        listPrice: 895_000,
        offerTitle: "Volvo EX30 – cena od",
        specs: [
          {
            fieldKey: "battery_capacity_usable_kwh",
            value: 51,
            unit: "kWh",
            sourceUrl: "https://www.bezemisi.cz/elektromobily/volvo/ex30",
            sourceTitle: "Volvo EX30 – Bez emisí",
            sourceAuthority: "primary_bezemisi",
            sourceType: "bezemisi_vehicle_page",
          },
          {
            fieldKey: "wltp_range_km",
            value: 337,
            unit: "km",
            sourceUrl: "https://www.bezemisi.cz/elektromobily/volvo/ex30",
            sourceTitle: "Volvo EX30 – Bez emisí",
            sourceAuthority: "primary_bezemisi",
            sourceType: "bezemisi_vehicle_page",
            notes: "LFP Standard Range, kombinovaný dojezd",
          },
          {
            fieldKey: "dc_charge_10_80_minutes",
            value: 25,
            unit: "min",
            sourceUrl: "https://www.bezemisi.cz/elektromobily/volvo/ex30",
            sourceTitle: "Volvo EX30 – Bez emisí",
            sourceAuthority: "primary_bezemisi",
            sourceType: "bezemisi_vehicle_page",
          },
          {
            fieldKey: "max_dc_charging_kw",
            value: 153,
            unit: "kW",
            sourceUrl: "https://www.volvocars.com/cz/cars/ex30-electric/",
            sourceTitle: "Volvo EX30 – oficiální stránka",
            sourceAuthority: "primary_manufacturer",
            sourceType: "manufacturer_model_page",
          },
        ],
      },
      {
        slug: "single-motor-extended-69kwh",
        name: "Volvo EX30 Single Motor Extended Range 69 kWh",
        batteryVariant: "69 kWh NMC",
        drivetrain: "RWD",
        modelYear: 2025,
        seats: 5,
        doors: 5,
        specs: [
          {
            fieldKey: "battery_capacity_usable_kwh",
            value: 69,
            unit: "kWh",
            sourceUrl: "https://www.bezemisi.cz/elektromobily/volvo/ex30",
            sourceTitle: "Volvo EX30 – Bez emisí",
            sourceAuthority: "primary_bezemisi",
            sourceType: "bezemisi_vehicle_page",
          },
          {
            fieldKey: "wltp_range_km",
            value: 480,
            unit: "km",
            sourceUrl: "https://www.bezemisi.cz/elektromobily/volvo/ex30",
            sourceTitle: "Volvo EX30 – Bez emisí",
            sourceAuthority: "primary_bezemisi",
            sourceType: "bezemisi_vehicle_page",
            notes: "NMC Extended Range, kombinovaný dojezd",
          },
          {
            fieldKey: "dc_charge_10_80_minutes",
            value: 25,
            unit: "min",
            sourceUrl: "https://www.bezemisi.cz/elektromobily/volvo/ex30",
            sourceTitle: "Volvo EX30 – Bez emisí",
            sourceAuthority: "primary_bezemisi",
            sourceType: "bezemisi_vehicle_page",
          },
        ],
      },
      {
        slug: "twin-motor-performance-69kwh",
        name: "Volvo EX30 Twin Motor Performance 69 kWh",
        batteryVariant: "69 kWh NMC",
        drivetrain: "AWD",
        modelYear: 2025,
        seats: 5,
        doors: 5,
        specs: [
          {
            fieldKey: "battery_capacity_usable_kwh",
            value: 69,
            unit: "kWh",
            sourceUrl: "https://www.bezemisi.cz/elektromobily/volvo/ex30",
            sourceTitle: "Volvo EX30 – Bez emisí",
            sourceAuthority: "primary_bezemisi",
            sourceType: "bezemisi_vehicle_page",
          },
          {
            fieldKey: "power_hp",
            value: 428,
            unit: "k",
            sourceUrl: "https://www.bezemisi.cz/elektromobily/volvo/ex30",
            sourceTitle: "Volvo EX30 – Bez emisí",
            sourceAuthority: "primary_bezemisi",
            sourceType: "bezemisi_vehicle_page",
          },
        ],
      },
    ],
  },
  {
    brandSlug: "kia",
    modelSlug: "ev3",
    variants: [
      {
        slug: "standard-58kwh-rwd",
        name: "Kia EV3 Standard Range 58,3 kWh RWD",
        batteryVariant: "58,3 kWh",
        drivetrain: "RWD",
        modelYear: 2025,
        seats: 5,
        doors: 5,
        listPrice: 899_980,
        offerTitle: "Kia EV3 – cena od",
        specs: [
          {
            fieldKey: "battery_capacity_usable_kwh",
            value: 58.3,
            unit: "kWh",
            sourceUrl: "https://www.bezemisi.cz/elektromobily/kia/ev3",
            sourceTitle: "Kia EV3 – Bez emisí",
            sourceAuthority: "primary_bezemisi",
            sourceType: "bezemisi_vehicle_page",
          },
          {
            fieldKey: "wltp_range_km",
            value: 420,
            unit: "km",
            sourceUrl: "https://www.bezemisi.cz/elektromobily/kia/ev3",
            sourceTitle: "Kia EV3 – Bez emisí",
            sourceAuthority: "primary_bezemisi",
            sourceType: "bezemisi_vehicle_page",
          },
          {
            fieldKey: "max_ac_charging_kw",
            value: 11,
            unit: "kW",
            sourceUrl: "https://www.bezemisi.cz/elektromobily/kia/ev3",
            sourceTitle: "Kia EV3 – Bez emisí",
            sourceAuthority: "primary_bezemisi",
            sourceType: "bezemisi_vehicle_page",
          },
        ],
      },
      {
        slug: "long-range-81kwh-rwd",
        name: "Kia EV3 Long Range 81,4 kWh RWD",
        batteryVariant: "81,4 kWh",
        drivetrain: "RWD",
        modelYear: 2025,
        seats: 5,
        doors: 5,
        specs: [
          {
            fieldKey: "battery_capacity_usable_kwh",
            value: 81.4,
            unit: "kWh",
            sourceUrl: "https://www.bezemisi.cz/elektromobily/kia/ev3",
            sourceTitle: "Kia EV3 – Bez emisí",
            sourceAuthority: "primary_bezemisi",
            sourceType: "bezemisi_vehicle_page",
          },
          {
            fieldKey: "wltp_range_km",
            value: 605,
            unit: "km",
            sourceUrl: "https://www.bezemisi.cz/elektromobily/kia/ev3",
            sourceTitle: "Kia EV3 – Bez emisí",
            sourceAuthority: "primary_bezemisi",
            sourceType: "bezemisi_vehicle_page",
          },
          {
            fieldKey: "max_dc_charging_kw",
            value: 350,
            unit: "kW",
            sourceUrl: "https://www.bezemisi.cz/elektromobily/kia/ev3",
            sourceTitle: "Kia EV3 – Bez emisí",
            sourceAuthority: "primary_bezemisi",
            sourceType: "bezemisi_vehicle_page",
          },
          {
            fieldKey: "dc_charge_10_80_minutes",
            value: 29,
            unit: "min",
            sourceUrl: "https://www.bezemisi.cz/elektromobily/kia/ev3",
            sourceTitle: "Kia EV3 – Bez emisí",
            sourceAuthority: "primary_bezemisi",
            sourceType: "bezemisi_vehicle_page",
          },
          {
            fieldKey: "boot_capacity_max_l",
            value: 485,
            unit: "l",
            sourceUrl: "https://www.bezemisi.cz/elektromobily/kia/ev3",
            sourceTitle: "Kia EV3 – Bez emisí",
            sourceAuthority: "primary_bezemisi",
            sourceType: "bezemisi_vehicle_page",
          },
          {
            fieldKey: "vehicle_to_load",
            value: true,
            sourceUrl: "https://www.bezemisi.cz/elektromobily/kia/ev3",
            sourceTitle: "Kia EV3 – Bez emisí",
            sourceAuthority: "primary_bezemisi",
            sourceType: "bezemisi_vehicle_page",
            notes: "V2L 3,6 kW",
          },
        ],
      },
    ],
  },
];

export const COMMERCIAL_CONDITION_SEEDS = [
  {
    conditionType: "purchase_process" as const,
    title: "Nákupní proces přes Bez emisí",
    content:
      "1) Napíšete nám. 2) Spojíme se a probereme možnosti. 3) Zajistíme nabídku i zkušební jízdu. 4) Předáme vůz. Specializujeme se na elektromobily a pomůžeme s výběrem bez dodatečných nákladů.",
    sourceUrl: "https://www.bezemisi.cz/elektromobily/hyundai/inster",
    sourceTitle: "Hyundai INSTER – proces nákupu Bez emisí",
  },
];
