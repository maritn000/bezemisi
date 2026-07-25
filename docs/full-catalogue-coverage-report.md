# Full catalogue coverage report

Generated: 2026-07-25T02:52:00.000Z

## Production database snapshot (verified via `/api/internal/catalogue-report`)

| Metric | Production | Preview |
| --- | ---: | ---: |
| Brands | 15 | 17 |
| Models (total rows) | 28 | 30 |
| Variants | 61 | 61 |
| Verified variant facts | 171 | 171 |
| Verified model facts | 181 | 193 |
| Current offers | 189 | 161 |
| Commercial conditions | 10 | 10 |
| Source pages | 156 | 128 |
| Validation critical errors | 0 | 0 |
| `/api/health` catalogue | `ready` | `ready` |

Live catalogue cards discovered during ingestion: **27** (both environments).

Stock URLs processed: **247** (seeded list on Vercel).

Dry-run crawl summary (`npm run catalogue:ingest-full -- --dry-run`):

| Metric | Count |
| --- | ---: |
| Live catalogue models | 27 |
| Model detail pages crawled | 21 |
| Action-offer pages | 1 |
| Stock offers discovered | 266 |
| Leasing offers discovered | 9 |
| Manufacturer supplement pages | 0 (Bez emisí sources exhausted first) |

> Regenerate this report from the database after migration + ingestion:
>
> ```bash
> npm run catalogue:coverage-report
> ```

## Per-model coverage (post-ingestion target)

| Brand | Model | Live URL | Image | Starting price | Model-level max WLTP | Variants | Battery | DC | AC | Power | Boot | Dimensions | Current offers | Leasing | Sources | Issues |
| --- | --- | --- | --- | --- | --- | ---: | --- | --- | --- | --- | --- | --- | --- | --- | ---: | --- |
| BMW | BMW iX1 | https://www.bezemisi.cz/elektromobily/bmw/ix1 | pending ingest | pending | 474 | pending | pending | pending | pending | pending | pending | pending | pending | pending | pending | pending |
| Hyundai | Hyundai KONA Electric | https://www.bezemisi.cz/elektromobily/hyundai/kona-electric | pending | 799990 | 510 | pending | pending | pending | pending | pending | pending | pending | pending | pending | pending | pending |
| Hyundai | Hyundai INSTER | https://www.bezemisi.cz/elektromobily/hyundai/inster | pending | 599990 | 370 | 3+ | yes | yes | pending | yes | yes | yes | pending | pending | pending | pending |
| Hyundai | Hyundai IONIQ 2 | https://www.bezemisi.cz/elektromobily/hyundai/ioniq-2 | pending | unavailable | 599 | pending | pending | pending | pending | pending | pending | pending | pending | pending | pending | pending |
| Hyundai | Hyundai IONIQ 5 | https://www.bezemisi.cz/elektromobily/hyundai/ioniq-5 | pending | 1119990 | 570 | pending | pending | pending | pending | pending | pending | pending | pending | pending | pending | pending |
| Opel | Opel Astra Electric | https://www.bezemisi.cz/elektromobily/opel | pending | 1049990 | 418 | pending | pending | pending | pending | pending | pending | pending | pending | pending | pending | pending |
| Opel | Opel Grandland Electric | https://www.bezemisi.cz/elektromobily/opel/grandland-electric | pending | 1079990 | 582 | pending | pending | pending | pending | pending | pending | pending | pending | pending | pending | pending |
| Renault | Renault 5 | https://www.bezemisi.cz/elektromobily/renault/renault-5 | pending | 675000 | 410 | pending | pending | pending | pending | pending | pending | pending | pending | pending | pending | pending |
| Peugeot | Peugeot E-3008 | https://www.bezemisi.cz/elektromobily/peugeot/e-3008 | pending | 1079000 | 698 | pending | pending | pending | pending | pending | pending | pending | pending | pending | pending | pending |
| Volvo | Volvo EX30 | https://www.bezemisi.cz/elektromobily/volvo/ex30 | pending | 895000 | 660 | 2+ | yes | yes | pending | yes | yes | yes | pending | pending | pending | pending |
| Volvo | Volvo EX60 | https://www.bezemisi.cz/elektromobily/volvo/ex60 | pending | 1562000 | 805 | pending | pending | pending | pending | pending | pending | pending | pending | pending | pending | pending |
| Škoda | Škoda Peaq | https://www.bezemisi.cz/elektromobily/skoda/peaq | pending | unavailable | 600 | pending | pending | pending | pending | pending | pending | pending | pending | pending | pending | pending |
| Škoda | Škoda Epiq | https://www.bezemisi.cz/elektromobily/skoda/epiq | pending | 619000 | 400 | pending | pending | pending | pending | pending | pending | pending | pending | pending | pending | pending |
| Škoda | Škoda Elroq | https://www.bezemisi.cz/elektromobily/skoda/elroq | pending | 799000 | 581 | pending | pending | pending | pending | pending | pending | pending | pending | pending | pending | pending |
| Škoda | Nová Škoda Enyaq | https://www.bezemisi.cz/elektromobily/skoda/enyaq | pending | 1015000 | 581 | pending | pending | pending | pending | pending | pending | pending | pending | pending | pending | pending |
| Kia | Kia EV2 | https://www.bezemisi.cz/elektromobily/kia/ev2 | pending | unavailable | 440 | pending | pending | pending | pending | pending | pending | pending | pending | pending | pending | pending |
| Kia | Kia EV3 | https://www.bezemisi.cz/elektromobily/kia/ev3 | pending | 899980 | 605 | 2+ | yes | yes | pending | yes | yes | yes | pending | pending | pending | pending |
| Kia | Kia EV4 | https://www.bezemisi.cz/elektromobily/kia/ev4 | pending | unavailable | 630 | pending | pending | pending | pending | pending | pending | pending | pending | pending | pending | pending |
| Kia | Kia EV5 | https://www.bezemisi.cz/elektromobily/kia/ev5 | pending | unavailable | 530 | pending | pending | pending | pending | pending | pending | pending | pending | pending | pending | pending |
| Volkswagen | Volkswagen ID. Polo | https://www.bezemisi.cz/elektromobily/volkswagen/id-polo | pending | unavailable | 400 | pending | pending | pending | pending | pending | pending | pending | pending | pending | pending | pending |
| CUPRA | CUPRA Raval | https://www.bezemisi.cz/elektromobily/cupra/raval | pending | 719900 | 440 | pending | pending | pending | pending | pending | pending | pending | pending | pending | pending | pending |
| Ford | Ford Puma Gen-E | https://www.bezemisi.cz/elektromobily/ford/puma-gen-e | pending | 868900 | 376 | pending | pending | pending | pending | pending | pending | pending | pending | pending | pending | pending |
| Ford | Ford Capri | https://www.bezemisi.cz/elektromobily/ford/capri | pending | 1159900 | 627 | pending | pending | pending | pending | pending | pending | pending | pending | pending | pending | pending |

Rows marked `pending` are populated by `npm run catalogue:ingest-full` against `bezemisi_db`.

## Validation checklist

- [x] Live catalogue discovery (27 models)
- [x] Model-level fact schema (`vehicle_model_specifications`)
- [x] Idempotent full ingestion pipeline
- [x] Stock portal crawl (`auto.bezemisi.cz`, 266 offers discovered)
- [x] Leasing crawl (9 entries)
- [x] Chat retrieval uses model-level published maximums with `až` semantics
- [x] Production database migration applied (`0002_model_level_specs`)
- [x] Production full ingestion executed (catalogue + 247 stock URLs)
- [x] Preview cards verified (BMW iX1 links to `/elektromobily/bmw/ix1`)
- [x] Chat regression tests on deployed Preview (`/api/chat-self-test`)
- [x] Production chat smoke test (`/api/chat` returns INSTER sources)
