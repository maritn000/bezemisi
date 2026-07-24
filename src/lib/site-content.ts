export const navigation = [
  { href: "/elektromobily", label: "Elektromobily" },
  { href: "/operativni-leasing", label: "Operativní leasing" },
  { href: "/nabijeni", label: "Nabíjení" },
  { href: "/jak-vybrat", label: "Jak vybrat" },
  { href: "/akcni-nabidky", label: "Akční nabídky" },
  { href: "/blog", label: "Blog" },
  { href: "/o-nas", label: "O nás" },
  { href: "/chat", label: "AI poradce" },
] as const;

export const exampleQuestions = [
  "Které auto má dojezd alespoň 450 km?",
  "Jaký elektromobil je vhodný pro rodinu?",
  "Který vůz lze nabíjet nejrychleji?",
  "Jak probíhá nákup přes Bez emisí?",
] as const;

export const presentedVehicles = [
  {
    name: "Hyundai INSTER",
    category: "Městský elektromobil",
    brand: "hyundai",
    model: "inster",
    href: "/elektromobily/hyundai/inster",
  },
  {
    name: "Volvo EX30",
    category: "Kompaktní SUV",
    brand: "volvo",
    model: "ex30",
    href: "/elektromobily/volvo/ex30",
  },
  {
    name: "Kia EV3",
    category: "Rodinný crossover",
    brand: "kia",
    model: "ev3",
    href: "/elektromobily/kia/ev3",
  },
] as const;

export type PresentedVehicle = (typeof presentedVehicles)[number];

export function findPresentedVehicle(brand: string, model: string) {
  return presentedVehicles.find(
    (vehicle) => vehicle.brand === brand && vehicle.model === model,
  );
}

export type EditorialPage = {
  eyebrow: string;
  title: string;
  description: string;
  introTitle: string;
  intro: string;
  cards: Array<{ title: string; text: string }>;
};

export const editorialPages: Record<string, EditorialPage> = {
  nabijeni: {
    eyebrow: "Nabíjení",
    title: "Jak a kde nabíjet svoje elektroauto",
    description:
      "Domov, práce i veřejná síť. Základní orientace bez složitostí a bez neověřených cenových slibů.",
    introTitle: "Bez energie to nejede. Se správným plánem je to ale snadné.",
    intro:
      "Nejvhodnější způsob nabíjení závisí na tom, kde parkujete, kolik denně jezdíte a jak často vyrážíte na delší cesty. Pomůžeme vám nejprve pojmenovat potřeby.",
    cards: [
      {
        title: "Nabíjení doma",
        text: "Pravidelné nabíjení během stání bývá nejpohodlnější. Konkrétní instalaci musí posoudit odborník.",
      },
      {
        title: "Veřejné nabíjení",
        text: "Pro cestování je důležitá dostupnost sítě, výkon konkrétního vozu i plánovaná délka zastávky.",
      },
      {
        title: "Nabíjecí návyky",
        text: "Optimální režim se liší podle baterie, trasy a možností řidiče. Ověřená data doplní připravovaný katalog.",
      },
    ],
  },
  "jak-vybrat": {
    eyebrow: "Průvodce výběrem",
    title: "Elektromobil podle vašeho života",
    description:
      "Začněte tím, jak skutečně jezdíte. Teprve potom dává smysl porovnávat konkrétní vozy.",
    introTitle: "Dobrý výběr začíná správnými otázkami",
    intro:
      "Denní trasa, možnost nabíjení, počet cestujících, zavazadla a rozpočet jsou důležitější než jeden izolovaný parametr.",
    cards: [
      {
        title: "Do města",
        text: "Zvažte rozměry, snadné parkování a reálnou možnost pravidelného nabíjení.",
      },
      {
        title: "Pro rodinu",
        text: "Promyslete prostor, typické delší cesty, dětské sedačky a zavazadla.",
      },
      {
        title: "Pro podnikání",
        text: "Rozhoduje provozní scénář, plánované vytížení a ověřené obchodní podmínky.",
      },
    ],
  },
  "akcni-nabidky": {
    eyebrow: "Akční nabídky",
    title: "Aktuální možnosti bez zavádějících slibů",
    description:
      "Konkrétní kampaně zde zobrazíme až po napojení ověřených obchodních dat.",
    introTitle: "Nabídka musí být aktuální a doložená",
    intro:
      "Ceny, skladová dostupnost i podmínky financování se mění. Prototyp proto nepublikuje převzaté nebo odhadované akce.",
    cards: [
      {
        title: "Skladové vozy",
        text: "Budoucí přehled konkrétních vozů s časem posledního ověření.",
      },
      {
        title: "Operativní leasing",
        text: "Podmínky budou zobrazeny pouze s ověřenou měsíční platbou a rozsahem služby.",
      },
      {
        title: "Osobní nabídka",
        text: "Závaznou dostupnost a cenu vždy potvrdí specialista Bez emisí.",
      },
    ],
  },
  blog: {
    eyebrow: "Blog",
    title: "Elektromobilita prakticky",
    description:
      "Stručné průvodce pro výběr, nabíjení a každodenní používání.",
    introTitle: "Témata, která pomáhají při rozhodování",
    intro:
      "V této fázi používáme původní anotace. Produkční články ani jejich fotografie nejsou do prototypu kopírovány.",
    cards: [
      {
        title: "Co si ujasnit před výběrem",
        text: "Pět oblastí, které je dobré znát dřív, než začnete porovnávat modely.",
      },
      {
        title: "Nabíjení na delší cestě",
        text: "Jak přemýšlet o trase, zastávkách a rezervě bez univerzálních slibů.",
      },
      {
        title: "Dojezd: jak číst čísla",
        text: "Proč je důležité odlišit metodiku WLTP od odhadu v reálných podmínkách.",
      },
    ],
  },
  "o-nas": {
    eyebrow: "O nás",
    title: "Elektromobilita srozumitelně a věcně",
    description:
      "Bez emisí pomáhá lidem orientovat se ve výběru elektrického vozu a cestě k nabídce.",
    introTitle: "Nejdřív potřeby, potom konkrétní vůz",
    intro:
      "Prototyp rozvíjí veřejnou prezentaci o bezpečného AI poradce. Nenahrazuje osobní potvrzení aktuální nabídky.",
    cards: [
      {
        title: "Srozumitelnost",
        text: "Oddělujeme ověřené parametry od doporučení a vždy říkáme, co chybí.",
      },
      {
        title: "Ověřitelnost",
        text: "Fakta o vozech budou pocházet pouze z připojeného katalogu se zdroji.",
      },
      {
        title: "Osobní kontakt",
        text: "Aktuální cenu, dostupnost a závazné podmínky potvrdí člověk.",
      },
    ],
  },
};
