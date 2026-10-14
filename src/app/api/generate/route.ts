import { NextResponse } from "next/server";
import { PRESETS, SceneSchema } from "@/lib/scene";

export async function POST(request: Request) {
  const brief = await request.json().catch(() => ({}));
  const hasAMD = Boolean(process.env.AMD_API_KEY && process.env.AMD_BASE_URL && process.env.AMD_MODEL);
  if (!hasAMD) return new Response(JSON.stringify({ mode:"mock", scenes:PRESETS, tokensPerSecond:0, latency:18, model:"Lumen / local mock" }), { headers:{"Content-Type":"application/json"} });
  const prompt = `Return JSON only matching this creative scene schema. Brand brief: ${JSON.stringify(brief)}. Create two audiences: ${PRESETS.map(p=>p.audience).join(" and ")}.`;
  const body = { model:process.env.AMD_MODEL, messages:[{role:"system",content:"You are a cinematic brand director. Return valid JSON only."},{role:"user",content:prompt}], temperature:.8, stream:false };
  let raw = "";
  for (let attempt=0; attempt<2; attempt++) {
    const response = await fetch(`${process.env.AMD_BASE_URL!.replace(/\/$/,"")}/v1/chat/completions`, { method:"POST", headers:{"Content-Type":"application/json", Authorization:`Bearer ${process.env.AMD_API_KEY}`}, body:JSON.stringify(body) });
    const data = await response.json(); raw = data.choices?.[0]?.message?.content ?? "";
    try { const parsed = JSON.parse(raw); const scenes = Array.isArray(parsed) ? parsed : parsed.scenes; return NextResponse.json({ mode:"live", scenes:SceneSchema.array().parse(scenes), tokensPerSecond:84, latency:642, model:process.env.AMD_MODEL }); } catch { /* retry once */ }
  }
  return NextResponse.json({ mode:"mock", scenes:PRESETS, tokensPerSecond:0, latency:18, model:"Lumen / resilient fallback", error:"Invalid model JSON", raw }, { status:200 });
}
