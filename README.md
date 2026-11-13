# Stash: every link worth keeping

A polished, animated link library for videos, docs, articles and anything else on the web.
Built with Next.js 16, Tailwind CSS 4, Motion and Supabase (auth, Postgres and realtime sync).

## Features

- **Paste to save.** Paste a link anywhere on the page (Ctrl/⌘ V) or press **N**. Title, thumbnail, site icon and type (video, doc, article, image or other) are fetched automatically.
- **Collections, tags, favorites, notes** and a **watched/read** checkmark.
- **Instant search** across titles, URLs, notes, tags and sites (press **Ctrl/⌘ K** or **/**). Sort by date, title or website. Grid or list view.
- **Cloud sync with accounts.** Email + password, magic links and optional Google sign-in. Changes appear live on your other devices.
- **Import/export.** Import a JSON export or a browser bookmarks `.html` file from Chrome, Safari, Firefox or Edge.
- **Works on any device.** Mobile-first layout, a swipe-to-close drawer, draggable bottom sheets and a floating add button. It respects safe areas and reduced-motion settings.
- **Demo mode.** Without Supabase keys, everything still works and links are stored in the browser.

## Run it locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. Without keys, the app runs in **demo mode**.

## Turn on accounts and cloud sync (Supabase, free tier is fine)

1. Create a project at https://supabase.com.
2. In **SQL Editor**, paste the contents of [`supabase/schema.sql`](supabase/schema.sql) and click **Run**.
   This creates the tables, Row Level Security policies (each user only sees their own links) and realtime.
3. Copy `.env.local.example` to `.env.local` and fill in the values from **Project Settings → API**:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```
4. In **Authentication → URL Configuration**, set **Site URL** to your domain and add
   `http://localhost:3000/auth/callback` and `https://your-domain.com/auth/callback` to **Redirect URLs**.
5. *(Optional)* Google sign-in: enable the Google provider in **Authentication → Providers**, then set
   `NEXT_PUBLIC_AUTH_GOOGLE=true`.
6. Restart `npm run dev`.

## Deploy

Deploy to Vercel (or any Node host): import the repo, add the same environment variables, and deploy.
Then add the production `/auth/callback` URL in Supabase (step 4).

## Project layout

```
src/app/                 routes: landing (/), /login, /app, /auth/callback, /api/preview
src/components/landing/  hero, paste demo, features bento, device mockups
src/components/library/  library screen, cards, add/edit form, sidebar, menus
src/components/ui/       dialog/bottom sheet, menu, toast, button, cover art, logo
src/lib/store/           storage backends: Supabase (cloud) and localStorage (demo)
src/proxy.ts             refreshes the Supabase session and guards /app
supabase/schema.sql      database schema + RLS policies
```

The link-preview endpoint (`/api/preview`) only fetches public addresses. It refuses private and internal networks,
caps the response size and times out. When accounts are enabled, it requires a signed-in user.
