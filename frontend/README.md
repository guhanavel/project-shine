# Shine World — Web App

The browser version of Shine World: a TanStack Start (React 19 + SSR) app,
built with Vite and deployed as a Cloudflare Worker (via Nitro's `cloudflare`
preset). Talks to a Supabase backend for auth, class/child data, and progress
tracking.

This app's source also feeds the [`../shineworld-mobile`](../shineworld-mobile)
Android app — the two started as one codebase and were split into separate,
independently buildable projects. `src/` here and in `shineworld-mobile/` are
copies; a change meant for both apps (e.g. a shared component or activity
fix) needs to be made in **both** places. See the root [`../README.md`](../README.md)
for why they're split and how to keep them in sync.

## One-time setup

1. Install [Bun](https://bun.sh) (or Node.js — either works with `npm`).
2. Install [Docker Desktop](https://www.docker.com/products/docker-desktop/)
   if you want to run the local Supabase stack (Postgres, Auth, Storage,
   Studio) — used by `dev:all`.
3. Copy your Supabase project credentials into `.env` (already present here
   for local dev — see `.env` / `.env.local`). These hold:
   - `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`,
     `VITE_SUPABASE_PROJECT_ID` — used by the browser client.
   - `SUPABASE_SERVICE_ROLE_KEY` (`.env.local`) — server-only, used for local
     Supabase tooling. Never expose this to the client.
4. Install dependencies:
   ```bash
   npm install
   ```

## Local development

```bash
npm run dev        # Vite dev server only (assumes Supabase is already reachable)
npm run dev:all     # Starts Docker + local Supabase stack + Vite dev server (bash run.sh)
```

`dev:all` requires Docker Desktop and the Supabase CLI (installed via
`npx supabase`, no separate install needed) and is the closest thing to a
one-command local environment.

**If you use `npm run dev` on its own, character/buddy images will appear
broken.** Those images aren't bundled — they're served from Supabase Storage
at `${VITE_SUPABASE_URL}/storage/v1/object/public/...`, and the default
`.env` points `VITE_SUPABASE_URL` at the local stack (`http://127.0.0.1:64321`).
`npm run dev` doesn't start that stack, so the image requests fail. Either
run `npm run dev:all` instead, or start Docker + `npx supabase start`
yourself before `npm run dev`.

## Build

```bash
npm run build       # Production build → Cloudflare Worker bundle
npm run build:dev   # Same, but in development mode (unminified, dev env vars)
npm run preview      # Preview the production build locally via `vite preview`
```

`npm run build` produces a server bundle (Nitro's `cloudflare-module`
preset) meant to run on Cloudflare Workers — there's no static
`dist/client/index.html` you can just open in a browser. For a fully
client-side, offline-capable build (used by the Android app instead), see
`shineworld-mobile/`.

### Deploying

This repo doesn't include a `wrangler.toml` — deployment is expected to go
through whatever Cloudflare Workers project/CI already fronts this app
(check your Cloudflare dashboard or CI config for the deploy step). If you're
setting up deployment from scratch, `npx wrangler deploy` against the built
output is the standard next step; consult the
[Cloudflare Workers + Vite docs](https://developers.cloudflare.com/workers/framework-guides/web-apps/)
for the exact wrangler config this Nitro preset expects.

## Local Supabase

- `supabase/config.toml` and `supabase/migrations/` define the local stack
  and schema.
- `npx supabase start` boots it (Docker required); `dev:all` does this for
  you automatically.
- `supabase/.branches/` and `supabase/.temp/` are local CLI state —
  gitignored, safe to delete if the stack gets into a bad state.

## Code quality

```bash
npm run lint     # ESLint
npm run format   # Prettier, writes in place
```

## Project layout

```
web/
├── src/                # App source (routes, components, hooks, Supabase client)
├── public/              # Static assets served as-is
├── supabase/             # Local Supabase config + SQL migrations
├── run.sh                # Docker + Supabase + dev server bootstrap (used by dev:all)
└── vite.config.ts         # Vite/TanStack Start config (SSR + Cloudflare build)
```

For what the app actually does (sign-in, the phonics activities, the teacher
dashboard, reports), see [`../docs/USER_GUIDE.md`](../docs/USER_GUIDE.md) —
it applies equally to this web app and the Android app, since it's the same
product experience on both.
