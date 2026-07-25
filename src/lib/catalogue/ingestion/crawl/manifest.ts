import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type CrawlPageType =
  | "catalogue_root"
  | "brand_page"
  | "model_page"
  | "action_offer_list"
  | "action_offer_detail"
  | "stock_list"
  | "stock_detail"
  | "leasing_list"
  | "leasing_detail"
  | "article"
  | "manufacturer"
  | "other";

export type CrawlManifestEntry = {
  url: string;
  pageType: CrawlPageType;
  parentUrl: string | null;
  httpStatus: number | null;
  fetchTimestamp: string | null;
  contentHash: string | null;
  parseStatus: "pending" | "parsed" | "failed" | "skipped";
  imagesFound: number;
  factsFound: number;
  retryCount: number;
  error: string | null;
};

export type CrawlManifest = {
  startedAt: string;
  updatedAt: string;
  entries: Record<string, CrawlManifestEntry>;
};

const DEFAULT_MANIFEST_DIR = path.join(process.cwd(), ".catalogue-cache");

export function getManifestPath(runId = "default") {
  return path.join(DEFAULT_MANIFEST_DIR, `crawl-manifest-${runId}.json`);
}

export async function loadManifest(runId = "default"): Promise<CrawlManifest> {
  const filePath = getManifestPath(runId);
  try {
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw) as CrawlManifest;
  } catch {
    const now = new Date().toISOString();
    return { startedAt: now, updatedAt: now, entries: {} };
  }
}

export async function saveManifest(
  manifest: CrawlManifest,
  runId = "default",
) {
  manifest.updatedAt = new Date().toISOString();
  const filePath = getManifestPath(runId);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(manifest, null, 2), "utf8");
}

export function upsertManifestEntry(
  manifest: CrawlManifest,
  entry: CrawlManifestEntry,
) {
  manifest.entries[entry.url] = entry;
}

export function hashContent(content: string) {
  return createHash("sha256").update(content).digest("hex");
}
