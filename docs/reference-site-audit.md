# Audit veřejného webu Bez emisí

Audit proběhl 24. 7. 2026 pouze nad veřejně dostupnými stránkami `bezemisi.cz`.
Nebyly odeslány formuláře, otevřena administrace ani použita neveřejná API.

## Prohlédnuté URL

- `https://www.bezemisi.cz/`
- `https://www.bezemisi.cz/elektromobily`
- `https://www.bezemisi.cz/elektromobily/hyundai/inster`
- `https://www.bezemisi.cz/elektromobily/volvo/ex30`
- `https://www.bezemisi.cz/elektromobily/kia/ev3`
- `https://www.bezemisi.cz/elektromobily/bmw` (a další značkové rozcestníky)
- `https://www.bezemisi.cz/akcni-nabidky`
- `https://www.bezemisi.cz/jak-vybrat`
- `https://www.bezemisi.cz/nabijeni`
- `https://www.bezemisi.cz/operativni-leasing`
- `https://www.bezemisi.cz/blog`
- `https://www.bezemisi.cz/o-nas`
- `https://www.bezemisi.cz/kontakt`
- `https://www.bezemisi.cz/mapa-stranek`
- `auto.bezemisi.cz` — pouze vizuálně ověřený veřejný inzertní portál, bez přihlášení

## Navigační struktura

Desktopová navigace obsahuje Elektromobily, Operativní leasing, Akční nabídky,
Jak vybrat, Blog, O nás a výrazný Kontakt. Hlavička je na začátku průhledná,
při posunu získá bílé pozadí. Mobilní navigace se pod přibližně 720 px mění na
vysouvací tmavý panel.

## Objevená struktura tras

| Vzor | Poznámka |
|------|----------|
| `/` | Homepage |
| `/elektromobily` | Katalog / rozcestník |
| `/elektromobily/{znacka}` | Značková stránka |
| `/elektromobily/{znacka}/{model}` | Detail modelu |
| `/akcni-nabidky` | Kampaně |
| `/jak-vybrat` | Průvodce výběrem |
| `/nabijeni` | Nabíjení |
| `/operativni-leasing` | Leasing |
| `/blog`, `/blog/{slug}` | Editorial |
| `/o-nas`, `/kontakt` | Firma a kontakt |
| `/mapa-stranek` | Sitemap |

## Opakovaně použitelné vizuální vzory

- fixní hlavička, desktopová a mobilní navigace
- textové logo a výrazná kontaktní CTA
- dvousloupcový hero s vozem nebo tematickou fotografií
- modré a zelené CTA, sekundární obrysové tlačítko
- nadpis sekce s krátkým úvodem
- modelová karta s obrázkem, názvem, cenou, dojezdem a CTA
- obsahová karta pro článek, službu nebo scénář použití
- tmavě fialový konverzní pás
- newsletter, vícesloupcová patička a tmavší právní lišta

## Typografie

- viditelným písmem je převážně Outfit
- nadpisy mají lehčí řez a velké rozměry
- desktopové H1 dosahuje přibližně 70 px, mobilní přibližně 50 px

## Barvy

- hlavní tmavě fialová přibližně `#1f0556`, tmavší `#15043d`
- elektrická modrá přibližně `#0043ff`, hover přibližně `#0037c4`
- jasná zelená přibližně `#00ff7f`
- světlá levandulová `#f0f0ff`, téměř bílá `#fbfbff`

## Responzivní chování

Na širokých obrazovkách jsou hero bloky dělené na text a obraz, modely ve třech
sloupcích a patička ve skupinách. Na telefonu se vše skládá do jednoho sloupce,
horizontální odsazení je přibližně 24 px, nadpisy se zmenšují a navigace se
otevírá jako panel. Modelové obrázky drží poměr stran 16:9.

## Struktura karty vozidla

Obvykle: název, krátké zařazení, „Cena od“, informace o DPH, „Dojezd až“,
někdy provozní náklad a odkaz na detail. Referenční web obsahuje i rozpory mezi
cenami a zástupné hodnoty — tyto údaje prototyp nepřebírá jako ověřená fakta.

## Struktura detailu vozidla

Hero s modelem, parametry, CTA ke kontaktu / nabídce a vysvětlující obsah.
Prototyp používá stejný URL vzor `/elektromobily/{brand}/{model}` pro tři
prezentované modely, ale bez vymyšlených čísel.

## Nákupní / konverzní obsah

Text je přátelský, používá otázky a kratší výzvy. Modrá obvykle vede k průzkumu
obsahu, zelená ke kontaktu. Nový prototyp jako hlavní akci používá
„Zeptat se AI poradce“.

## Aktiva a obsah, které nebyly převzaty

- produkční fotografie vozů
- portréty týmu
- výrobní logotypy třetích stran
- článkové fotografie
- analytika, tracking pixely, cookies skripty
- CMS implementace a formulářové endpointy

Lokálně stažen pouze vlastní favicon Bez emisí do `public/brand/`. Hero a karty
používají lokální SVG placeholder `public/ev-placeholder.svg`.

## Rozdíly implementace oproti referenci

- moderní reprodukce vizuálního jazyka, ne kopie CMS šablony
- katalog neuvádí ceny, dojezdy ani dostupnost (katalog není připojen)
- kontaktní a newsletterové formuláře jsou vizuální a neaktivní
- blog používá krátké původní anotace
- značkové redakční historie nejsou naplněny
- sticky bílá hlavička místo transparentní→bílé při scrollu
- hero používá lokální ilustraci místo full-bleed produkční fotografie
- mobilní menu je překryvný panel
- novým prvkem je AI chat na `/chat`
