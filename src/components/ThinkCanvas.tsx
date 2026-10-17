"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

export type ThinkPhase = "idle" | "thinking" | "composing" | "ready";

const COUNT = 4000;
const seeded = (n: number) => Math.abs((Math.sin(n * 12.9898) * 43758.5453) % 1);
const idlePalette = ["#f5f6ff", "#d9d2ff"];

function paletteColor(value: string) { return new THREE.Color(value || "#f5f2e9"); }

function InstancedCloud({ phase, palette, progress }: { phase: ThinkPhase; palette: string[]; progress: number }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const seeds = useMemo(() => Array.from({ length: COUNT }, (_, index) => ({ x: seeded(index * 3) * 2 - 1, y: seeded(index * 3 + 1) * 2 - 1, z: seeded(index * 3 + 2) * 2 - 1, speed: .2 + seeded(index + 9) * .8, cluster: index % 5 })), []);
  const colors = useMemo(() => (palette.length >= 5 ? palette : idlePalette).map(paletteColor), [palette]);
  useFrame(({ clock, pointer }) => {
    if (!mesh.current) return;
    const time = clock.elapsedTime;
    const active = phase !== "idle";
    for (let index = 0; index < COUNT; index++) {
      const seed = seeds[index]; const cluster = active ? seed.cluster : 0; const angle = time * (.08 + seed.speed * .04) + seed.x * 5.2; const radius = active ? .34 + cluster * .08 : .32 + Math.abs(seed.z) * .95; let x = active ? seed.x * radius : Math.cos(angle + seed.y * 2.1) * radius; let y = active ? seed.y * radius : Math.sin(angle + seed.x * 2.1) * radius; let z = active ? seed.z * radius : seed.z * (.3 + Math.sin(time * .2 + seed.x) * .08);
      if (phase === "composing") { const burst = Math.min(1, progress * 1.3); x = x * (1 - burst) + Math.cos(angle) * (.2 + cluster * .13) * burst; y = y * (1 - burst) + Math.sin(angle) * (.2 + cluster * .13) * burst; z = z * (1 - burst) + Math.sin(angle * 1.7) * .16 * burst; }
      if (phase === "ready") { const merge = Math.min(1, progress || 1); x *= 1 - merge * .72; y *= 1 - merge * .72; z *= 1 - merge * .72; }
      const drift = active ? .02 : .08; x += Math.sin(time * seed.speed + seed.y) * drift + pointer.x * .035; y += Math.cos(time * seed.speed + seed.x) * drift + pointer.y * .035;
      dummy.position.set(x, y, z); const sizeTier = index % 3; const depth = THREE.MathUtils.clamp((z + 1) / 2, 0, 1); const size = phase === "ready" ? .014 : [.005, .009, .014][sizeTier] * (.65 + depth * .7); dummy.scale.setScalar(size); dummy.updateMatrix(); mesh.current.setMatrixAt(index, dummy.matrix); const particleColor = colors[active ? seed.cluster % colors.length : index % colors.length].clone().multiplyScalar(.38 + depth * .62); mesh.current.setColorAt(index, particleColor);
    }
    mesh.current.instanceMatrix.needsUpdate = true; if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true;
  });
  return <instancedMesh ref={mesh} args={[undefined, undefined, COUNT]} frustumCulled={false}><sphereGeometry args={[1, 5, 5]} /><meshBasicMaterial transparent opacity={.82} depthWrite={false} blending={THREE.AdditiveBlending} /></instancedMesh>;
}

function KeyForms({ phase, palette }: { phase: ThinkPhase; palette: string[] }) {
  const color = palette[0] || idlePalette[0];
  return <group visible={phase === "composing" || phase === "ready"}><mesh position={[-.72, .48, .1]}><sphereGeometry args={[.13, 16, 16]} /><meshBasicMaterial color={palette[1] || color} transparent opacity={.85} blending={THREE.AdditiveBlending} /></mesh><mesh position={[-.4, .48, .1]}><sphereGeometry args={[.1, 16, 16]} /><meshBasicMaterial color={palette[2] || color} transparent opacity={.8} blending={THREE.AdditiveBlending} /></mesh><mesh position={[.56, .12, .1]} rotation={[0, 0, -.4]}><torusGeometry args={[.2, .012, 8, 48]} /><meshBasicMaterial color={palette[3] || color} transparent opacity={.8} blending={THREE.AdditiveBlending} /></mesh><mesh position={[.62, -.44, .1]}><ringGeometry args={[.18, .2, 32]} /><meshBasicMaterial color={palette[4] || color} transparent opacity={.8} blending={THREE.AdditiveBlending} /></mesh></group>;
}

function CoreGlow() { return <><mesh><sphereGeometry args={[.16, 20, 20]} /><meshBasicMaterial color="#eeeaff" transparent opacity={.16} blending={THREE.AdditiveBlending} depthWrite={false} /></mesh><pointLight color="#d9d2ff" intensity={1.4} distance={2.4} /></>; }

function SoftGlowSprite() { const texture = useMemo(() => { const canvas = document.createElement("canvas"); canvas.width = canvas.height = 128; const context = canvas.getContext("2d")!; const gradient = context.createRadialGradient(64, 64, 1, 64, 64, 64); gradient.addColorStop(0, "rgba(255,255,255,.82)"); gradient.addColorStop(.2, "rgba(217,210,255,.48)"); gradient.addColorStop(1, "rgba(217,210,255,0)"); context.fillStyle = gradient; context.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(canvas); }, []); return <sprite scale={[1.7, 1.7, 1]} renderOrder={-1}><spriteMaterial map={texture} transparent depthTest={false} depthWrite={false} blending={THREE.AdditiveBlending} opacity={.55} /></sprite>; }

export default function ThinkCanvas({ phase, palette, progress }: { phase: ThinkPhase; palette: string[]; progress: number }) { const activePalette = phase === "idle" || phase === "thinking" ? idlePalette : palette; return <Canvas className="think-r3f" dpr={[1, 2]} camera={{ position: [0, 0, 3], fov: 42 }} gl={{ alpha: true, antialias: true, premultipliedAlpha: true }}><color attach="background" args={["#080808"]} /><fog attach="fog" args={["#080808", 1.4, 4.1]} /><SoftGlowSprite /><CoreGlow /><InstancedCloud phase={phase} palette={activePalette} progress={progress} /><KeyForms phase={phase} palette={activePalette} /></Canvas>; }
