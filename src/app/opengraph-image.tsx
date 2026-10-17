import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "Lumen — one brand, every world";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() { return new ImageResponse(<div style={{ width:"100%", height:"100%", display:"flex", background:"#050505", color:"#f1eee5", fontFamily:"Arial", position:"relative", overflow:"hidden" }}><div style={{ position:"absolute", inset:0, display:"flex", background:"linear-gradient(115deg,#27104b 0%,#0e0718 49%,#0b2927 51%,#0d1717 100%)" }} /><div style={{ position:"absolute", left:575, top:0, width:4, height:630, background:"#fff", boxShadow:"0 0 32px #fff" }} /><div style={{ position:"relative", display:"flex", flexDirection:"column", justifyContent:"space-between", padding:"58px 64px", width:"100%" }}><div style={{ display:"flex", justifyContent:"space-between", fontSize:18, letterSpacing:5 }}><span>LUMEN / ADAPTIVE EXPERIENCE ENGINE</span><span>POWERED BY AMD ROCM</span></div><div style={{ display:"flex", flexDirection:"column", fontSize:116, lineHeight:.82, letterSpacing:-8, fontWeight:800 }}><span>One brand.</span><span>Every world.</span></div><div style={{ display:"flex", justifyContent:"space-between", fontSize:20, letterSpacing:3 }}><span>GEN Z GAMERS</span><span>55 YEAR OLD CFOS</span></div></div></div>, { ...size }); }
