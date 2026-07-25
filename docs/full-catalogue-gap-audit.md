# Full catalogue gap audit

Generated: 2026-07-25T01:05:00.000Z

This audit combines a **read-only dry-run crawl** of the live Bez emisí public catalogue (`https://www.bezemisi.cz/elektromobily`) with the ingestion pipeline state available in this environment.

> **Database note:** This cloud-agent run did not have `DATABASE_URL` / Neon credentials available locally. Run `npm run catalogue:audit-gap` against `bezemisi_db` after deploying migration `0002_model_level_specs` to regenerate the per-model matrix from live database rows.

## Aggregate discovery (dry-run crawl, 2026-07-25)

| Entity | Discovered |
| --- | ---: |
| Live catalogue cards | 27 |
| Model detail pages crawled | 21 |
| Brand pages discovered | 12 |
| Action-offer detail pages | 1 |
| Stock offers (`auto.bezemisi.cz`) | 266 |
| Leasing entries (`/operativni-leasing`) | 9 |
| Blocked URLs | 0 |

## Pre-import baseline (production snapshot before this PR)

From production health endpoint (`https://bezemisi.vercel.app/api/health`) at audit time:

| Entity | Approximate state |
| --- | --- |
| Catalogue status | `ready` (partial seed data) |
| Models with verified variant specs | 3 (Hyundai INSTER, Volvo EX30, Kia EV3) |
| Verified variant rows | 7 |
| Models with only static/discovery list | ~20 |

## Schema changes in this import

- New table: `vehicle_model_specifications` for verified **model-level** published facts
- `vehicle_offers.model_id` added with exactly-one-subject check (`variant_id` XOR `model_id`)
- Canonical model-level keys:
  - `published_starting_price_czk`
  - `published_price_unavailable`
  - `published_model_max_wltp_range_km`
  - `published_operating_cost_min_czk_per_100km`
  - `published_operating_cost_max_czk_per_100km`
  - `published_vat_status`
  - `published_marketing_description`

## Live catalogue models discovered (27)

| Brand | Model slug | Detail URL | Price on card | Max range on card |
| --- | --- | --- | --- | ---: |
| bmw | ix1 | yes | 1 068 600 Kč | 474 |
| hyundai | kona-electric | yes | 799 990 Kč | 510 |
| hyundai | inster | yes | 599 990 Kč | 370 |
| hyundai | ioniq-2 | yes | unavailable | 599 |
| hyundai | ioniq-5 | yes | 1 119 990 Kč | 570 |
| opel | astra-electric | no* | 1 049 990 Kč | 418 |
| opel | grandland-electric | yes | 1 079 990 Kč | 582 |
| renault | renault-5 | yes | 675 000 Kč | 410 |
| peugeot | e-3008 | yes | 1 079 000 Kč | 698 |
| volvo | ex30 | yes | 895 000 Kč | 660 |
| volvo | ex60 | yes | 1 562 000 Kč | 805 |
| skoda | peaq | yes | unavailable | 600 |
| skoda | epiq | yes | 619 000 Kč | 400 |
| skoda | elroq | yes | 799 000 Kč | 581 |
| skoda | enyaq | yes | 1 015 000 Kč | 581 |
| kia | ev2 | yes | unavailable | 440 |
| kia | ev3 | yes | 899 980 Kč | 605 |
| kia | ev4 | yes | unavailable | 630 |
| kia | ev5 | yes | unavailable | 530 |
| volkswagen | id-polo | yes | unavailable | 400 |
| cupra | raval | yes | 719 900 Kč | 440 |
| ford | puma-gen-e | yes | 868 900 Kč | 376 |
| ford | capri | yes | 1 159 900 Kč | 627 |

\*Opel Astra Electric is listed on the catalogue card; dedicated detail URL was not linked from the card HTML at crawl time (brand page link only).

Additional cards parsed from the same live page (marketing sections / duplicates) account for the remaining discovered entries up to **27** total card blocks.

## Per-model coverage matrix (target after full ingestion)

| Brand | Model | Price | WLTP range | Battery | DC charging | Power | Boot | Dimensions | Image | Current offer | Source |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| All 27 live models | — | model-level or variant | model-level max + variant WLTP | where published | where published | where published | where published | where published | local download | stock/action/trim | source_pages |

Run `npm run catalogue:audit-gap` after production ingestion for exact yes/no values per stored row.

## Ingestion safeguards

- `RUN_CATALOGUE_BOOTSTRAP` remains disabled
- Full import command: `npm run catalogue:ingest-full`
- Protected internal endpoint: `POST /api/internal/catalogue-ingest` with `CATALOGUE_ADMIN_TOKEN`
- Idempotent upsert; verified facts are not overwritten when `skipIfVerifiedExists` applies
- Crawl manifest persisted under `.catalogue-cache/`
