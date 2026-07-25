import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { fetchPage } from "../fetch-page";
import {
  hashContent,
  type CrawlManifest,
  type CrawlManifestEntry,
  type CrawlPageType,
  upsertManifestEntry,
} from "./manifest";

const CACHE_DIR = path.join(process.cwd(), ".catalogue-cache", "pages");
const MAX_RETRIES = 4;
const BASE_BACKOFF_MS = 2000;

export type CrawlOptions = {
  runId?: string;
  manifest: CrawlManifest;
  resume?: boolean;
  onProgress?: (entry: CrawlManifestEntry) => void;
};

function cachePathFor(url: string) {
  const safe = Buffer.from(url).toString("base64url");
  return path.join(CACHE_DIR, `${safe}.html`);
}

async function readCachedPage(url: string) {
  try {
    return await readFile(cachePathFor(url), "utf8");
  } catch {
    return null;
  }
}

async function writeCachedPage(url: string, html: string) {
  await mkdir(CACHE_DIR, { recursive: true });
  await writeFile(cachePathFor(url), html, "utf8");
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function crawlUrl(
  url: string,
  pageType: CrawlPageType,
  options: CrawlOptions,
  parentUrl: string | null = null,
): Promise<{ html: string; entry: CrawlManifestEntry }> {
  const existing = options.manifest.entries[url];
  if (
    options.resume &&
    existing?.parseStatus === "parsed" &&
    existing.httpStatus &&
    existing.httpStatus >= 200 &&
    existing.httpStatus < 400
  ) {
    const cached = await readCachedPage(url);
    if (cached) {
      return { html: cached, entry: existing };
    }
  }

  let retryCount = existing?.retryCount ?? 0;
  let lastError: string | null = null;

  while (retryCount <= MAX_RETRIES) {
    try {
      const fetched = await fetchPage(url);
      await writeCachedPage(url, fetched.html);

      const entry: CrawlManifestEntry = {
        url,
        pageType,
        parentUrl,
        httpStatus: fetched.status,
        fetchTimestamp: fetched.fetchedAt.toISOString(),
        contentHash: hashContent(fetched.html),
        parseStatus: fetched.status >= 200 && fetched.status < 400 ? "pending" : "failed",
        imagesFound: existing?.imagesFound ?? 0,
        factsFound: existing?.factsFound ?? 0,
        retryCount,
        error:
          fetched.status >= 200 && fetched.status < 400
            ? null
            : `HTTP ${fetched.status}`,
      };

      upsertManifestEntry(options.manifest, entry);
      options.onProgress?.(entry);

      if (fetched.status === 429 || fetched.status >= 500) {
        retryCount += 1;
        const backoff = BASE_BACKOFF_MS * 2 ** retryCount;
        await sleep(backoff);
        continue;
      }

      return { html: fetched.html, entry };
    } catch (error) {
      lastError = error instanceof Error ? error.message : "unknown";
      retryCount += 1;
      await sleep(BASE_BACKOFF_MS * 2 ** retryCount);
    }
  }

  const failedEntry: CrawlManifestEntry = {
    url,
    pageType,
    parentUrl,
    httpStatus: existing?.httpStatus ?? null,
    fetchTimestamp: existing?.fetchTimestamp ?? null,
    contentHash: existing?.contentHash ?? null,
    parseStatus: "failed",
    imagesFound: existing?.imagesFound ?? 0,
    factsFound: existing?.factsFound ?? 0,
    retryCount,
    error: lastError ?? "max retries exceeded",
  };
  upsertManifestEntry(options.manifest, failedEntry);
  options.onProgress?.(failedEntry);
  return { html: "", entry: failedEntry };
}

export function extractLinks(html: string, baseUrl: string) {
  const links = new Set<string>();
  const pattern = /href=["']([^"'#]+)["']/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html)) !== null) {
    const href = match[1];
    if (!href || href.startsWith("mailto:") || href.startsWith("tel:")) {
      continue;
    }
    try {
      const resolved = new URL(href, baseUrl).toString();
      links.add(resolved.replace(/\/$/, ""));
    } catch {
      // ignore invalid URLs
    }
  }
  return [...links];
}
