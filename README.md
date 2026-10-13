# CreatorKit

Plan Instagram Reels, TikToks and YouTube Shorts in minutes.

- **Video Idea Generator** (`/ideas`) — 10 specific ideas with a title, opening hook and explanation, based on your niche, audience, platform and style.
- **Script Generator** (`/script`) — a timed script with hook, voiceover/dialogue, suggested shots, on-screen text, ending and call to action.
- **Shot Planner** (`/shots`) — a shot list with timestamps, shot types, camera angles, what to film, transitions and editing notes.

All results are editable in place, copyable, and can be regenerated. Ideas link straight into the script generator, and scripts link into the shot planner.

## Setup

Requires Node.js 20+.

```bash
npm install
cp .env.example .env.local
```

Add your OpenAI API key to `.env.local` (create one at https://platform.openai.com/api-keys):

```
OPENAI_API_KEY=sk-...
```

Then run:

```bash
npm run dev
```

Without a key the app still runs, but generation returns a clear “not configured” message instead of results.

### Optional settings

| Variable | Default | Purpose |
| --- | --- | --- |
| `OPENAI_MODEL` | `gpt-5.4-mini` | Model used for all generations. Must support structured outputs. |

## How it works

- `src/app/api/{ideas,script,shots}/route.ts` — server-side route handlers. They validate input with Zod, call the OpenAI Responses API with structured outputs, and return schema-validated JSON. The API key is only read on the server (`src/lib/ai.ts` is marked `server-only`).
- `src/lib/schemas.ts` — shared input/output schemas. The same input schemas validate forms in the browser and requests on the server.
- Errors (missing/invalid key, unavailable model, rate limits or no credits, timeouts, refusals) are mapped to friendly messages; details are logged server-side only.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build (includes type checking) |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |

## Deploying

Deploy anywhere that runs Next.js (e.g. Vercel). Set `OPENAI_API_KEY` as an environment variable in your host's dashboard — never commit it. Generation routes allow up to 120 seconds (`maxDuration`).

There is no rate limiting or authentication in this version, so anyone with the URL can use your API credits. Add rate limiting (or auth) before sharing a public deployment.
