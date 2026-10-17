# Lumen

One brand brief, two audience-specific real time worlds.

[![Next.js](https://img.shields.io/badge/Next.js-App%20Router-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Three.js](https://img.shields.io/badge/Three.js-WebGL-black)](https://threejs.org/)
[![AMD ROCm](https://img.shields.io/badge/AMD-ROCm-red)](https://www.amd.com/en/products/software/rocm.html)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

[Live demo](https://lumen-amd.vercel.app)

## Overview

Lumen accepts a brand name, product, tone, goal, and two audiences. A language model generates a compact structured scene script for each audience. The browser expands those scripts into distinct visual worlds with copy, color, motion, shaders, 3D objects, and soundscape parameters.

The project addresses a common limitation of one-size-fits-all brand pages. The same brief can require different visual language for different people. Lumen makes that contrast visible in a split reveal and lets each audience world open as a full-screen player.

## Features

- Server-sent streaming generation for two audiences in parallel.
- Compact scene schema validated with Zod and expanded into the frontend scene model.
- Per-audience layout, shader, 3D hero, typography, motion, grain, and sound settings.
- Split reveal with draggable and keyboard-accessible seam, comparison strip, and ambient sound crossfade.
- Full-screen world player with five generated scenes and Escape to close.
- Live JSON response panel with token progress, elapsed time, and tokens per second.
- In-memory response caching on the server and local storage caching in the browser.
- `public/lumen-warm.json` replay for the default preset brief when generated live cache data exists.
- Fallback model selection, retry handling, preset scene fallback, and visible notices.
- In-memory per-IP limit of three live generation starts per ten minutes.
- AMD metrics panel for model, GPU label, latency, completion tokens, token rate, cost, and quality score.
- Reduced-motion CSS behavior and responsive layouts for desktop and mobile widths.

## How it works

1. The Studio form collects the brand brief and Audience A and Audience B.
2. The browser posts the form to `/api/generate`.
3. The Node.js route checks the configured AMD models, then starts one streamed chat completion per audience.
4. Each response is parsed from SSE chunks, partially inspected for palette and mood updates, and validated against `CompactSceneSchema`.
5. Invalid compact JSON is retried once with a stricter system message. A 502 or 503 switches to the fallback model. Failed generations use preset scenes.
6. The browser expands each compact result with `expandCompactScene` and renders the two worlds.

```text
Browser
  |  brief JSON, SSE events
  v
Next.js App Router /api/generate
  |  server-only Bearer key, validation, retries, metrics
  v
AMD Token Factory  POST {AMD_BASE_URL}/chat/completions
  |
  +--> CompactSceneSchema validation and fallback scenes
  |
  +--> WorldCanvas, ThinkCanvas, WorldPlayer, audio, metrics
```

## AMD integration

The default model is `DeepSeek-V4-Flash`, served on AMD GPUs through AMD Token Factory. The configured fallback model defaults to `DeepSeek-V4.1-Flash`. The route sends OpenAI-compatible requests to:

```text
{AMD_BASE_URL}/chat/completions
```

The API key is read from `process.env.AMD_API_KEY` in the server route. It is not sent to the browser and is not included in client bundles. The route also checks `{AMD_BASE_URL}/models` and selects the fallback model if the configured main model is unavailable.

Requests use JSON response format, temperature `0.8`, `max_tokens` `900`, and streaming. Latency is measured from request start to validated completion. Completion tokens come from the response usage block when present, token rate is calculated from completion tokens and latency, and cost is read from `cost_usd`, `cost`, or `total_cost` in the usage block.

The repository warm cache contains this measured example from two parallel live calls, stored in `public/lumen-warm.json`:

| Value | Measured example |
| --- | ---: |
| Model | `DeepSeek-V4-Flash + DeepSeek-V4-Flash` |
| Maximum audience latency | `17,403 ms` |
| Completion tokens | `553` |
| Combined token rate | `32.7 tok/s` |
| Combined cost | `$0.000254` |
| Validator quality score | `96 / 100` |

These values describe that cache file only and are not fixed application constants.

## Tech stack

| Area | Technology |
| --- | --- |
| Framework | Next.js App Router |
| Language | TypeScript |
| 3D and shaders | Three.js, react-three-fiber, drei, custom GLSL shaders |
| Animation | GSAP, ScrollTrigger, Framer Motion, Lenis |
| Audio | Web Audio API |
| Validation | Zod |
| Styling | Tailwind CSS import and project CSS |
| Deployment | Next.js Node.js runtime, Docker, Vercel-compatible deployment |

## Getting started

### Prerequisites

- Node.js 22 or newer. The Dockerfile uses Node.js 22 Alpine.
- npm.
- AMD Token Factory credentials for live generation. The app can run without them in mock mode.

### Clone and install

```bash
git clone <repository-url>
cd Lumen
npm install
cp .env.example .env.local
```

### Environment variables

| Name | Required for live mode | Description | Example |
| --- | --- | --- | --- |
| `AMD_BASE_URL` | Yes | Base URL for the OpenAI-compatible AMD Token Factory API. `/chat/completions` and `/models` are appended by the server. | `https://amd.example.invalid/v1` |
| `AMD_API_KEY` | Yes | Bearer key used only by the server route. | `replace-with-your-key` |
| `AMD_MODEL` | No | Main model name. Defaults to `DeepSeek-V4-Flash` in the route. | `DeepSeek-V4-Flash` |
| `AMD_FALLBACK_MODEL` | No | Model used after a 502 or 503, or when the main model is unavailable. Defaults to `DeepSeek-V4.1-Flash`. | `DeepSeek-V4.1-Flash` |

The committed `.env.example` contains the same four variables and no secret value. Keep the real values in `.env.local`.

### Development

```bash
npm run dev
```

Open `http://localhost:3000`.

### Production

```bash
npm run build
npm run start
```

Open `http://localhost:3000` after the production server starts.

## Docker

The Docker image installs the lockfile dependencies with `npm ci`, builds the Next.js app, and starts the Node.js server on port 3000.

```bash
cp .env.example .env.local
docker compose up --build
```

The existing compose file reads `.env.local` and maps port 3000. To build and run without Compose:

```bash
docker build -t lumen .
docker run --env-file .env.local -p 3000:3000 lumen
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Next.js development server. |
| `npm run build` | Create the production build with the Webpack builder. |
| `npm run start` | Start the production server. |
| `npm run lint` | Run ESLint across the repository. |
| `npm run benchmark` | Call four configured AMD models with the same compact prompt and print latency, token rate, and JSON validity. Requires `AMD_BASE_URL` and `AMD_API_KEY`. |
| `npm run warm` | Call the running app with the two preset audiences and write live results and metrics to `public/lumen-warm.json`. Requires a running app and live AMD credentials. Set `LUMEN_URL` to use a different app URL. |

## Project structure

```text
src/
  app/
    api/generate/route.ts  Server-only AMD streaming route, validation, retries, and limits
    page.tsx               Studio, streaming panel, split reveal, player, metrics, and business UI
    layout.tsx             Metadata, Open Graph configuration, and icon reference
    globals.css            Visual system, responsive rules, and reduced-motion styles
    opengraph-image.tsx    Generated 1200 by 630 Open Graph image
    icon.svg               Favicon
  components/
    ThinkCanvas.tsx        Streaming particle and scene-script visualization
    WorldCanvas.tsx        World shader and 3D renderer
    LumenOrb.tsx           Orb component used by the visual system
  lib/
    scene.ts               Zod schemas, presets, contrast correction, and scene expansion
scripts/
  benchmark.mjs            AMD model comparison utility
  warm.mjs                 Preset live-generation cache writer
public/
  lumen-warm.json          Optional live-generated preset replay data
Dockerfile                 Multi-stage Node.js production image
docker-compose.yml         Local container configuration
next.config.ts             Next.js and Turbopack root configuration
.env.example               Secret-free environment template
```

## Configuration and limits

- The API route uses the Node.js runtime and exports `maxDuration = 60` for streaming requests.
- Each IP can start three live generations during a ten-minute in-memory window. When the limit is reached, the route replays preset scenes with the notice `Replayed from a live AMD run`.
- Successful audience results are cached in server memory by a hash of the brief, audience, and model. Browser results are also stored in `localStorage` by a matching generation key.
- The default preset brief can replay `public/lumen-warm.json` when that file contains a live result with two compact scenes. Custom briefs do not use that warm file.
- Mock mode starts when any of `AMD_BASE_URL`, `AMD_API_KEY`, `AMD_MODEL`, or `AMD_FALLBACK_MODEL` is missing.
- If a live request receives a 429, the route honors `Retry-After` when available and retries with exponential backoff and jitter. A 502 or 503 switches to the fallback model. Invalid JSON receives one stricter-prompt retry before preset fallback.
- Generated palettes are contrast-adjusted before they are expanded into full scenes.

## Deployment

For Vercel, define `AMD_BASE_URL`, `AMD_API_KEY`, `AMD_MODEL`, and `AMD_FALLBACK_MODEL` in the project environment settings. The generation route runs on Node.js, streams with SSE headers, and allows up to 60 seconds through `maxDuration`.

## Security notes

- The AMD key is read only in `src/app/api/generate/route.ts`.
- The browser calls the local `/api/generate` route and never receives the provider key.
- `.env*` files are ignored by Git, with `.env.example` explicitly allowed as the template.
- Never commit `.env.local`, API keys, provider responses containing secrets, or copied credentials.

## License and acknowledgements

Lumen is released under the MIT License. See [LICENSE](LICENSE).

Built for AMD Developer Hackathon: ACT III with AMD Token Factory and DeepSeek models served on AMD GPUs.
