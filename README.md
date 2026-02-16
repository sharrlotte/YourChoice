# Next.js Full Setup Starter

A ready-to-go starter with:

- **Next.js (latest stable)** with App Router + TypeScript
- **Tailwind CSS**
- **Prisma**
- **Google Auth** via NextAuth/Auth.js + Prisma Adapter
- **Environment variable setup**
- **shadcn/ui** base configuration + Button component
- **React Query** with Devtools

## 1) Install dependencies

```bash
npm install
```

## 2) Configure environment

Copy `.env.example` into `.env` and fill values:

```bash
cp .env.example .env
```

Generate a secret:

```bash
openssl rand -base64 32
```

## 3) Prisma setup

```bash
npm run prisma:generate
npm run prisma:migrate -- --name init
```

## 4) Start app

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## 5) Google OAuth callback URL

In your Google Cloud OAuth app, add:

```text
http://localhost:3000/api/auth/callback/google
```
