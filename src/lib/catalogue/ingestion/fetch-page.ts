import { createHash } from "node:crypto";

const REQUEST_DELAY_MS = 750;

let lastRequestAt = 0;

export type FetchedPage = {
  url: string;
  status: number;
  html: string;
  contentHash: string;
  fetchedAt: Date;
};

export async function fetchPage(
  url: string,
  options?: { skipDelay?: boolean },
): Promise<FetchedPage> {
  const now = Date.now();
  const delayMs = options?.skipDelay ? 0 : REQUEST_DELAY_MS;
  const waitFor = delayMs - (now - lastRequestAt);
  if (waitFor > 0) {
    await new Promise((resolve) => setTimeout(resolve, waitFor));
  }
  lastRequestAt = Date.now();

  const response = await fetch(url, {
    headers: {
      "User-Agent": "BezemisiCatalogueBot/1.0 (+https://bezemisi.vercel.app)",
      Accept: "text/html,application/xhtml+xml",
    },
    redirect: "follow",
  });

  const html = await response.text();
  const contentHash = createHash("sha256").update(html).digest("hex");

  return {
    url,
    status: response.status,
    html,
    contentHash,
    fetchedAt: new Date(),
  };
}

export function stripHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractFirstNumber(text: string, pattern: RegExp) {
  const match = text.match(pattern);
  if (!match?.[1]) return null;
  return Number(match[1].replace(/\s/g, "").replace(",", "."));
}
