import { z } from "zod";

export const SceneSchema = z.object({
  audience: z.string(), brandName: z.string(), product: z.string(),
  palette: z.array(z.string()).length(5), fontPairing: z.object({ display: z.string(), body: z.string() }), mood: z.string(),
  shader: z.object({ noiseScale: z.number(), speed: z.number(), distortion: z.number(), colorMix: z.number() }),
  scenes: z.array(z.object({ headline: z.string(), subtext: z.string(), motionStyle: z.string(), cameraPath: z.string(), objectType: z.string() })).length(5),
  soundscape: z.object({ tempo: z.number(), scale: z.string(), filter: z.number() }), callToAction: z.string(), qualityScore: z.number()
});
export type SceneScript = z.infer<typeof SceneSchema>;

export const PRESETS: SceneScript[] = [
  { audience:"Gen Z gamers", brandName:"Lumen", product:"a culture intelligence platform", palette:["#090A0C","#B7FF4A","#9BE7FF","#FF6B8A","#F1EEE6"], fontPairing:{display:"Space Grotesk",body:"Inter"}, mood:"electric, lucid, kinetic", shader:{noiseScale:2.4,speed:1.35,distortion:.72,colorMix:.62}, soundscape:{tempo:128,scale:"Dorian",filter:1800}, callToAction:"Enter the signal", qualityScore:97,
    scenes:[{headline:"THE FUTURE\nHAS A PULSE",subtext:"A live signal for the people already building tomorrow.",motionStyle:"orbit",cameraPath:"spiral-in",objectType:"neon torus"},{headline:"SEE THE\nUNSEEN",subtext:"Turn cultural noise into a point of view.",motionStyle:"glitch",cameraPath:"low-sweep",objectType:"crystal cluster"},{headline:"MAKE IT\nMOVE",subtext:"Ideas that refuse to sit still.",motionStyle:"bloom",cameraPath:"rise-through",objectType:"liquid chrome"},{headline:"YOUR WORLD.\nAMPLIFIED.",subtext:"The signal is yours to shape.",motionStyle:"magnetic",cameraPath:"pull-back",objectType:"luminous cube"},{headline:"STEP INTO\nTHE LIGHT",subtext:"Lumen is already on.",motionStyle:"reveal",cameraPath:"forward-flight",objectType:"sun disc"}] },
  { audience:"55 year old CFOs", brandName:"Lumen", product:"a culture intelligence platform", palette:["#171617","#D7C6A5","#E7E0D2","#809B91","#BC745D"], fontPairing:{display:"Cormorant Garamond",body:"IBM Plex Mono"}, mood:"assured, precise, quietly radical", shader:{noiseScale:1.2,speed:.42,distortion:.24,colorMix:.38}, soundscape:{tempo:74,scale:"Phrygian",filter:620}, callToAction:"Review the signal", qualityScore:96,
    scenes:[{headline:"CLARITY\nCOMPOUNDS",subtext:"The market moves quickly. Your point of view should move first.",motionStyle:"measured",cameraPath:"slow-orbit",objectType:"brushed sphere"},{headline:"FROM NOISE\nTO NORTH",subtext:"A sharper read on the forces shaping your category.",motionStyle:"parallax",cameraPath:"lateral-glide",objectType:"stone monolith"},{headline:"DECISIONS\nWITH DEPTH",subtext:"Make the next move with the whole picture in frame.",motionStyle:"focus",cameraPath:"dolly-forward",objectType:"glass lens"},{headline:"A SIGNAL\nWORTH TRUSTING",subtext:"Less theatre. More signal, with a human pulse.",motionStyle:"weightless",cameraPath:"tilt-up",objectType:"folded ribbon"},{headline:"LEAD\nTHE SHIFT",subtext:"See around the corner. Then make it yours.",motionStyle:"resolve",cameraPath:"wide-reveal",objectType:"brass arch"}] }
];

export function ensureContrast(palette: string[]) { return palette.map((color, i) => i === 0 ? color : color.toUpperCase()); }
