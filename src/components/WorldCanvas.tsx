"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { MeshTransmissionMaterial, Points, PointMaterial } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { SceneScript } from "@/lib/scene";

type Visual = SceneScript["visual"];
const initialMouse = new THREE.Vector2(0.5, 0.5);
const seeded = (index: number) => (Math.sin(index * 12.9898) * 43758.5453) % 1;
const shaderIndex: Record<Visual["shaderKind"], number> = { liquid: 0, scanlines: 1, aurora: 2, halftone: 3, contour: 4 };

function AdaptiveWorld({ divider, visual, palette, showSeam }: { divider: number; visual: Visual; palette: string[]; showSeam: boolean }) {
  const material = useRef<THREE.ShaderMaterial>(null); const mouse = useRef(new THREE.Vector2(0.5, 0.5));
  useFrame(({ clock, pointer }) => { mouse.current.lerp(new THREE.Vector2(pointer.x * .5 + .5, pointer.y * .5 + .5), .04); if (material.current) { material.current.uniforms.uTime.value = clock.elapsedTime; material.current.uniforms.uSeam.value = divider / 100; material.current.uniforms.uMouse.value = mouse.current; } });
  const colors = useMemo(() => [new THREE.Color(palette[0] || "#090a0c"), new THREE.Color(palette[1] || "#b7ff4a"), new THREE.Color(palette[2] || "#9be7ff")], [palette]);
  return <mesh><planeGeometry args={[2, 2]} /><shaderMaterial ref={material} uniforms={{ uTime: { value: 0 }, uSeam: { value: divider / 100 }, uMouse: { value: initialMouse }, uKind: { value: shaderIndex[visual.shaderKind] }, uShowSeam: { value: showSeam ? 1 : 0 }, uA: { value: colors[0] }, uB: { value: colors[1] }, uC: { value: colors[2] } }} vertexShader={vertex} fragmentShader={fragment} /></mesh>;
}

function HeroObject({ visual, palette, compact }: { visual: Visual; palette: string[]; compact: boolean }) {
  const ref = useRef<THREE.Group>(null); const color = palette[2] || "#f3f1eb";
  useFrame(({ clock, pointer }) => { if (ref.current) { const speed = visual.motion === "slow float" ? .04 : visual.motion === "glitch" ? .2 : .1; const jitter = visual.motion === "glitch" ? Math.sin(clock.elapsedTime * 18) * .018 : 0; ref.current.rotation.x = clock.elapsedTime * speed + pointer.y * .12 + jitter; ref.current.rotation.y = clock.elapsedTime * speed * 1.4 + pointer.x * .18; ref.current.position.x = pointer.x * .18; ref.current.position.y = pointer.y * .12 + Math.sin(clock.elapsedTime * speed) * .04; } });
  return <group ref={ref} position={[compact ? .32 : 0, compact ? -.48 : 0, 1.1]} scale={compact ? .62 : 1}>
    {visual.hero3d === "crystal" && <mesh><icosahedronGeometry args={[1.05, 3]} /><MeshTransmissionMaterial backside thickness={1.6} roughness={.08} chromaticAberration={.18} distortion={.32} distortionScale={.28} temporalDistortion={.12} transmission={1} color={color} /></mesh>}
    {visual.hero3d === "ribbon" && <mesh><torusKnotGeometry args={[.7, .12, 160, 24, 2, 3]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.8} metalness={.5} roughness={.2} /></mesh>}
    {visual.hero3d === "orb" && <mesh><sphereGeometry args={[.85, 48, 48]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.5} metalness={.1} roughness={.16} /></mesh>}
    {visual.hero3d === "grid" && <mesh rotation={[0, 0, Math.PI / 4]}><planeGeometry args={[1.7, 1.7, 12, 12]} /><meshBasicMaterial color={color} wireframe transparent opacity={.9} /></mesh>}
    {visual.hero3d === "spikes" && <mesh><coneGeometry args={[.85, 1.7, 8, 4]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.5} metalness={.7} roughness={.22} /></mesh>}
    {visual.hero3d === "bloom" && <mesh><sphereGeometry args={[.72, 32, 32]} /><meshBasicMaterial color={color} transparent opacity={.8} blending={THREE.AdditiveBlending} /></mesh>}
    <SoftGlowSprite color={color} />
  </group>;
}

function SoftGlowSprite({ color }: { color: string }) { const texture = useMemo(() => { const canvas = document.createElement("canvas"); canvas.width = canvas.height = 128; const context = canvas.getContext("2d")!; const gradient = context.createRadialGradient(64, 64, 2, 64, 64, 64); gradient.addColorStop(0, "rgba(255,255,255,.9)"); gradient.addColorStop(.25, `${color}cc`); gradient.addColorStop(1, "rgba(0,0,0,0)"); context.fillStyle = gradient; context.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(canvas); }, [color]); return <sprite scale={[2.8, 2.8, 1]} renderOrder={-1}><spriteMaterial map={texture} transparent depthWrite={false} blending={THREE.AdditiveBlending} opacity={.6} /></sprite>; }
function Particles({ tint }: { tint: string }) { const positions = useMemo(() => { const data = new Float32Array(9000); for (let i = 0; i < 3000; i++) { const radius = 2 + Math.abs(seeded(i * 2)) * 4; const angle = Math.abs(seeded(i * 2 + 1)) * Math.PI * 2; data[i * 3] = Math.cos(angle) * radius; data[i * 3 + 1] = Math.sin(angle) * radius; data[i * 3 + 2] = (Math.abs(seeded(i * 2 + 2)) - .5) * 2; } return data; }, []); const ref = useRef<THREE.Points>(null); useFrame(({ clock }) => { if (ref.current) { ref.current.rotation.z = clock.elapsedTime * .012; ref.current.rotation.y = Math.sin(clock.elapsedTime * .1) * .1; } }); return <Points ref={ref} positions={positions} stride={3}><PointMaterial transparent color={tint} size={.012} sizeAttenuation depthWrite={false} opacity={.52} blending={THREE.AdditiveBlending} /></Points>; }

export default function WorldCanvas({ divider = 50, activePalette = [], visual, compact = false }: { divider?: number; activePalette?: string[]; visual?: Visual; compact?: boolean }) { const chosen = visual || { layout: "cinematic", hero3d: "orb", shaderKind: "liquid", typeStyle: "geometric", motion: "parallax", cornerStyle: "round", grain: "light" } as Visual; return <div className={`world-canvas world-layout-${chosen.layout} world-type-${chosen.typeStyle.replaceAll(" ", "-")} world-corners-${chosen.cornerStyle} world-grain-${chosen.grain} ${compact ? "world-canvas-compact" : ""}`}><Canvas dpr={[1, 2]} camera={{ position: [0, 0, 4], fov: 45 }} gl={{ antialias: true, alpha: true }}><color attach="background" args={[activePalette[0] || "#050505"]} /><AdaptiveWorld divider={divider} visual={chosen} palette={activePalette} showSeam={!compact} /><Particles tint={activePalette[2] ?? "#f4f1ea"} /><HeroObject visual={chosen} palette={activePalette} compact={compact} /></Canvas></div>; }

const vertex = `varying vec2 vUv; void main(){vUv=uv;gl_Position=vec4(position,1.0);}`;
const fragment = `precision highp float; varying vec2 vUv; uniform float uTime; uniform float uSeam; uniform vec2 uMouse; uniform float uKind; uniform float uShowSeam; uniform vec3 uA; uniform vec3 uB; uniform vec3 uC; float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);} float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);} float fbm(vec2 p){float v=0.;float a=.5;for(int i=0;i<5;i++){v+=a*noise(p);p=p*2.02+uTime*.025;a*=.5;}return v;} void main(){vec2 uv=vUv;float n=fbm(uv*3.2+vec2(uTime*.035,-uTime*.02));float flow=fbm(uv*6.0+vec2(n*1.8,-uTime*.08));float scan=sin((uv.y+uTime*.08)*180.)*.08;float rings=abs(sin((length(uv-.5)+n*.08)*24.));float bands=step(.52,fract((uv.x+uv.y+n*.04)*9.));vec3 color=mix(uA,uB,flow);color=mix(color,uC,smoothstep(.62,1.,n));if(uKind>.5&&uKind<1.5)color+=scan;if(uKind>1.5&&uKind<2.5)color=mix(color,uC,smoothstep(.2,.9,sin(uv.x*5.+uTime*.12)*.5+.5));if(uKind>2.5&&uKind<3.5)color*=mix(.72,1.18,bands);if(uKind>3.5)color*=mix(.65,1.15,smoothstep(.25,.9,rings));if(uShowSeam>.5){float seam=uSeam+(uMouse.x-.5)*.12;float line=1.-smoothstep(.0,.008,abs(uv.x-seam));color+=line*vec3(1.,.94,.85)*.9;}color+=vec3(.025)*fbm(uv*28.);gl_FragColor=vec4(color,1.);}`;
