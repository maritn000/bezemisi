# Runbook katalogu

## 1. Kontrola cílové databáze

```bash
npx vercel env pull .env.local
npm run db:inspect
```

Ověřte:

- správný `databaseUrlSourceKey` (typicky `POSTGRES_URL` nebo `DATABASE_URL`)
- host a název databáze odpovídají projektu Bez emisí
- existují foundation tabulky

## 2. Migrace

```bash
npm run db:generate   # pouze pokud se mění schéma
npm run db:migrate
```

Migrace `drizzle/0001_woozy_expediter.sql` je nedestruktivní (žádné `DROP TABLE`).

## 3. Import katalogu

```bash
npm run catalogue:discover
npm run catalogue:ingest -- --dry-run   # volitelně
npm run catalogue:ingest
npm run catalogue:validate
npm run catalogue:report
```

## 4. Preview ověření

Po deployi Preview:

- `/api/health`
- `/elektromobily`
- `/elektromobily/hyundai/inster`
- `/chat`
- smoke testy A–F z task specifikace

## 5. Production rollout

Production migraci a ingest spouštějte až po úspěšném Preview testu a explicitním schválení.

Očekávané po prvním ingestu:

- ~12 značek
- 23 modelů
- 7 variant (Inster, EX30, EV3)
- desítky verified faktů
- 3–5 current list-price nabídek
- 1 commercial condition (purchase_process)

## 6. Interní report

```bash
curl -H "Authorization: Bearer $CATALOGUE_ADMIN_TOKEN" \
  https://<preview-host>/api/internal/catalogue-report
```

## 7. Aktualizace

Import je idempotentní. Při změně veřejných stránek Bez emisí:

1. aktualizujte `seed-data.ts` nebo parser
2. spusťte `npm run catalogue:ingest`
3. zkontrolujte `catalogue_ingestion_issues`
