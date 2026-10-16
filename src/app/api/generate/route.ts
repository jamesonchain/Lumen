import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { PRESETS, SceneSchema, type SceneScript } from "@/lib/scene";

type Usage = { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number; cost?: number; total_cost?: number; cost_usd?: number };
type ModelResponse = { choices?: Array<{ message?: { content?: string } }>; usage?: Usage; model?: string };
type AudienceResult = { scene: SceneScript; raw: string; model: string; latencyMs: number; completionTokens: number; tokensPerSecond: number; costUsd: number; live: boolean; notice?: string };

const memoryCache = new Map<string, AudienceResult>();
const fallbackModel = () => process.env.AMD_FALLBACK_MODEL || "DeepSeek-V4.1-Flash";
const mainModel = () => process.env.AMD_MODEL || "DeepSeek-V4-Flash";
let modelCheck: Promise<Set<string> | null> | null = null;

function hash(value: unknown) { return createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 24); }
function sleep(ms: number) { return new Promise((resolve) => setTimeout(resolve, ms)); }
function retryAfterMs(response: Response) { const header = response.headers.get("retry-after"); const seconds = header ? Number(header) : NaN; return Number.isFinite(seconds) ? Math.min(seconds * 1000, 15000) : 0; }
function presetFor(audience: string, index: number) { return PRESETS.find((preset) => preset.audience.toLowerCase() === audience.toLowerCase()) || PRESETS[index % PRESETS.length]; }
function numeric(value: unknown, fallback: number) { return typeof value === "number" && Number.isFinite(value) ? value : fallback; }
function envPresence() { return { AMD_BASE_URL: Boolean(process.env.AMD_BASE_URL), AMD_API_KEY: Boolean(process.env.AMD_API_KEY), AMD_MODEL: Boolean(process.env.AMD_MODEL), AMD_FALLBACK_MODEL: Boolean(process.env.AMD_FALLBACK_MODEL) }; }
function repairScene(candidate: unknown, fallback: SceneScript, audience: string, brief: Record<string, unknown>): SceneScript {
  const input = candidate && typeof candidate === "object" ? candidate as Partial<SceneScript> : {};
  const scenes = Array.isArray(input.scenes) ? input.scenes : [];
  const mergedScenes = Array.from({ length: 5 }, (_, index) => ({ ...fallback.scenes[index], ...(scenes[index] && typeof scenes[index] === "object" ? scenes[index] : {}) }));
  const palette = Array.isArray(input.palette) ? input.palette.filter((color): color is string => typeof color === "string").slice(0, 5) : [];
  const merged = {
    ...fallback,
    ...input,
    audience,
    brandName: typeof input.brandName === "string" ? input.brandName : String(brief.brandName || fallback.brandName),
    product: typeof input.product === "string" ? input.product : String(brief.product || fallback.product),
    palette: [...palette, ...fallback.palette].slice(0, 5),
    fontPairing: { ...fallback.fontPairing, ...(input.fontPairing || {}) },
    shader: { ...fallback.shader, ...(input.shader || {}) },
    soundscape: { ...fallback.soundscape, ...(input.soundscape || {}) },
    scenes: mergedScenes,
    qualityScore: numeric(input.qualityScore, fallback.qualityScore),
  };
  return SceneSchema.parse(merged);
}

async function availableModels(baseUrl: string, apiKey: string) {
  if (!modelCheck) modelCheck = fetch(`${baseUrl.replace(/\/$/, "")}/models`, { headers: { Authorization: `Bearer ${apiKey}` }, cache: "no-store" }).then(async (response) => { const body = await response.text(); if (!response.ok) { console.error("[Lumen AMD] GET /models failed", { status: response.status, body: body.slice(0, 500) }); return null; } try { const data = JSON.parse(body) as { data?: Array<{ id?: string }> }; const ids = new Set((data.data || []).map((model) => model.id).filter((id): id is string => Boolean(id))); console.info("[Lumen AMD] models checked", { count: ids.size, mainAvailable: ids.has(mainModel()), fallbackAvailable: ids.has(fallbackModel()) }); return ids; } catch (error) { console.error("[Lumen AMD] GET /models returned invalid JSON", { error: error instanceof Error ? error.message : "unknown" }); return null; } }).catch((error) => { console.error("[Lumen AMD] GET /models request failed", { error: error instanceof Error ? error.message : "unknown" }); return null; });
  return modelCheck;
}

async function fetchCompletion(baseUrl: string, apiKey: string, model: string, system: string, user: string): Promise<{ response: ModelResponse; latencyMs: number }> {
  let lastError: Error | undefined;
  for (let attempt = 0; attempt < 3; attempt++) {
    const started = performance.now();
    try {
      console.info("[Lumen AMD] POST /chat/completions", { model, attempt: attempt + 1 });
      const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` }, body: JSON.stringify({ model, messages: [{ role: "system", content: system }, { role: "user", content: user }], response_format: { type: "json_object" }, temperature: 0.8, max_tokens: 2500 }), cache: "no-store" });
      const responseBody = await response.text();
      if (response.status === 429) { console.error("[Lumen AMD] completion failed", { status: response.status, body: responseBody.slice(0, 500) }); await sleep(retryAfterMs(response) || Math.min(8000, 500 * 2 ** attempt) + Math.floor(Math.random() * 250)); continue; }
      if (!response.ok) { console.error("[Lumen AMD] completion failed", { status: response.status, body: responseBody.slice(0, 500) }); const error = new Error(`AMD request failed with ${response.status}`); (error as Error & { status?: number }).status = response.status; throw error; }
      return { response: JSON.parse(responseBody) as ModelResponse, latencyMs: Math.round(performance.now() - started) };
    } catch (error) { lastError = error as Error; const status = (error as Error & { status?: number }).status; if (status === 502 || status === 503) throw error; if (attempt < 2) await sleep(Math.min(8000, 500 * 2 ** attempt) + Math.floor(Math.random() * 250)); }
  }
  throw lastError || new Error("AMD request failed");
}

async function generateAudience(brief: Record<string, unknown>, audience: string, index: number, models: Set<string> | null): Promise<AudienceResult> {
  const fallback = presetFor(audience, index); const baseUrl = process.env.AMD_BASE_URL!; const apiKey = process.env.AMD_API_KEY!; let model = models?.has(mainModel()) === false && models.has(fallbackModel()) ? fallbackModel() : mainModel();
  const key = hash({ brief, audience, model }); const cached = memoryCache.get(key); if (cached) return cached;
  const user = JSON.stringify({ brief, audience, required: "Return one scene script object with palette, fontPairing, mood, shader, 5 scenes, soundscape, callToAction, qualityScore." });
  const strict = "Return JSON only. No markdown, no commentary. The JSON must contain exactly one scene script object with palette of 5 colors, fontPairing, mood, shader, exactly 5 scenes, soundscape, callToAction, and qualityScore.";
  const normal = "You are Lumen, a cinematic brand director. Create a distinct, premium visual world for the requested audience. Return valid JSON only.";
  let completion: { response: ModelResponse; latencyMs: number } | undefined; let notice: string | undefined;
  for (let jsonAttempt = 0; jsonAttempt < 2; jsonAttempt++) {
    try { completion = await fetchCompletion(baseUrl, apiKey, model, jsonAttempt ? strict : normal, user); const raw = completion.response.choices?.[0]?.message?.content || "{}"; const parsed = JSON.parse(raw); const scene = repairScene(Array.isArray(parsed) ? parsed[0] : parsed, fallback, audience, brief); const usage = completion.response.usage || {}; const completionTokens = numeric(usage.completion_tokens, 0); const latencyMs = completion.latencyMs; const result: AudienceResult = { scene, raw, model: completion.response.model || model, latencyMs, completionTokens, tokensPerSecond: completionTokens > 0 ? Number((completionTokens / Math.max(latencyMs / 1000, .001)).toFixed(2)) : 0, costUsd: numeric(usage.cost_usd ?? usage.cost ?? usage.total_cost, 0), live: true }; memoryCache.set(key, result); return result; } catch (error) { const status = (error as Error & { status?: number }).status; if (status === 502 || status === 503) model = fallbackModel(); notice = status === 502 || status === 503 ? `Primary model unavailable (${status}); using fallback.` : error instanceof Error ? error.message : "Invalid AMD response"; }
  }
  return { scene: fallback, raw: JSON.stringify(fallback, null, 2), model, latencyMs: completion?.latencyMs || 0, completionTokens: 0, tokensPerSecond: 0, costUsd: 0, live: false, notice };
}

export async function POST(request: Request) {
  const brief = await request.json().catch(() => ({})) as Record<string, unknown>;
  const audiences = Array.isArray(brief.audiences) && brief.audiences.length >= 2 ? brief.audiences.slice(0, 2).map(String) : PRESETS.map((preset) => preset.audience);
  const env = envPresence(); console.info("[Lumen AMD] env presence", env); const missing = Object.entries(env).filter(([, present]) => !present).map(([name]) => name);
  if (missing.length) { const notice = `Mock mode: missing ${missing.join(", ")}`; console.warn("[Lumen AMD] live call skipped", { reason: notice }); return NextResponse.json({ mode: "mock", notice, scenes: audiences.map((audience, index) => presetFor(audience, index)), rawResponses: audiences.map((audience, index) => JSON.stringify(presetFor(audience, index), null, 2)), metrics: { model: "Lumen / local mock", gpu: "Local fallback", latencyMs: 18, completionTokens: 0, tokensPerSecond: 0, costUsd: 0, qualityScore: 96 } }); }
  const baseUrl = process.env.AMD_BASE_URL!.replace(/\/$/, ""); const apiKey = process.env.AMD_API_KEY!; const models = await availableModels(baseUrl, apiKey); const results = await Promise.all(audiences.map((audience, index) => generateAudience(brief, audience, index, models)));
  const live = results.every((result) => result.live); const tokens = results.reduce((total, result) => total + result.completionTokens, 0); const latencyMs = Math.max(...results.map((result) => result.latencyMs)); const costUsd = results.reduce((total, result) => total + result.costUsd, 0); const qualityScore = Math.round(results.reduce((total, result) => total + result.scene.qualityScore, 0) / results.length);
  return NextResponse.json({ mode: live ? "live" : "mock", notice: results.find((result) => result.notice)?.notice, scenes: results.map((result) => result.scene), rawResponses: results.map((result) => result.raw), metrics: { model: results.map((result) => result.model).join(" + "), gpu: live ? "AMD Token Factory" : "Local fallback", latencyMs, completionTokens: tokens, tokensPerSecond: results.reduce((total, result) => total + result.tokensPerSecond, 0), costUsd: Number(costUsd.toFixed(6)), qualityScore } });
}
