export const navigation = [
  { href: "/elektromobily", label: "Elektromobily" },
  { href: "/operativni-leasing", label: "Operativní leasing" },
  { href: "/akcni-nabidky", label: "Akční nabídky" },
  { href: "/jak-vybrat", label: "Jak vybrat" },
  { href: "/nabijeni", label: "Nabíjení" },
  { href: "/blog", label: "Blog" },
  { href: "/o-nas", label: "O nás" },
  { href: "/chat", label: "AI poradce" },
] as const;

export const footerGuideLinks = [
  { href: "/jak-vybrat", label: "Výpočet průměrné spotřeby" },
  { href: "/nabijeni", label: "Elektromobil v zimě" },
  { href: "/jak-vybrat", label: "Elektromobily pro rodinu" },
  { href: "/elektromobily", label: "Elektromobily do města" },
  { href: "/operativni-leasing", label: "Elektromobily pro podnikatele" },
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
    image: "/vehicles/hyundai-inster.jpg",
    imageAlt: "Hyundai INSTER – městský elektromobil",
    tagline:
      "Stylový, elektrický a navržený pro moderní život. Kompaktní městský elektromobil s promyšleným designem.",
  },
  {
    name: "Volvo EX30",
    category: "Kompaktní SUV",
    brand: "volvo",
    model: "ex30",
    href: "/elektromobily/volvo/ex30",
    image: "/vehicles/volvo-ex30.jpg",
    imageAlt: "Volvo EX30 – kompaktní elektrické SUV",
    tagline:
      "Kompaktní elektrické SUV se severským designem, pokročilými technologiemi a důrazem na bezpečnost.",
  },
  {
    name: "Kia EV3",
    category: "Rodinný crossover",
    brand: "kia",
    model: "ev3",
    href: "/elektromobily/kia/ev3",
    image: "/vehicles/kia-ev3.jpg",
    imageAlt: "Kia EV3 – rodinný elektrický crossover",
    tagline:
      "Rodinný crossover s výrazným designem, praktickým interiérem a technologiemi pro každodenní jízdu.",
  },
] as const;

export type PresentedVehicle = (typeof presentedVehicles)[number];

export function findPresentedVehicle(brand: string, model: string) {
  return presentedVehicles.find(
    (vehicle) => vehicle.brand === brand && vehicle.model === model,
  );
}

export function getRelatedVehicles(
  brand: string,
  model: string,
  limit = 2,
): PresentedVehicle[] {
  return presentedVehicles
    .filter((vehicle) => vehicle.brand !== brand || vehicle.model !== model)
    .slice(0, limit);
}

export const brandNames = [
  "Hyundai",
  "Kia",
  "Volvo",
  "Škoda",
  "BMW",
  "Mercedes-Benz",
  "Audi",
  "Tesla",
  "Ford",
  "Peugeot",
  "Citroën",
  "Renault",
] as const;

export const blogPosts = [
  {
    slug: "nejlevnejsi-elektromobily",
    title: "Deset nejlevnějších elektromobilů v ČR: aktualizace 7/2026",
    date: "20. 7. 2026",
    image: "/blog/nejlevnejsi-elektromobily.jpg",
    imageAlt: "Přehled dostupných elektromobilů v Česku",
    excerpt:
      "Aktuální přehled nejdostupnějších elektromobilů na českém trhu a na co si dát pozor při výběru.",
  },
  {
    slug: "degradace-baterie",
    title: "Baterie ojetého elektromobilu za 5 let odejde. Opravdu?",
    date: "18. 7. 2026",
    image: "/blog/degradace-baterie.webp",
    imageAlt: "Baterie elektromobilu a její životnost",
    excerpt:
      "Jak se baterie elektromobilů chovají v praxi a proč je důležité rozlišovat mýty od reálných dat.",
  },
  {
    slug: "vymena-baterie",
    title: "Výměna baterie elektromobilu za statisíce? Čísla říkají něco jiného",
    date: "17. 7. 2026",
    image: "/blog/baterie-zaruka-servis.webp",
    imageAlt: "Servis a záruka na baterii elektromobilu",
    excerpt:
      "Co skutečně stojí výměna trakční baterie a jaké záruky nabízejí výrobci elektromobilů.",
  },
] as const;

export const homepageEntryCards = [
  {
    title: "Inzertní portál",
    description: "Objevte nabídku",
    href: "/elektromobily",
    image: "/sections/city.jpg",
    imageAlt: "Elektromobily ve městě",
  },
  {
    title: "Chci elektromobil",
    description: "Naše modely",
    href: "/elektromobily",
    image: "/vehicles/hyundai-inster.jpg",
    imageAlt: "Přehled elektromobilů Bez emisí",
  },
  {
    title: "Jak vybrat vůz",
    description: "Objevte více",
    href: "/jak-vybrat",
    image: "/sections/guide.jpg",
    imageAlt: "Průvodce výběrem elektromobilu",
  },
] as const;

export const homepageFirstTimeCards = [
  {
    title: "Nabíjení elektromobilů",
    text: "Nabíjení a dojezd elektromobilů je klíčové téma v rámci jejich provozu.",
    href: "/nabijeni",
    image: "/sections/charging.jpg",
    imageAlt: "Nabíjení elektromobilu",
  },
  {
    title: "Jak vybrat elektromobil",
    text: "Nejste si jisti, jaké auto je vhodné zrovna pro vás? Zkusíme poradit!",
    href: "/jak-vybrat",
    image: "/sections/guide.jpg",
    imageAlt: "Výběr vhodného elektromobilu",
  },
  {
    title: "Tipy a zajímavosti",
    text: "Zajímají vás témata spojená s elektromobilitou? Mrkněte na náš blog!",
    href: "/blog",
    image: "/blog/nejlevnejsi-elektromobily.jpg",
    imageAlt: "Články o elektromobilitě",
  },
] as const;

export const purchaseSteps = [
  {
    number: "1",
    title: "Napíšete nám",
    text: "Popíšete své potřeby a preference.",
  },
  {
    number: "2",
    title: "Spojíme se a probereme možnosti",
    text: "Projdeme vhodné modely a varianty.",
  },
  {
    number: "3",
    title: "Zajistíme nabídku i zkušební jízdu",
    text: "Připravíme konkrétní nabídku podle vašich požadavků.",
  },
  {
    number: "4",
    title: "Předáme vůz",
    text: "Doprovodíme vás až k převzetí vozu.",
  },
] as const;

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
      "Domov, práce i veřejná síť. Základní orientace bez složitostí.",
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
        text: "Optimální režim se liší podle baterie, trasy a možností řidiče. Poradíme vám s plánem nabíjení.",
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
        text: "Rozhoduje provozní scénář, plánované vytížení a obchodní podmínky.",
      },
    ],
  },
  "akcni-nabidky": {
    eyebrow: "Akční nabídky",
    title: "Akce na vozy skladem",
    description:
      "Aktuální akční nabídky elektromobilů s výhodnými podmínkami.",
    introTitle: "Výhodné nabídky na vybrané modely",
    intro:
      "Pravidelně připravujeme akční nabídky na vybrané elektromobily. Pro aktuální dostupnost a podmínky nás kontaktujte.",
    cards: [
      {
        title: "Skladové vozy",
        text: "Vybrané modely s rychlým dodáním. Dostupnost se liší podle konkrétního vozu.",
      },
      {
        title: "Operativní leasing",
        text: "Možnost financování formou operativního leasingu s měsíční platbou.",
      },
      {
        title: "Osobní nabídka",
        text: "Připravíme nabídku na míru podle vašich požadavků a preferencí.",
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
      "Články o výběru elektromobilu, nabíjení, dojezdu a praktických zkušenostech z provozu.",
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
      "Jsme moderní prodejní platforma zaměřená na elektromobily. Do nabídky vybíráme nejzajímavější modely top značek a zastoupení.",
    cards: [
      {
        title: "Srozumitelnost",
        text: "Vysvětlujeme parametry a pomáháme s orientací ve světě elektromobility.",
      },
      {
        title: "Ověřitelnost",
        text: "U konkrétních údajů vždy pracujeme s aktuálními informacemi od partnerů.",
      },
      {
        title: "Osobní kontakt",
        text: "Aktuální cenu, dostupnost a závazné podmínky potvrdí specialista.",
      },
    ],
  },
};

export const sitemapLinks = [
  { href: "/", label: "Úvod" },
  { href: "/elektromobily", label: "Elektromobily" },
  { href: "/elektromobily/hyundai/inster", label: "Hyundai INSTER" },
  { href: "/elektromobily/volvo/ex30", label: "Volvo EX30" },
  { href: "/elektromobily/kia/ev3", label: "Kia EV3" },
  { href: "/akcni-nabidky", label: "Akční nabídky" },
  { href: "/jak-vybrat", label: "Jak vybrat" },
  { href: "/nabijeni", label: "Nabíjení" },
  { href: "/operativni-leasing", label: "Operativní leasing" },
  { href: "/blog", label: "Blog" },
  { href: "/o-nas", label: "O nás" },
  { href: "/kontakt", label: "Kontakt" },
  { href: "/chat", label: "AI poradce" },
  { href: "/mapa-stranek", label: "Mapa stránek" },
] as const;

export const companyInfo = {
  name: "Bez emisí s.r.o.",
  address: "Bucharova 2657/12, Stodůlky, 158 00 Praha 5",
  ico: "22253726",
  registry: "C 413303",
  phone: "+420 777 786 751",
  contactPerson: "Jan Paul",
} as const;
