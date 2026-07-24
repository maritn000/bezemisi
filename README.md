# Bez emisí AI

Nezávislý průvodce světem elektromobility. Projekt připravuje AI asistenta, který pomůže s orientací v elektromobilech, nabíjení, provozních nákladech a každodenním používání.

**Aktuální fáze:** databázový základ (Neon PostgreSQL + Drizzle ORM)

## Architektura

- **Next.js 16** – aplikační framework (App Router)
- **Vercel** – hosting, CI/CD a správa prostředí
- **Neon PostgreSQL** – serverless databáze připojená přes Vercel Marketplace
- **Drizzle ORM** – schéma, migrace a typově bezpečný přístup k databázi
- **Zod** – validace serverového prostředí

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
  "status": "ok",
  "application": "ok",
  "database": "connected",
  "timestamp": "2026-07-24T12:00:00.000Z"
}
```

Endpoint provádí pouze **read-only** dotaz (`SELECT 1`). Nezapisuje záznamy do `app_health_checks` při každém požadavku.

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
