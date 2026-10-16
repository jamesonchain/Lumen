import { z } from "zod";

export const SceneSchema = z.object({
  audience: z.string(), brandName: z.string(), product: z.string(),
  palette: z.array(z.string()).length(5), fontPairing: z.object({ display: z.string(), body: z.string() }), mood: z.string(),
  shader: z.object({ noiseScale: z.number(), speed: z.number(), distortion: z.number(), colorMix: z.number() }),
  scenes: z.array(z.object({ headline: z.string(), subtext: z.string(), motionStyle: z.string(), cameraPath: z.string(), objectType: z.string() })).length(5),
  soundscape: z.object({ tempo: z.number(), scale: z.string(), filter: z.number() }), callToAction: z.string(), qualityScore: z.number()
});
export type SceneScript = z.infer<typeof SceneSchema>;

export const CompactMotionSchema = z.enum(["orbit", "glitch", "bloom", "magnetic", "measured", "parallax", "focus", "reveal"]);
export const CompactScaleSchema = z.enum(["Dorian", "Phrygian", "Lydian", "Aeolian", "Mixolydian"]);
export const CompactSceneSchema = z.object({
  a: z.string(), b: z.string(), r: z.string(), p: z.array(z.string()).length(5), m: z.string(),
  f: z.object({ d: z.string(), b: z.string() }), h: z.object({ n: z.number(), s: z.number(), d: z.number(), c: z.number() }),
  x: z.array(z.object({ h: z.string().max(80), t: z.string().max(120), v: CompactMotionSchema })).length(4),
  q: z.object({ t: z.number(), s: CompactScaleSchema }), c: z.string()
});
export type CompactScene = z.infer<typeof CompactSceneSchema>;

export function expandCompactScene(compact: CompactScene, fallback: SceneScript, brief: Record<string, unknown>): SceneScript {
  const scenes = compact.x.map((scene, index) => ({ headline: scene.h, subtext: scene.t, motionStyle: scene.v, cameraPath: fallback.scenes[index]?.cameraPath || "forward-flight", objectType: fallback.scenes[index]?.objectType || "luminous form" }));
  scenes.push({ ...fallback.scenes[4], headline: compact.c || fallback.scenes[4].headline, subtext: "The signal is ready to move.", motionStyle: "reveal" });
  return SceneSchema.parse({ audience: compact.a, brandName: compact.b || String(brief.brandName || fallback.brandName), product: compact.r || String(brief.product || fallback.product), palette: compact.p, fontPairing: { display: compact.f.d, body: compact.f.b }, mood: compact.m, shader: { noiseScale: compact.h.n, speed: compact.h.s, distortion: compact.h.d, colorMix: compact.h.c }, scenes, soundscape: { tempo: compact.q.t, scale: compact.q.s, filter: fallback.soundscape.filter }, callToAction: compact.c || fallback.callToAction, qualityScore: fallback.qualityScore });
}

export const PRESETS: SceneScript[] = [
  { audience:"Gen Z gamers", brandName:"Lumen", product:"a culture intelligence platform", palette:["#090A0C","#B7FF4A","#9BE7FF","#FF6B8A","#F1EEE6"], fontPairing:{display:"Space Grotesk",body:"Inter"}, mood:"electric, lucid, kinetic", shader:{noiseScale:2.4,speed:1.35,distortion:.72,colorMix:.62}, soundscape:{tempo:128,scale:"Dorian",filter:1800}, callToAction:"Enter the signal", qualityScore:97,
    scenes:[{headline:"THE FUTURE\nHAS A PULSE",subtext:"A live signal for the people already building tomorrow.",motionStyle:"orbit",cameraPath:"spiral-in",objectType:"neon torus"},{headline:"SEE THE\nUNSEEN",subtext:"Turn cultural noise into a point of view.",motionStyle:"glitch",cameraPath:"low-sweep",objectType:"crystal cluster"},{headline:"MAKE IT\nMOVE",subtext:"Ideas that refuse to sit still.",motionStyle:"bloom",cameraPath:"rise-through",objectType:"liquid chrome"},{headline:"YOUR WORLD.\nAMPLIFIED.",subtext:"The signal is yours to shape.",motionStyle:"magnetic",cameraPath:"pull-back",objectType:"luminous cube"},{headline:"STEP INTO\nTHE LIGHT",subtext:"Lumen is already on.",motionStyle:"reveal",cameraPath:"forward-flight",objectType:"sun disc"}] },
  { audience:"55 year old CFOs", brandName:"Lumen", product:"a culture intelligence platform", palette:["#171617","#D7C6A5","#E7E0D2","#809B91","#BC745D"], fontPairing:{display:"Cormorant Garamond",body:"IBM Plex Mono"}, mood:"assured, precise, quietly radical", shader:{noiseScale:1.2,speed:.42,distortion:.24,colorMix:.38}, soundscape:{tempo:74,scale:"Phrygian",filter:620}, callToAction:"Review the signal", qualityScore:96,
    scenes:[{headline:"CLARITY\nCOMPOUNDS",subtext:"The market moves quickly. Your point of view should move first.",motionStyle:"measured",cameraPath:"slow-orbit",objectType:"brushed sphere"},{headline:"FROM NOISE\nTO NORTH",subtext:"A sharper read on the forces shaping your category.",motionStyle:"parallax",cameraPath:"lateral-glide",objectType:"stone monolith"},{headline:"DECISIONS\nWITH DEPTH",subtext:"Make the next move with the whole picture in frame.",motionStyle:"focus",cameraPath:"dolly-forward",objectType:"glass lens"},{headline:"A SIGNAL\nWORTH TRUSTING",subtext:"Less theatre. More signal, with a human pulse.",motionStyle:"weightless",cameraPath:"tilt-up",objectType:"folded ribbon"},{headline:"LEAD\nTHE SHIFT",subtext:"See around the corner. Then make it yours.",motionStyle:"resolve",cameraPath:"wide-reveal",objectType:"brass arch"}] }
];

export function ensureContrast(palette: string[]) { return palette.map((color, i) => i === 0 ? color : color.toUpperCase()); }
