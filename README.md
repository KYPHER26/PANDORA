# Ester &amp; Kypher — Our Story ❤️

A private, two-person relationship diary. Only Ester and Kypher can ever sign in and see this data — every table is locked down with Postgres Row Level Security, and storage is locked to the couple's own folder.

## Stack

- React + TypeScript + Vite + Tailwind CSS
- Supabase: Auth (email/password + Google), Postgres + RLS, Storage, Realtime
- React Router

## 1. Create your Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. In **Project Settings → API**, copy the **Project URL** and **anon public key**.
3. In **Authentication → Providers**, enable **Email** and (optionally) **Google**. For Google, add your OAuth client ID/secret and set the redirect URL Supabase gives you in your Google Cloud OAuth config.
4. In **Authentication → URL Configuration**, set your Site URL (e.g. `http://localhost:5173` for local dev, your real domain once deployed) and add it to Redirect URLs.

## 2. Set up the database

1. Open the Supabase **SQL Editor**.
2. Paste the entire contents of `supabase/schema.sql` and run it. This creates every table, the profile-creation trigger, all RLS policies, the private `couple-media` storage bucket, and Realtime subscriptions.

## 3. Create the two accounts

1. Run the app locally (see step 5) or use Supabase's dashboard to invite users.
2. Have **Ester** and **Kypher** each sign up once, with their real emails, through the app's Sign Up screen (or Google sign-in). This auto-creates their `profiles` row.

## 4. Link the couple

1. Open `supabase/link_couple.sql`, replace the two placeholder emails with Ester's and Kypher's real emails, and adjust the relationship start date.
2. Run it once in the SQL Editor. This creates the shared `couples` row and links both profiles to it — from this point on, everything either of them adds is visible to the other, and to no one else.

## 5. Run locally

```bash
npm install
cp .env.example .env
# edit .env with your Supabase URL and anon key
npm run dev
```

Open the printed local URL (usually `http://localhost:5173`).

## 6. Deploy (GitHub → Vercel)

The project already has a local git repo with an initial commit, and a `vercel.json` with the SPA rewrite Vercel needs for client-side routes like `/timeline` or `/gallery` to work on refresh/direct link.

1. Create a new **empty** GitHub repo (no README/license, so there's no merge conflict), then push:
   ```bash
   git remote add origin https://github.com/YOUR-USERNAME/ester-and-kypher.git
   git branch -M main
   git push -u origin main
   ```
2. In [Vercel](https://vercel.com), **Add New → Project**, import that GitHub repo. Vercel auto-detects Vite (build command `npm run build` / `vite build`, output directory `dist`) — no changes needed.
3. Before the first deploy, add the environment variables in **Project Settings → Environment Variables** (apply to Production, Preview, and Development):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy. Once you have your Vercel URL (e.g. `https://ester-and-kypher.vercel.app`), go back to Supabase → **Authentication → URL Configuration** and set that as the Site URL, and add it (plus `http://localhost:5173` for local dev) to Redirect URLs. If you're using Google sign-in, also add the Vercel URL as an authorized redirect in your Google OAuth client.
5. Every future `git push` to `main` auto-deploys; pushes to other branches get their own preview URL with the same env vars.

## Notes on privacy & security

- Every table has RLS enabled; policies check the requesting user's `couple_id` against the row's `couple_id`, so no other authenticated user — even a future one — can ever read this couple's data.
- Photos live in a **private** storage bucket, keyed by `<couple_id>/...`; access is granted only via short-lived signed URLs generated for the couple's own members.
- Uploads are validated client-side for file type (JPG/PNG/WEBP/HEIC) and size (12MB max) before they reach storage.
- Never commit your `.env` file — it's already in `.gitignore`.

## What's included vs. left as an extension point

Built and working: auth, couple space, dashboard, daily memories, shared timeline, reactions & comments, gallery with fullscreen viewer, memory calendar, On This Day, special memories, Our Story milestones, search, notifications (in-app, realtime), light/dark themes, empty/error states, mobile bottom nav + desktop sidebar.

Left simple on purpose, easy to extend later: push notifications (currently in-app only), infinite-scroll pagination on very long timelines (currently fetches recent + filtered sets), and a settings screen for changing email/password beyond reset.
