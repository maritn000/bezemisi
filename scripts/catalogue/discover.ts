import { config } from "dotenv";

import { listDiscoveryUrls } from "../../src/lib/catalogue/ingestion/discovery";

config({ path: ".env.local" });

async function main() {
  const urls = listDiscoveryUrls();
  console.log(JSON.stringify({ discovered: urls.length, urls }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
