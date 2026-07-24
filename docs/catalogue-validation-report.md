# Report validace katalogu

> Tento soubor se generuje po běhu `npm run catalogue:report` na prostředí s napojenou databází.

## Stav v CI agentovi

Validace v cloud agentovi nebyla spuštěna proti produkční ani preview databázi, protože v prostředí nebyl dostupný `DATABASE_URL` / `POSTGRES_URL`.

## Očekávaný výsledek po prvním ingestu na Preview

| Metrika | Očekávání |
|---------|-----------|
| Značky | ≥ 10 |
| Modely | 23 |
| Varianty | 7 |
| Verified fakta | ≥ 30 |
| Conflicting fakta | 0 (pokud nebyl záměrný konflikt) |
| Current offers | 3–5 |
| Commercial conditions | ≥ 1 |

## Chybějící důležitá pole

- většina modelů bez identifikované varianty
- skladová dostupnost
- financing / operating lease conditions

## Manuální review

- doplnit varianty pro zbývající modely
- ověřit skladové nabídky
- doplnit obchodní podmínky mimo purchase_process

## Smoke testy (po ingestu)

| Test | Dotaz | Očekávání |
|------|-------|-----------|
| A | Které auto má dojezd alespoň 450 km? | pouze varianty s verified `wltp_range_km >= 450` |
| B | Porovnej Kia EV3 a Volvo EX30. | srovnání nebo upřesnění variant |
| C | Kolik stojí Hyundai Inster? | current verified list price nebo chybějící cena |
| D | Jaký elektromobil je vhodný pro rodinu se dvěma dětmi? | doporučení z verified faktů + doptání |
| E | Jak probíhá nákup přes Bez emisí? | stored commercial condition |
| F | Je některý vůz nyní skladem? | pouze current offers s observation date |
