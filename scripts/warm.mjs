import fs from "node:fs";
import { performance } from "node:perf_hooks";

const base = process.env.LUMEN_URL || "http://localhost:3000";
const brief = { brandName: "Lumen", product: "a culture intelligence platform", tone: "Quietly radical", goal: "Make the next move with clarity", audiences: ["Gen Z gamers", "55 year old CFOs"] };
const response = await fetch(`${base}/api/generate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(brief) });
if (!response.ok || !response.body) throw new Error(`Lumen route failed (${response.status})`);
const reader = response.body.getReader(); const decoder = new TextDecoder(); let buffer = ""; let doneEvent; const started = performance.now();
while (true) { const { value, done } = await reader.read(); buffer += decoder.decode(value || new Uint8Array(), { stream: !done }); const frames = buffer.split("\n\n"); buffer = frames.pop() || ""; for (const frame of frames) { const line = frame.split("\n").find((item) => item.startsWith("data:")); if (!line) continue; try { const event = JSON.parse(line.slice(5).trim()); if (event.type === "done") doneEvent = event; } catch {} } if (done) break; }
if (!doneEvent?.compactScenes || doneEvent.mode !== "live") throw new Error(doneEvent?.notice || "Warm generation was not live");
const payload = { version: 1, generatedAt: new Date().toISOString(), brief, mode: doneEvent.mode, model: doneEvent.metrics.model, metrics: doneEvent.metrics, compactScenes: doneEvent.compactScenes, rawResponses: doneEvent.rawResponses, notice: "Generated live on AMD, replayed from cache", warmLatencyMs: Math.round(performance.now() - started) };
fs.mkdirSync("public", { recursive: true });
fs.writeFileSync("public/lumen-warm.json", `${JSON.stringify(payload, null, 2)}\n`);
console.log(`Warm cache written: ${payload.model}, ${payload.metrics.latencyMs}ms, ${payload.metrics.tokensPerSecond} tok/s`);
