import assert from "node:assert/strict";
import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

const ROOT = path.resolve(__dirname, "..");

const CORE_ASSETS = [
  "public/hero/home-hero.png",
  "public/sections/city.jpg",
  "public/sections/guide.jpg",
  "public/sections/charging.jpg",
  "public/sections/about-team.webp",
  "public/vehicles/hyundai-inster.jpg",
  "public/vehicles/volvo-ex30.jpg",
  "public/vehicles/kia-ev3.jpg",
  "public/blog/nejlevnejsi-elektromobily.jpg",
  "public/blog/degradace-baterie.webp",
  "public/blog/baterie-zaruka-servis.webp",
] as const;

describe("core public assets", () => {
  for (const asset of CORE_ASSETS) {
    it(`keeps ${asset} committed and non-empty`, () => {
      const absolutePath = path.join(ROOT, asset);
      assert.equal(existsSync(absolutePath), true, `${asset} is missing`);
      assert.ok(statSync(absolutePath).size > 0, `${asset} is empty`);
    });
  }
});

describe("site route sources", () => {
  const routes = [
    "src/app/page.tsx",
    "src/app/mapa-stranek/page.tsx",
    "src/app/elektromobily/page.tsx",
    "src/app/elektromobily/[brand]/[model]/page.tsx",
  ];

  for (const route of routes) {
    it(`includes ${route}`, () => {
      assert.equal(existsSync(path.join(ROOT, route)), true);
    });
  }
});
