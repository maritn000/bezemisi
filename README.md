# Bez emisí AI

Nezávislý průvodce světem elektromobility. Projekt připravuje AI asistenta, který pomůže s orientací v elektromobilech, nabíjení, provozních nákladech a každodenním používání.

**Aktuální fáze:** produktový web a bezpečný základ AI chatu; ověřený katalog vozidel zatím není připojen

## Architektura

- **Next.js 16** – aplikační framework (App Router)
- **Vercel** – hosting, CI/CD a správa prostředí
- **Neon PostgreSQL** – serverless databáze připojená přes Vercel Marketplace
- **Drizzle ORM** – schéma, migrace a typově bezpečný přístup k databázi
- **Zod** – validace serverového prostředí
- **Vercel AI SDK + OpenAI provider** – streamovaný chat na serveru

Aplikace používá Neon HTTP serverless driver (`@neondatabase/serverless`) pro připojení k databázi. Veškerý přístup k databázi je pouze na serveru (`server-only`).

## Prostředí a proměnné

Připojovací údaje k databázi jsou uloženy ve **Vercel Environment Variables**, ne v repozitáři.

Vercel Marketplace integrace může proměnnou pojmenovat například `DATABASE_URL`, `POSTGRES_URL` nebo jiným prefixem. Serverový modul `src/env.ts` automaticky detekuje dostupný PostgreSQL connection string a interně ho normalizuje.

Pro lokální vývoj stáhněte Development proměnné z Vercel:

```bash
npx vercel link
npx vercel env pull .env.local
```

Šablona bez tajných hodnot je v souboru `.env.example`.

Pro AI chat je potřeba serverová proměnná `OPENAI_API_KEY`. Volitelný
`OPENAI_CHAT_MODEL` mění model pouze na serveru. Nepoužívejte variantu
`NEXT_PUBLIC_OPENAI_API_KEY`.

Persistenci chatu lze zapnout pouze explicitně pomocí
`CHAT_PERSISTENCE_ENABLED=true`, a to až po ověření migrací a cílové databázové
větve. Bez této kombinace chat bezpečně funguje bez zápisu.

### Development, Preview a Production

Neon integrace typicky vytváří **oddělené databázové větve** pro jednotlivá prostředí:

| Prostředí | Účel |
|-----------|------|
| **Development** | Lokální vývoj a testování migrací |
| **Preview** | Vercel preview deploye z pull requestů |
| **Production** | Produkční provoz |

**Migrace v této fázi cílí pouze na Development databázi.** Preview a Production migrujte až po ověření SQL a s vědomím, na kterou Neon větev dané prostředí ukazuje.

### Bezpečnost

- Nikdy necommitujte `.env.local`, `.vercel` ani skutečné přihlašovací údaje.
- Connection string k databázi nesmí být v klientském kódu ani v API odpovědích.
- Produkční migrace provádějte jen po kontrole, že cílová proměnná prostředí ukazuje na správnou Neon větev.

## Databázové tabulky (tato fáze)

| Tabulka | Účel |
|---------|------|
| `app_health_checks` | Ověření zápisu a čtení z databáze |
| `sources` | Budoucí znalostní zdroje pro chatbot |
| `conversations` | Budoucí konverzace chatbotu |
| `messages` | Budoucí zprávy v konverzacích |

## Migrace

```bash
# Vygenerovat SQL migraci ze schématu
npm run db:generate

# Aplikovat migrace na připojenou Development databázi
npm run db:migrate

# Otevřít Drizzle Studio
npm run db:studio
```

Migrace jsou uloženy ve složce `drizzle/`. Před aplikací vždy zkontrolujte vygenerované SQL.

### Postup pro Production

1. Ověřte, že Production proměnná prostředí ukazuje na správnou Neon větev.
2. Zkontrolujte SQL migrace v repozitáři.
3. Aplikujte migrace v kontrolovaném okamžiku (např. přes CI/CD nebo ručně s Production credentials).
4. Ověřte endpoint `/api/health` na produkční doméně.

## Health endpoint

`GET /api/health` vrací bezpečný JSON stav aplikace:

```json
{
  "application": "ok",
  "database": "connected",
  "openai": "configured",
  "timestamp": "2026-07-24T12:00:00.000Z"
}
```

Endpoint provádí pouze **read-only** dotaz (`SELECT 1`). Nezapisuje záznamy do `app_health_checks` při každém požadavku.
Stav OpenAI pouze říká, zda je klíč nastavený; klíč neověřuje voláním a nikdy
jej nevrací.

## Web a AI chat

Veřejné prezentační trasy reprodukují vizuální jazyk Bez emisí pomocí původního
kódu, neutrálního textu a lokální ilustrační grafiky. Produkční obrázky nejsou
hotlinkovány. Podrobný audit je v `docs/reference-site-audit.md`.

Chat na `/chat`:

- přijímá pouze validované uživatelské a asistentské textové zprávy,
- omezuje délku zprávy i historii,
- nepřijímá systémový prompt ani model z klienta,
- streamuje odpověď přes AI SDK,
- nepoužívá webové hledání ani nástroje,
- má oddělené adaptéry pro budoucí data o vozech a obchodních podmínkách,
- při chybějících datech nesmí konkrétní hodnoty odhadovat.

Současný rate limiter je pouze procesní vývojová ochrana. V serverless provozu
není globální ani trvalý; před produkčním provozem jej nahraďte distribuovaným
úložištěm a zachovejte rozhraní `ChatRateLimiter`.

Jednorázový test zápisu a čtení spusťte skriptem:

```bash
npm run db:verify
```

## Lokální instalace

```bash
npm install
```

## Vývoj

```bash
npm run dev
```

Aplikace běží na [http://localhost:3000](http://localhost:3000).

## Kontrola kódu

```bash
npm run lint
npm run typecheck
npm run build
```

## Další plánovaná fáze

- Schéma znalostní báze (články, dokumenty)
- Ingest pipeline pro obsah
- Vektorové embeddings pro RAG
- Chatbot s retrieval-augmented generation
- Doporučování vozidel
