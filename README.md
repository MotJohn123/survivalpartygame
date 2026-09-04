# Survival Party

Mobilní víkendová týmová hra v češtině. Aplikace používá Next.js, Prisma 7, PostgreSQL/Neon, Vercel Blob a Web Push.

## 1. Lokální spuštění

Požadavky:

- Node.js 20+
- PostgreSQL databáze, ideálně Neon
- npm

Nainstaluj závislosti:

```powershell
npm install
```

Vytvoř soubor `.env` podle `.env.example`:

```env
DATABASE_URL="postgresql://...pooled..."
DATABASE_URL_UNPOOLED="postgresql://...direct..."
AUTH_SECRET="dlouhy-nahodny-retezec"
ADMIN_PASSWORD="heslo-pro-spravce"
BLOB_READ_WRITE_TOKEN=""
NEXT_PUBLIC_VAPID_PUBLIC_KEY=""
VAPID_PUBLIC_KEY=""
VAPID_PRIVATE_KEY=""
VAPID_SUBJECT="mailto:organizer@example.com"
```

`DATABASE_URL` je pooled URL pro běžící aplikaci. `DATABASE_URL_UNPOOLED` je direct URL pro Prisma migrace.

Vytvoř databázovou migraci a Prisma klienta:

```powershell
npx prisma migrate dev --name init
npm run db:generate
```

Naplnění testovacími týmy, hráči a úkoly:

```powershell
npm run db:seed
```

Spuštění:

```powershell
npm run dev
```

Otevři [http://localhost:3000](http://localhost:3000). Administrace je na `/admin`. Výchozí lokální heslo je `survivalparty`, pokud není nastaveno `ADMIN_PASSWORD`.

## 2. Vercel a Neon

1. Nahraj projekt do GitHubu.
2. Importuj repository na Vercel.
3. Ve Vercel projektu otevři **Storage → Connect Database → Neon**.
4. Nech vložit `DATABASE_URL` a `DATABASE_URL_UNPOOLED` do Vercel Environment Variables.
5. Přidej Vercel Blob a získej `BLOB_READ_WRITE_TOKEN`.
6. Nastav `AUTH_SECRET` a vlastní `ADMIN_PASSWORD`.
7. Nastav VAPID proměnné pro push notifikace.
8. Deployni projekt.

Po připojení databáze spusť migraci proti produkční databázi:

```powershell
npx prisma migrate deploy
```

Seed používej pouze tehdy, pokud chceš do produkce vložit testovací data:

```powershell
npm run db:seed
```

## 3. Push notifikace

Vygeneruj VAPID klíče jednou lokálně:

```powershell
npx web-push generate-vapid-keys
```

Výstup vlož do:

- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT`

Hráč musí otevřít `/game`, povolit oznámení a ideálně aplikaci nainstalovat na domovskou obrazovku telefonu.

## 4. Kontrola před akcí

```powershell
npm run lint
$env:DATABASE_URL="postgresql://...pooled..."
$env:DATABASE_URL_UNPOOLED="postgresql://...direct..."
npx prisma validate
npm run build
```

Rychlý manuální průchod:

1. Přihlášení hráče jménem.
2. Vytvoření úkolu v `/admin`.
3. Ověření kódu i QR skenu na `/game`.
4. Kontrola připsaných bodů a historie.
5. Přiřazení hráče do týmu.
6. Spuštění hlasování a sázkové rundy.
7. Vyhodnocení sázky a kontrola leaderboardu.
8. Povolení push notifikací.

## Dostupné příkazy

```powershell
npm run dev
npm run build
npm run lint
npm run db:generate
npm run db:seed
```This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
