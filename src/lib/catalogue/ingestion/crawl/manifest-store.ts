import { mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { eq } from "drizzle-orm";

import { createDb } from "@/db/create-client";
import { getNormalizedDatabaseUrl } from "@/env";
import { catalogueIngestionRuns } from "@/db/schema";

import {
  getManifestPath,
  type CrawlManifest,
} from "./manifest";

function isServerlessRuntime() {
  return Boolean(process.env.VERCEL);
}

function getWritableManifestPath(runId: string) {
  if (isServerlessRuntime()) {
    return path.join(tmpdir(), `crawl-manifest-${runId}.json`);
  }
  return getManifestPath(runId);
}

async function readManifestFile(filePath: string): Promise<CrawlManifest | null> {
  try {
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw) as CrawlManifest;
  } catch {
    return null;
  }
}

async function writeManifestFile(filePath: string, manifest: CrawlManifest) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(manifest, null, 2), "utf8");
}

async function loadManifestFromRun(runId: string): Promise<CrawlManifest | null> {
  const db = createDb(getNormalizedDatabaseUrl());
  const [run] = await db
    .select({ metadata: catalogueIngestionRuns.metadata })
    .from(catalogueIngestionRuns)
    .where(eq(catalogueIngestionRuns.id, runId))
    .limit(1);

  const manifest = run?.metadata?.crawlManifest;
  if (!manifest || typeof manifest !== "object") {
    return null;
  }

  return manifest as CrawlManifest;
}

async function saveManifestToRun(runId: string, manifest: CrawlManifest) {
  const db = createDb(getNormalizedDatabaseUrl());
  const [run] = await db
    .select({ metadata: catalogueIngestionRuns.metadata })
    .from(catalogueIngestionRuns)
    .where(eq(catalogueIngestionRuns.id, runId))
    .limit(1);

  await db
    .update(catalogueIngestionRuns)
    .set({
      metadata: {
        ...(run?.metadata ?? {}),
        crawlManifest: manifest,
      },
      updatedAt: new Date(),
    })
    .where(eq(catalogueIngestionRuns.id, runId));
}

export async function loadIngestionManifest(
  runId: string,
  ingestionRunId?: string | null,
): Promise<CrawlManifest> {
  const now = new Date().toISOString();

  if (ingestionRunId) {
    const fromDb = await loadManifestFromRun(ingestionRunId);
    if (fromDb) {
      return fromDb;
    }
  }

  const fromFile = await readManifestFile(getWritableManifestPath(runId));
  if (fromFile) {
    return fromFile;
  }

  return { startedAt: now, updatedAt: now, entries: {} };
}

export async function saveIngestionManifest(
  manifest: CrawlManifest,
  runId: string,
  ingestionRunId?: string | null,
) {
  manifest.updatedAt = new Date().toISOString();
  const filePath = getWritableManifestPath(runId);
  await writeManifestFile(filePath, manifest);

  if (ingestionRunId) {
    await saveManifestToRun(ingestionRunId, manifest);
  }
}
