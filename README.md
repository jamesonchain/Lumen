# Lumen

Lumen is a cinematic brand experience generator for the AMD Developer Hackathon ACT III, Track 4. One brief becomes two audience-specific worlds, with different palettes, typography, motion language, soundscape settings, and scene scripts.

## Run it

```bash
npm install
cp .env.example .env.local
npm run dev
```

If `AMD_API_KEY` is empty, Lumen automatically runs in mock mode with two ready-to-run presets: Gen Z gamers and 55 year old CFOs. With the AMD variables present, `/api/generate` calls `{AMD_BASE_URL}/chat/completions` from the server only. It confirms `/models` at startup, runs both compact audience generations in parallel, streams SSE tokens, honors `Retry-After` on 429s, switches to `AMD_FALLBACK_MODEL` on 502/503, retries invalid JSON once with a stricter system prompt, validates with Zod, and falls back safely if needed. The compact response is expanded into the full five-scene client object. Results are cached in server memory and browser local storage for instant repeat demos.

For a fast demo loop, run `npm run benchmark` once to compare the four supported models and print the fastest valid recommendation. With the dev server running, `npm run warm` generates both preset audiences live and writes `public/lumen-warm.json`; the preset brief then replays instantly with the label “Generated live on AMD, replayed from cache”. Custom briefs always call AMD live.

## Environment

| Variable | Purpose |
| --- | --- |
| `AMD_BASE_URL` | OpenAI-compatible AMD endpoint base URL |
| `AMD_API_KEY` | AMD Developer Cloud or tokenfactory key |
| `AMD_MODEL` | Open model served by vLLM |
| `AMD_FALLBACK_MODEL` | Fallback model used for 502/503 responses or unavailable main model |

## Architecture

`App Router page` → `Studio brief state` → `POST /api/generate` → `/models` check → parallel compact SSE completions → incremental palette/mood events → Zod validation and client-side expansion → metrics aggregation → split reveal renderer. The fallback path is `PRESETS` and is intentionally first-class, so the demo works without credentials. The browser owns interaction state, local-storage/warm replay, and motion; the route owns provider secrets, retries, model selection, validation, streaming, and metrics.

## 90-second demo script

1. Open the landing hero and point out the live AMD ROCm badge.
2. Scroll to Studio; keep the ready brief and click Generate experience.
3. Show the particle-like “composing worlds” state while the scene request resolves.
4. In Split reveal, switch between Play and Lead. Call out the palette, type, 3D object, and copy changing as the audience changes.
5. Click scene 03 or drag attention across the five scene cards; toggle sound state.
6. Open AMD metrics to show the live model, Token Factory GPU badge, real latency, completion tokens, cost precision, and quality score. If credentials are absent, point out the explicit Mock mode badge.
7. Finish on the business panel: $480 generated experience versus an $18k manual agency page.

## Production notes

The experience uses Next.js App Router, TypeScript, Tailwind CSS, react-three-fiber/drei, GSAP, Lenis, Framer Motion, WebAudio-ready soundscape controls, and Zod. Reduced motion is respected in CSS. For deployment, provide the AMD variables in the platform environment and run `npm run build && npm run start` or `docker compose up --build`.
