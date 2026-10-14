"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { MeshTransmissionMaterial, Points, PointMaterial } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const initialMouse = new THREE.Vector2(0.5, 0.5);
const seeded = (index: number) => (Math.sin(index * 12.9898) * 43758.5453) % 1;

function LiquidWorld({ divider }: { divider: number }) {
  const material = useRef<THREE.ShaderMaterial>(null);
  const mouse = useRef(new THREE.Vector2(0.5, 0.5));
  useFrame(({ clock, pointer }) => { mouse.current.lerp(new THREE.Vector2(pointer.x * .5 + .5, pointer.y * .5 + .5), .04); if (material.current) { material.current.uniforms.uTime.value = clock.elapsedTime; material.current.uniforms.uSeam.value = divider / 100; material.current.uniforms.uMouse.value = mouse.current; } });
  return <mesh scale={[1, 1, 1]}><planeGeometry args={[2, 2]} /><shaderMaterial ref={material} uniforms={{ uTime: { value: 0 }, uSeam: { value: divider / 100 }, uMouse: { value: initialMouse } }} vertexShader={vertex} fragmentShader={fragment} /></mesh>;
}

function GlassObject() { const ref = useRef<THREE.Mesh>(null); useFrame(({ clock, pointer }) => { if (ref.current) { ref.current.rotation.x = clock.elapsedTime * .08 + pointer.y * .12; ref.current.rotation.y = clock.elapsedTime * .12 + pointer.x * .18; ref.current.position.x = pointer.x * .18; ref.current.position.y = pointer.y * .12; } }); return <mesh ref={ref} position={[0, 0, 1.1]}><icosahedronGeometry args={[1.05, 5]} /><MeshTransmissionMaterial backside thickness={1.6} roughness={.08} chromaticAberration={.18} anisotropy={.2} distortion={.32} distortionScale={.28} temporalDistortion={.12} transmission={1} color="#f3f1eb" /></mesh>; }

function Particles({ tint }: { tint: string }) { const positions = useMemo(() => { const data = new Float32Array(9000); for (let i = 0; i < 3000; i++) { const radius = 2 + Math.abs(seeded(i * 2)) * 4; const angle = Math.abs(seeded(i * 2 + 1)) * Math.PI * 2; data[i * 3] = Math.cos(angle) * radius; data[i * 3 + 1] = Math.sin(angle) * radius; data[i * 3 + 2] = (Math.abs(seeded(i * 2 + 2)) - .5) * 2; } return data; }, []); const ref = useRef<THREE.Points>(null); useFrame(({ clock }) => { if (ref.current) { ref.current.rotation.z = clock.elapsedTime * .012; ref.current.rotation.y = Math.sin(clock.elapsedTime * .1) * .1; } }); return <Points ref={ref} positions={positions} stride={3}><PointMaterial transparent color={tint} size={.012} sizeAttenuation depthWrite={false} opacity={.52} /></Points>; }

export default function WorldCanvas({ divider = 50, activePalette = [], compact = false }: { divider?: number; activePalette?: string[]; compact?: boolean }) { return <div className={`world-canvas ${compact ? "world-canvas-compact" : ""}`}><Canvas dpr={[1, 2]} camera={{ position: [0, 0, 4], fov: 45 }} gl={{ antialias: true, alpha: true }}><color attach="background" args={["#050505"]} /><LiquidWorld divider={divider} /><Particles tint={activePalette[2] ?? "#f4f1ea"} /><GlassObject /></Canvas></div>; }

const vertex = `varying vec2 vUv; void main(){vUv=uv;gl_Position=vec4(position,1.0);}`;
const fragment = `precision highp float; varying vec2 vUv; uniform float uTime; uniform float uSeam; uniform vec2 uMouse; float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);} float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);} float fbm(vec2 p){float v=0.;float a=.5;for(int i=0;i<5;i++){v+=a*noise(p);p=p*2.02+uTime*.025;a*=.5;}return v;} void main(){vec2 uv=vUv;float seam=uSeam+(uMouse.x-.5)*.12;float n=fbm(uv*3.2+vec2(uTime*.035,-uTime*.02));float flow=fbm(uv*6.0+vec2(n*1.8,-uTime*.08));vec3 left=mix(vec3(.18,.02,.34),vec3(.75,.04,.55),flow);left=mix(left,vec3(.02,.65,.9),smoothstep(.62,1.,n));vec3 right=mix(vec3(.55,.2,.03),vec3(.02,.25,.27),flow);right=mix(right,vec3(.92,.86,.68),smoothstep(.58,1.,n));vec3 color=mix(left,right,smoothstep(seam-.015,seam+.015,uv.x));float line=1.-smoothstep(.0,.008,abs(uv.x-seam));color+=line*vec3(1.,.94,.85)*.9;color+=vec3(.025)*fbm(uv*28.);gl_FragColor=vec4(color,1.);}`;
