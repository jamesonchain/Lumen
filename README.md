# Lumen

Lumen is a cinematic brand experience generator for the AMD Developer Hackathon ACT III, Track 4. One brief becomes two audience-specific worlds, with different palettes, typography, motion language, soundscape settings, and scene scripts.

## Run it

```bash
npm install
cp .env.example .env.local
npm run dev
```

If `AMD_API_KEY` is empty, Lumen automatically runs in mock mode with two ready-to-run presets: Gen Z gamers and 55 year old CFOs. With the three AMD variables present, `/api/generate` calls the OpenAI-compatible AMD endpoint, retries once on invalid JSON, validates the scene script with Zod, and falls back safely if needed.

## Environment

| Variable | Purpose |
| --- | --- |
| `AMD_BASE_URL` | OpenAI-compatible AMD endpoint base URL |
| `AMD_API_KEY` | AMD Developer Cloud or tokenfactory key |
| `AMD_MODEL` | Open model served by vLLM |

## Architecture

`App Router page` → `Studio brief state` → `POST /api/generate` → `AMD OpenAI-compatible endpoint` → `Zod SceneSchema` → `split reveal renderer`. The fallback path is `PRESETS` and is intentionally first-class, so the demo works without credentials. The client owns interaction state and motion; the route owns provider secrets and validation.

## 90-second demo script

1. Open the landing hero and point out the live AMD ROCm badge.
2. Scroll to Studio; keep the ready brief and click Generate experience.
3. Show the particle-like “composing worlds” state while the scene request resolves.
4. In Split reveal, switch between Play and Lead. Call out the palette, type, 3D object, and copy changing as the audience changes.
5. Click scene 03 or drag attention across the five scene cards; toggle sound state.
6. Open AMD metrics to show model, MI300X badge, latency, and quality score.
7. Finish on the business panel: $480 generated experience versus an $18k manual agency page.

## Production notes

The experience uses Next.js App Router, TypeScript, Tailwind CSS, react-three-fiber/drei, GSAP, Lenis, Framer Motion, WebAudio-ready soundscape controls, and Zod. Reduced motion is respected in CSS. For deployment, provide the AMD variables in the platform environment and run `npm run build && npm run start` or `docker compose up --build`.
