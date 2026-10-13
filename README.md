# CreatorKit

Plan Instagram Reels, TikToks and YouTube Shorts in minutes.

- **Video Idea Generator** (`/ideas`) — 10 specific ideas with a title, opening hook and explanation, based on your niche, audience, platform and style.
- **Script Generator** (`/script`) — a timed script with hook, voiceover/dialogue, suggested shots, on-screen text, ending and call to action.
- **Shot Planner** (`/shots`) — a shot list with timestamps, shot types, camera angles, what to film, transitions and editing notes.

All results are editable in place, copyable, and can be regenerated. Ideas link straight into the script generator, and scripts link into the shot planner.

Users sign up and log in with email and password (Supabase Auth). The tools, the account page and the AI endpoints require a signed-in user; the landing page is public.

## Setup

Requires Node.js 20+.

```bash
npm install
cp .env.example .env.local
```

Fill in `.env.local`:

```
OPENAI_API_KEY=sk-...
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=...
```

The Supabase values are in the Supabase dashboard under Project Settings → API. They're only read on the server, so the `NEXT_PUBLIC_` prefix is optional. The app also recognises the values themselves — a `https://<project>.supabase.co` address and a public anon / publishable key — whatever the variables are called; secret / service_role keys are never used.

To check a deployment, open `/api/health`: it reports whether login, the database table and the AI key are set up (yes/no only, never the values). Accepted names: `SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_URL` / `PUBLIC_SUPABASE_URL`, and for the key `SUPABASE_ANON_KEY`, `PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_PUBLIC_ANON_KEY`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_KEY` (each also with a `NEXT_PUBLIC_` prefix where applicable). `OPENAI_KEY` works in place of `OPENAI_API_KEY`.

### Supabase settings

In the Supabase dashboard, go to **Authentication → URL Configuration**:

- **Site URL**: your deployed URL, e.g. `https://your-app.vercel.app`
- **Redirect URLs**: add `https://your-app.vercel.app/auth/confirm` and, for local development, `http://localhost:3000/auth/confirm`

Email/password sign-in is enabled by default. If “Confirm email” is on (the default), new users must click the link in their confirmation email before logging in. Supabase's built-in email sender is heavily rate-limited (a few emails per hour); for real users, add your own SMTP provider under **Authentication → Emails → SMTP Settings**.

### Database (saved items)

Every idea list, script and shot list a user generates is saved to their account (including their edits) and listed on the **Saved** page. New idea batches avoid repeating ideas the user already has, and regenerating a script or shot list takes a different angle from earlier versions.

This needs one table. In the Supabase dashboard open **SQL Editor → New query**, paste the contents of [`supabase/migrations/20261013000000_create_generations.sql`](supabase/migrations/20261013000000_create_generations.sql) and click **Run**. It creates the `generations` table with Row Level Security so each user can only read and change their own rows. Until it's run, the app still works but shows “Not saved: saving isn't set up yet”.

Then run:

```bash
npm run dev
```

Without a key the app still runs, but generation returns a clear “not configured” message instead of results.

### Optional settings

| Variable | Default | Purpose |
| --- | --- | --- |
| `OPENAI_MODEL` | `gpt-5.4-mini` | Model used for all generations. Must support structured outputs. |
| `NEXT_PUBLIC_SITE_URL` | detected from the request | Public URL used in sign-up and password reset email links |

## How it works

- `src/app/api/{ideas,script,shots}/route.ts` — server-side route handlers. They validate input with Zod, call the OpenAI Responses API with structured outputs, and return schema-validated JSON. The API key is only read on the server (`src/lib/ai.ts` is marked `server-only`).
- `src/lib/schemas.ts` — shared input/output schemas. The same input schemas validate forms in the browser and requests on the server.
- `src/proxy.ts` refreshes the Supabase session on each request and redirects signed-out users from the tools to `/login`. Auth runs entirely on the server via server actions (`src/lib/auth-actions.ts`); email links land on `src/app/auth/confirm/route.ts`.
- `src/lib/generations.ts` reads and writes saved items through Supabase with the user's own session, so Row Level Security enforces per-user access. `src/app/api/generations/[id]/route.ts` loads, auto-saves edits to, and deletes an item.
- Errors (missing/invalid key, unavailable model, rate limits or no credits, timeouts, refusals) are mapped to friendly messages; details are logged server-side only.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build (includes type checking) |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |

## Deploying

Deploy anywhere that runs Next.js (e.g. Vercel). Set the environment variables above in your host's dashboard — never commit them — and redeploy after changing them. Generation routes allow up to 120 seconds (`maxDuration`).

Only signed-in users can generate, but there is no per-user usage limit yet. Set a monthly spend limit on your OpenAI account.
