import fs from "node:fs";
import { performance } from "node:perf_hooks";

function loadEnv() {
  const file = ".env.local";
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
  }
}
loadEnv();
const baseUrl = (process.env.AMD_BASE_URL || "").replace(/\/$/, "");
const key = process.env.AMD_API_KEY;
if (!baseUrl || !key) throw new Error("AMD_BASE_URL and AMD_API_KEY are required");
const models = ["DeepSeek-V4-Flash", "DeepSeek-V4.1-Flash", "MiMo-V2.6-Flash", "GLM-5.3-Flash"];
const system = "Return compact JSON only with keys b,r,a,p,m,f,h,x,q,c. p is 5 hex colors; m is 3 words; x is 4 scenes with h max 7 words, t max 14 words, v one of orbit,glitch,bloom,magnetic,measured,parallax,focus,reveal; q.s one of Dorian,Phrygian,Lydian,Aeolian,Mixolydian.";
const user = JSON.stringify({ brief: { brand: "Lumen", product: "a culture intelligence platform", tone: "Quietly radical", goal: "Make the next move with clarity" }, audience: "Gen Z gamers" });
const valid = (value) => { try { const parsed = JSON.parse(value); return Boolean(Array.isArray(parsed.p) && parsed.p.length === 5 && Array.isArray(parsed.x) && parsed.x.length === 4 && parsed.m); } catch { return false; } };
const results = [];
for (const model of models) {
  const started = performance.now();
  try {
    const response = await fetch(`${baseUrl}/chat/completions`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` }, body: JSON.stringify({ model, messages: [{ role: "system", content: system }, { role: "user", content: user }], response_format: { type: "json_object" }, temperature: 0.8, max_tokens: 900 }) });
    const body = await response.json();
    const content = body.choices?.[0]?.message?.content || "";
    const tokens = body.usage?.completion_tokens || 0;
    const latency = Math.round(performance.now() - started);
    const tps = Number((tokens / Math.max(latency / 1000, 0.001)).toFixed(1));
    const isValid = response.ok && valid(content);
    results.push({ model, latency, tokens, tps, valid: isValid });
    console.log(`${model}\tstatus=${response.status}\tlatency=${latency}ms\ttok/s=${tps}\tvalid=${isValid}`);
  } catch (error) { results.push({ model, valid: false }); console.log(`${model}\tfailed=${error instanceof Error ? error.message : "unknown"}`); }
}
const winner = results.filter((result) => result.valid).sort((a, b) => a.latency - b.latency)[0];
console.log(winner ? `RECOMMENDED AMD_MODEL=${winner.model}` : "No valid model response; keep the configured AMD_MODEL.");
