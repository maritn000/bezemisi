import "server-only";

import { listDiscoveryUrls } from "./discovery";
import { runCatalogueIngestion } from "./upsert-catalogue";

export type RunIngestionOptions = {
  dryRun?: boolean;
};

export async function runIngestion(options: RunIngestionOptions = {}) {
  const discoveredUrls = listDiscoveryUrls();
  const summary = await runCatalogueIngestion(options);
  return {
    discoveredUrls,
    ...summary,
  };
}
