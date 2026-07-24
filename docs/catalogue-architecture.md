# Architektura ověřeného katalogu

## Cíl

Katalog ukládá ověřená fakta o elektromobilech prezentovaných Bez emisí v relačních tabulkách s plnou proveniencí. Chatbot ani veřejné stránky nesmí používat paměť modelu ani neověřené odhady.

## Schéma

| Tabulka | Účel |
|---------|------|
| `vehicle_brands` | Značky |
| `vehicle_models` | Modelové řady |
| `vehicle_variants` | Technické varianty |
| `vehicle_specifications` | Jeden ověřený fakt na záznam |
| `vehicle_offers` | Konkrétní komerční nabídky |
| `commercial_conditions` | Ověřené nákupní a servisní podmínky |
| `source_pages` | Konkrétní URL zdroje s metadaty |
| `catalogue_ingestion_runs` | Audit běhů importu |
| `catalogue_ingestion_issues` | Varování a chyby importu |

Existující tabulky `sources`, `conversations`, `messages` zůstávají beze změny.

## Hierarchie zdrojů

1. aktuální stránka Bez emisí
2. oficiální stránka výrobce / technický PDF
3. oficiální regulatorní zdroj
4. schválený sekundární zdroj pouze pokud primární chybí

## Ingestion

Moduly v `src/lib/catalogue/ingestion/`:

- `discovery.ts` – seznam veřejných URL a modelů
- `fetch-page.ts` – konzervativní HTTP fetch
- `seed-data.ts` – deterministická seed data pro ověřené varianty
- `upsert-catalogue.ts` – idempotentní upsert
- `conflict-detection.ts` – detekce konfliktů
- `run-ingestion.ts` – orchestrace běhu

Příkazy:

```bash
npm run catalogue:discover
npm run catalogue:ingest
npm run catalogue:validate
npm run catalogue:report
```

## Retrieval pro chat

1. `understandQuery()` převádí český dotaz na intent.
2. `catalogue-service` volá repository funkce (`searchVehicles`, `getVehicleDetails`, `compareVehicles`, `getCurrentOffers`, `getCommercialConditions`).
3. `grounding.ts` skládá pouze verified fakta, nabídky a obchodní podmínky do prompt kontextu.
4. UI připojuje zdroje přes `source-url` eventy z aplikace.

## Bezpečnost

- žádné SQL z klienta
- vstupy nástrojů validované přes Zod
- konfliktní fakta se neposílají jako jistá tvrzení
- interní report pouze s `CATALOGUE_ADMIN_TOKEN`
