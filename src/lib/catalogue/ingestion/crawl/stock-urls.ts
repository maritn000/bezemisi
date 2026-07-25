import seedUrls from "./stock-urls.seed.json";

export function getKnownStockDetailUrls(): string[] {
  return [...seedUrls];
}
