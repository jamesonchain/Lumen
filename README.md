# Lumen

Lumen turns one plain-language brand brief into two radically different audience worlds. Give it a brand, product, tone, goal, and two audiences; it creates the visual language, motion, scene copy, soundscape, and 3D direction for each audience.

## Run it

```bash
npm install
cp .env.example .env.local
npm run dev
```

If `AMD_API_KEY` is empty, Lumen runs in mock mode with ready presets. With credentials, the server calls the exact AMD Token Factory base URL in `AMD_BASE_URL`, at `{AMD_BASE_URL}/chat/completions`, using `DeepSeek-V4-Flash` by default. That model is served on AMD GPUs through AMD Token Factory. The route streams both audiences in parallel, reports measured completion tokens, tok/s, latency, and cost from the response usage block, and caches live preset runs for instant judge demos. Public traffic is limited to three live generations per IP every ten minutes; excess requests replay the last live preset run.

For a fast demo loop, run `npm run benchmark` once to compare the four supported models and print the fastest valid recommendation. With the dev server running, `npm run warm` generates both preset audiences live and writes `public/lumen-warm.json`; the preset brief then replays instantly with the label “Generated live on AMD, replayed from cache”. Custom briefs always call AMD live.

## Environment

| Variable | Purpose |
| --- | --- |
| `AMD_BASE_URL` | OpenAI-compatible AMD endpoint base URL |
| `AMD_API_KEY` | AMD Developer Cloud or tokenfactory key |
| `AMD_MODEL` | Open model served by vLLM |
| `AMD_FALLBACK_MODEL` | Fallback model used for 502/503 responses or unavailable main model |

## Architecture

`App Router page` → `Studio brief state` → `POST /api/generate` → Node.js SSE route → `/models` check → parallel compact AMD completions → incremental palette/mood events → Zod validation/repair → client-side scene expansion → split renderer, audio, and metrics. The route uses `maxDuration = 60`, no-buffer SSE headers, Retry-After handling, model fallback, and an IP window limiter. The browser owns interaction state, local-storage/warm replay, and motion; the route owns provider secrets, retries, validation, streaming, and real metrics.

## Why AMD

AMD Token Factory makes the model call part of the experience rather than a hidden afterthought: DeepSeek-V4-Flash is served on AMD GPUs, and Lumen exposes the measured model name, completion tokens, tok/s, latency, and dollar cost beside the generated worlds. In the current warm run, two preset audiences are generated in parallel and stored in `public/lumen-warm.json` for instant replay. The exact provider endpoint is the value supplied as `AMD_BASE_URL`; the request path appended by Lumen is `/chat/completions` and the default model is `DeepSeek-V4-Flash`.

## 90-second demo script

1. Open the landing hero and point out the live AMD ROCm badge.
2. Scroll to Studio; keep the ready brief and click Generate experience.
3. Show the particle-like “composing worlds” state while the scene request resolves.
4. In Split reveal, switch between Play and Lead. Call out the palette, type, 3D object, and copy changing as the audience changes.
5. Click scene 03 or drag attention across the five scene cards; toggle sound state.
6. Open AMD metrics to show the live model, Token Factory GPU badge, real latency, completion tokens, cost precision, and quality score. If credentials are absent, point out the explicit Mock mode badge.
7. Finish on the business panel: the live AMD cost is multiplied by 1,000 for Lumen's illustrative run value, then compared with a 37.5× manual-agency benchmark.

## Business value

The business panel is deliberately computed from the provider response. After a live run, Lumen shows the real AMD usage cost, an illustrative generated-experience value of `real cost × 1,000`, and a manual-agency comparison at `37.5 ×` that value. This keeps the demo honest across models and token prices while making the economic contrast visible. Mock mode shows dashes until a real AMD run supplies measured usage.

## Docker

```bash
docker compose up --build
```

Or build and run directly:

```bash
docker build -t lumen .
docker run --env-file .env.local -p 3000:3000 lumen
```

## Production notes

The experience uses Next.js App Router, TypeScript, Tailwind CSS, react-three-fiber/drei, GSAP, Lenis, Framer Motion, WebAudio-ready soundscape controls, and Zod. Reduced motion is respected in CSS. For deployment, provide the AMD variables in the platform environment and run `npm run build && npm run start` or `docker compose up --build`.
