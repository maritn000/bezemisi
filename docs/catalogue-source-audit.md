# Audit zdrojů katalogu Bez emisí

Audit proběhl 24. 7. 2026 nad veřejnými stránkami `https://www.bezemisi.cz/`.

## Objevené URL

### Katalog a modely

- `https://www.bezemisi.cz/elektromobily`
- `https://www.bezemisi.cz/elektromobily/hyundai/inster`
- `https://www.bezemisi.cz/elektromobily/volvo/ex30`
- `https://www.bezemisi.cz/elektromobily/kia/ev3`
- `https://www.bezemisi.cz/elektromobily/bmw/ix1`
- `https://www.bezemisi.cz/elektromobily/opel/astra-electric`
- `https://www.bezemisi.cz/elektromobily/peugeot/e-3008`
- `https://www.bezemisi.cz/elektromobily/skoda/elroq`
- `https://www.bezemisi.cz/elektromobily/skoda/enyaq`

### Obchodní a informační stránky

- `https://www.bezemisi.cz/akcni-nabidky`
- `https://www.bezemisi.cz/operativni-leasing`
- `https://www.bezemisi.cz/kontakt`
- `https://www.bezemisi.cz/mapa-stranek`

## Modely na veřejném katalogu `/elektromobily`

Celkem 23 modelů včetně:

- BMW iX1
- Hyundai KONA Electric, INSTER, IONIQ 2, IONIQ 5
- Opel Astra Electric, Grandland Electric
- Renault 5
- Peugeot E-3008
- Volvo EX30, EX60
- Škoda Peaq, Epiq, Elroq, Nová Škoda Enyaq
- Kia EV2, EV3, EV4, EV5
- Volkswagen ID. Polo
- CUPRA Raval
- Ford Puma Gen-E, Capri

## Spolehlivě identifikované varianty (1. fáze)

| Model | Varianty |
|-------|----------|
| Hyundai INSTER | ECO 42 kWh RWD, POWER 49 kWh RWD |
| Volvo EX30 | SR 51 kWh RWD, ER 69 kWh RWD, Twin Motor Performance 69 kWh AWD |
| Kia EV3 | Standard 58,3 kWh RWD, Long Range 81,4 kWh RWD |

## Nejednoznačné / chybějící varianty

U zbývajících modelů z veřejného katalogu nebyla na detailní stránce spolehlivě oddělena baterie, pohon, trim ani modelový rok. Tyto modely jsou uloženy jako modelové záznamy a označeny issue type `variant_ambiguity`.

## Parametry dostupné na Bez emisí

- marketingový „dojezd až“
- cena od (u části modelů)
- u detailních stránek: baterie, výkon, rozměry, kufr, doba DC nabíjení, proces nákupu

## Parametry chybějící na Bez emisí

- přesné WLTP tabulky pro všechny varianty
- jednoznačné oddělení všech trimů a baterií
- aktuální skladová dostupnost
- závazné obchodní podmínky financování a leasingu

## Oficiální výrobní zdroje použité pro doplnění

- Hyundai INSTER: `https://www.hyundai.com/cz/cs/modely/inster.html`
- Volvo EX30: `https://www.volvocars.com/cz/cars/ex30-electric/`

Primárním zdrojem zůstávají aktuální stránky Bez emisí.

## Konflikty

- Marketingový „dojezd až“ na `/elektromobily` může být vyšší než WLTP hodnota na detailu konkrétní varianty. Do katalogu se ukládají pouze hodnoty vázané na konkrétní variantu se zdrojem.
- Na stránce INSTER se vyskytují různé dojezdy pro trimy; do katalogu jsou uloženy pouze hodnoty svázané s bateriovou variantou.

## Stránky nebezpečné pro automatické použití

- blogové články (sekundární, ne primární pro specifikace)
- formuláře a lead endpointy
- `auto.bezemisi.cz` bez ověřené mapovací logiky na varianty

## Položky pro manuální review

- doplnění variant pro zbývajících 20 modelů
- ověření skladových nabídek z `auto.bezemisi.cz`
- doplnění obchodních podmínek financování, leasingu a dodání
