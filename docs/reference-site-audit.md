# Audit veřejného webu Bez emisí

Audit proběhl 24. 7. 2026 pouze nad veřejně dostupnými stránkami `bezemisi.cz`. Nebyly odeslány formuláře, otevřena administrace ani použita neveřejná API.

## Prohlédnuté stránky

- `/` – úvod, nabídka služeb, oblíbené modely, články, značky a kontakt
- `/elektromobily` – katalog modelů a rozcestník podle značek a způsobu využití
- `/elektromobily/bmw`, `/opel`, `/peugeot`, `/volvo`, `/skoda`, `/kia`, `/hyundai`, `/renault` – dostupné značkové šablony
- `/nabijeni` – domácí a veřejné nabíjení
- `/operativni-leasing` – vysvětlení služby a nabídkové karty
- `/akcni-nabidky` – přehled kampaní
- `/jak-vybrat` – veřejný první krok průvodce výběrem
- `/blog` – přehled článků
- `/o-nas` – představení firmy a kontaktních osob
- `/kontakt` – kontaktní formulář
- `/mapa-stranek` – veřejná mapa webu
- `auto.bezemisi.cz` – samostatný veřejný inzertní portál; pouze vizuálně ověřený, bez přihlášení

## Informační a navigační struktura

Desktopová navigace obsahuje Elektromobily, Nabídku vozidel (externí portál), Operativní leasing, Akční nabídky, Jak vybrat, Blog, O nás a výrazný Kontakt. Hlavička je na začátku průhledná, při posunu získá bílé pozadí. Mobilní navigace se pod přibližně 720 px mění na vysouvací tmavý panel.

Domovská stránka vede návštěvníka přes hero, tři hlavní cesty, argumenty služby, nabídku vozidel, edukaci, populární modely, články, značky, představení týmu a kontaktní formulář. Prodejní stránky opakují lead formulář a newsletter před patičkou.

## Opakovaně použitelné komponenty

- fixní hlavička, desktopová a mobilní navigace
- textové logo a výrazná kontaktní CTA
- dvousloupcový hero s vozem nebo tematickou fotografií
- modré a zelené CTA, sekundární obrysové tlačítko
- nadpis sekce s krátkým úvodem
- modelová karta s obrázkem, názvem, cenou, dojezdem a CTA
- obsahová karta pro článek, službu nebo scénář použití
- střídavé obrazové a textové bloky
- tmavě fialový konverzní pás
- newsletter, vícesloupcová patička a tmavší právní lišta

## Vizuální systém

- hlavní tmavě fialová přibližně `#1f0556`, tmavší `#15043d`
- elektrická modrá přibližně `#0043ff`, hover přibližně `#0037c4`
- jasná zelená přibližně `#00ff7f`
- světlá levandulová `#f0f0ff`, téměř bílá `#fbfbff`
- viditelným písmem je převážně Outfit; nadpisy mají lehčí řez a velké rozměry
- desktopové H1 dosahuje přibližně 70 px, mobilní přibližně 50 px
- obsah má maximální šířku přibližně 1360 px
- tlačítka mají výšku okolo 53 px, silný text a poloměr přibližně 10 px
- karty a formulářové panely používají poloměr okolo 20 px a jen jemné stíny
- sekce střídají bílou, světlou levandulovou a tmavě fialovou plochu

## Responzivní chování

Na širokých obrazovkách jsou hero bloky dělené na text a obraz, modely ve třech sloupcích a patička ve skupinách. Na telefonu se vše skládá do jednoho sloupce, horizontální odsazení je přibližně 24 px, nadpisy se zmenšují a navigace se otevírá jako panel. Modelové obrázky drží poměr stran 16:9. Ovládací prvky zůstávají dostatečně vysoké pro dotyk.

## Vzory obsahu o vozidlech

Katalogová karta obvykle uvádí název, krátké zařazení, „Cena od“, informaci o DPH, „Dojezd až“, někdy provozní náklad a odkaz na detail. Značkové stránky kombinují hero, historii značky, fakta, modely, tři kroky služby a kontaktní formulář. Referenční web však obsahuje i rozpory mezi cenami, zástupné hodnoty `XXX`, chybné značkové nadpisy a neúplné modelové bloky. Tyto údaje proto prototyp nepřebírá jako ověřená fakta.

## Aktuální CTA a tón

Text je přátelský, používá otázky a kratší výzvy jako „Chci“, „Objevte“, „Více o modelu“ a „Kontaktujte nás“. Modrá obvykle vede k průzkumu obsahu, zelená ke kontaktu nebo hlavní konverzi. Nový prototyp tento princip zachovává a jako hlavní novou akci používá „Zeptat se AI poradce“.

## Aktiva a obsah, které nebyly převzaty

Do aplikace nejsou hotlinkovány ani kopírovány produkční fotografie vozů, portréty týmu, výrobní logotypy, ilustrace, článkové fotografie, analytika, formuláře, cookies, CMS skripty ani jejich identifikátory. Práva ke konkrétním produkčním souborům nebyla v repozitáři doložena. Prototyp proto používá vlastní lokální abstraktní SVG ilustrace a neutrální český text. Externí inzertní portál je pouze odkaz.

## Rozdíly implementace

- Jde o čistou moderní reprodukci vizuálního jazyka, ne kopii CMS šablony.
- Katalog zatím neuvádí ceny, dojezdy ani dostupnost, protože není připojena ověřená znalostní báze.
- Kontaktní, newsletterové a nákupní akce jsou zřetelně označené jako neaktivní prototyp.
- Blog používá krátké původní anotace, nikoli zkopírované články.
- Značkové detailní trasy nejsou v této fázi naplněny redakční historií ani neověřenými fakty.
- Novým hlavním prvkem je bezpečně omezený AI chat na samostatné stránce.
- Mobilní menu je překryvný panel; nekopíruje přesný produkční posun celé stránky.
