SRM Note Share is a small full‑stack note sharing platform built with Next.js (App Router), TypeScript, Tailwind CSS, Auth.js (NextAuth), and Prisma.

## Tech Stack

- Next.js App Router (TypeScript)
- Tailwind CSS (light theme, SRM accent `#0C4B9C`)
- Auth.js (NextAuth) with Credentials Provider
- Prisma ORM + PostgreSQL (Supabase / DATABASE_URL)
- Local file storage under `/uploads` for PDF/PPT files

## Running the app

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env` and fill in values:

- `DATABASE_URL` – Supabase PostgreSQL connection string (from Supabase project → Settings → Database → Connection string)
- `NEXTAUTH_SECRET` – long random string for Auth.js
- `GEMINI_API_KEY` – Google Gemini API Key for AI Summarization and Chat (Get it from Google AI Studio)

3. Set up your database schema (optional in dev until you connect a real DB):

```bash
npx prisma migrate dev --name init
```

4. Start the dev server:

```bash
npm run dev
```

Then open http://localhost:3000.

## Features

- Email + password auth (only `@srmist.edu.in` emails allowed)
- Dashboard with note cards (title, subject, semester) and filters
- Upload page for PDF/PPT files (stored locally, path saved in DB)
- Simple, clean university‑style UI with a navbar + sidebar

## Key files

- Prisma schema: `prisma/schema.prisma`
- Auth configuration: `lib/auth.ts` and `app/api/auth/[...nextauth]/route.ts`
- Notes API: `app/api/notes/route.ts`
- Upload API: `app/api/upload/route.ts`
- Register API: `app/api/register/route.ts`
- Pages: `app/login/page.tsx`, `app/register/page.tsx`, `app/dashboard/page.tsx`, `app/upload/page.tsx`
