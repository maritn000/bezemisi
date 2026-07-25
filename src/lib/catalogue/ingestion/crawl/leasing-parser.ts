import { parseAzKm, parseCzechInteger, parseCzechPrice, stripTags } from "../parsers/czech";

export type ParsedLeasingOffer = {
  title: string;
  modelLabel: string;
  trimLabel: string | null;
  monthlyPaymentExVat: number | null;
  monthlyPaymentIncVat: number | null;
  mileageAllowanceKm: number | null;
  contractDurationMonths: number | null;
  wltpRangeKm: number | null;
  batteryKwh: number | null;
  powerKw: number | null;
  bootCapacityL: number | null;
  equipment: string[];
  sourceUrl: string;
};

export function discoverLeasingUrls(html: string, baseUrl = "https://www.bezemisi.cz") {
  const urls = new Set<string>([`${baseUrl}/operativni-leasing`]);
  const pattern = /href="(https:\/\/www\.bezemisi\.cz\/[^"#?]+)"/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html)) !== null) {
    if (/operativni-leasing|leasing/i.test(match[1])) {
      urls.add(match[1].replace(/\/$/, ""));
    }
  }
  return [...urls];
}

export function parseLeasingPage(html: string, sourceUrl: string): ParsedLeasingOffer[] {
  const offers: ParsedLeasingOffer[] = [];
  const sections = html.split(/class="flexcard|class="entry/i);

  for (const section of sections) {
    const text = stripTags(section);
    if (!/leasing|měsíčně|měsíc/i.test(text)) continue;

    const titleMatch = section.match(/<h[23][^>]*>([\s\S]*?)<\/h[23]>/i);
    const title = titleMatch ? stripTags(titleMatch[1]) : "Operativní leasing";

    const monthlyExVat = (() => {
      const match = text.match(/(\d[\d\s]*)\s*Kč\s*\/\s*měsíc\s*bez\s*DPH/i);
      return match ? parseCzechInteger(match[1]) : null;
    })();
    const monthlyIncVat = (() => {
      const match = text.match(/(\d[\d\s]*)\s*Kč\s*\/\s*měsíc\s*včetně\s*DPH/i);
      return match ? parseCzechInteger(match[1]) : null;
    })();

    const mileage = (() => {
      const match = text.match(/(\d[\d\s]*)\s*km\s*\/\s*rok/i);
      return match ? parseCzechInteger(match[1]) : null;
    })();

    const duration = (() => {
      const match = text.match(/(\d+)\s*měsíc/i);
      return match ? Number(match[1]) : null;
    })();

    const range = parseAzKm(text);
    const batteryMatch = text.match(/(\d+)\s*kWh/i);
    const powerMatch = text.match(/(\d+)\s*kW/i);
    const bootMatch = text.match(/(\d+)\s*l/i);

    if (
      monthlyExVat === null &&
      monthlyIncVat === null &&
      range === null &&
      !/leasing/i.test(title)
    ) {
      continue;
    }

    offers.push({
      title,
      modelLabel: title,
      trimLabel: null,
      monthlyPaymentExVat: monthlyExVat,
      monthlyPaymentIncVat: monthlyIncVat,
      mileageAllowanceKm: mileage,
      contractDurationMonths: duration,
      wltpRangeKm: range,
      batteryKwh: batteryMatch ? Number(batteryMatch[1]) : null,
      powerKw: powerMatch ? Number(powerMatch[1]) : null,
      bootCapacityL: bootMatch ? Number(bootMatch[1]) : null,
      equipment: [],
      sourceUrl,
    });
  }

  if (offers.length === 0 && /operativní\s+leasing/i.test(stripTags(html))) {
    const price = parseCzechPrice(stripTags(html));
    if (price !== null) {
      offers.push({
        title: "Operativní leasing",
        modelLabel: "Operativní leasing",
        trimLabel: null,
        monthlyPaymentExVat: null,
        monthlyPaymentIncVat: price,
        mileageAllowanceKm: null,
        contractDurationMonths: null,
        wltpRangeKm: parseAzKm(stripTags(html)),
        batteryKwh: null,
        powerKw: null,
        bootCapacityL: null,
        equipment: [],
        sourceUrl,
      });
    }
  }

  return offers;
}
